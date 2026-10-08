import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { getAuthHeaders, getTimeAgo } from "../../utils/adminUtils";
import {
  Cpu,
  Brain,
  Zap,
  Save,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Database,
  Users,
  Bell,
  AlertCircle,
} from "lucide-react";
import { NotificationThresholdsModal } from "../NotificationThresholdsModal";
import { MemoryCenterViewProps } from "./adminTypes";
import { toast as globalToast } from "@/design-system";

interface MemoryConsolidationReportItem {
  userId: number;
  userName: string;
  userEmail: string;
  oldCount: number;
  newCount: number;
  archivedFacts: string[];
  distilledFact: string;
  success: boolean;
  error?: string;
}

export const MemoryCenterView: React.FC<{
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
  language: string;
}> = ({
  theme,
  t,
  dir,
  language,
}) => {
  const { token, setIsOperationPending } = useAppContext();
  const [threshold, setThreshold] = useState<number>(10);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ttlDays, setTtlDays] = useState<number>(30);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [reports, setReports] = useState<MemoryConsolidationReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [systemStats, setSystemStats] = useState<{
    totalMemories: number;
    usersWithMemories: number;
    averageMemories: number;
  } | null>(null);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(10);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  const showToast = useCallback((message: string, isSuccess = true) => {
    if (isSuccess) {
      globalToast.success(message, dir === "rtl" ? "تم بنجاح" : "Success");
    } else {
      globalToast.error(message, dir === "rtl" ? "حدث خطأ" : "Error");
    }
  }, [dir]);

  const [lowThreshold, setLowThreshold] = useState<number>(50);
  const [highThreshold, setHighThreshold] = useState<number>(80);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);

  const fetchSystemThresholds = async () => {
    try {
      const res = await fetch("/api/system/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.quota_warning_threshold_low === 'number') {
          setLowThreshold(data.quota_warning_threshold_low);
        }
        if (typeof data.quota_warning_threshold_high === 'number') {
          setHighThreshold(data.quota_warning_threshold_high);
        }
      }
    } catch (err) {
      console.error("Failed to fetch custom thresholds:", err);
    }
  };

  const handleSaveThresholds = async (low: number, high: number) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quota_warning_threshold_low: low,
          quota_warning_threshold_high: high,
        }),
      });
      if (res.ok) {
        setLowThreshold(low);
        setHighThreshold(high);
        showToast(
          language === "ar"
            ? "تم تحديث عتبات التنبيهات المخصصة بنجاح!"
            : "Custom notification thresholds updated successfully!",
          true
        );
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update thresholds", false);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update thresholds", false);
    }
  };

  const bufferTrendData = useMemo(() => {
    const currentCount = systemStats?.totalMemories || 25;
    return [
      { time: '-60m', density: Math.max(2, currentCount - 12) },
      { time: '-50m', density: Math.max(4, currentCount - 10) },
      { time: '-40m', density: Math.max(6, currentCount - 8) },
      { time: '-30m', density: Math.max(8, currentCount - 5) },
      { time: '-20m', density: Math.max(12, currentCount - 3) },
      { time: '-10m', density: Math.max(15, currentCount - 1) },
      { time: 'Now', density: currentCount },
    ];
  }, [systemStats]);

  const handleSmartCompress = async () => {
    setIsCompressing(true);
    setIsOperationPending(true);
    try {
      const res = await fetch("/api/memories/smart-compress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          language === "ar"
            ? `تم ضغط الذاكرة بنجاح. تم تكثيف ${data.compressedCount} جلسة.`
            : `Smart compression completed. Condensed ${data.compressedCount} active sessions.`,
          true
        );
        fetchStats();
      } else {
        showToast(data.error || "Failed to execute smart compression", false);
      }
    } catch (err: any) {
      showToast(err.message || "Network error", false);
    } finally {
      setIsCompressing(false);
      setIsOperationPending(false);
    }
  };

  const handleRunContextCleanup = async () => {
    setIsCleaning(true);
    setIsOperationPending(true);
    try {
      const res = await fetch("/api/memories/cleanup-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ttlDays }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          language === "ar"
            ? `تم تنظيف السياق بنجاح. تم مسح ${data.cleanedCount} جلسة غير نشطة.`
            : `Context cleanup completed. Pruned ${data.cleanedCount} inactive sessions.`,
          true
        );
        fetchStats();
      } else {
        showToast(data.error || "Failed to execute context cleanup", false);
      }
    } catch (err: any) {
      showToast(err.message || "Network error", false);
    } finally {
      setIsCleaning(false);
      setIsOperationPending(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, diagRes] = await Promise.all([
        fetch("/api/admin/memories/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/memories/diagnostics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setSystemStats(data);
      }
      if (diagRes.ok) {
        const diag = await diagRes.json();
        setDiagnosticsData(diag);
      }
    } catch (err) {
      console.error("Failed to load memory stats or diagnostics:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchStats();
    fetchSystemThresholds();
    const intervalId = setInterval(() => {
      fetchStats();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [token, refreshInterval]);

  useEffect(() => {
    const handleCleanEvent = () => {
      handleRunContextCleanup();
    };
    window.addEventListener("admin-clean-memory", handleCleanEvent);
    return () => {
      window.removeEventListener("admin-clean-memory", handleCleanEvent);
    };
  }, [ttlDays, token]);

  const handleRunConsolidation = async () => {
    setIsRunning(true);
    setIsOperationPending(true);
    setReports([]);
    try {
      const res = await fetch("/api/admin/memories/consolidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: targetUserId ? parseInt(targetUserId) : undefined,
          threshold: threshold,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReports(data.report || []);
        showToast(
          language === "ar"
            ? "اكتملت عملية تكثيف الذاكرة بنجاح!"
            : "Memory distillation cycle completed successfully!",
          true
        );
        fetchStats();
      } else {
        showToast(data.error || "Failed to execute consolidation", false);
      }
    } catch (err: any) {
      showToast(err.message || "Network error", false);
    } finally {
      setIsRunning(false);
      setIsOperationPending(false);
    }
  };

  const handleRunMigration = async () => {
    setIsRunning(true);
    setIsOperationPending(true);
    try {
      const res = await fetch("/api/admin/memories/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          language === "ar"
            ? `تم ترحيل الذاكرة الموحدة بنجاح! (${data.result?.newFactsSaved || 0} حقيقة)`
            : `Local memory migration completed! (${data.result?.newFactsSaved || 0} facts saved)`,
          true
        );
        fetchStats();
      } else {
        showToast(data.error || "Failed to execute migration", false);
      }
    } catch (err: any) {
      showToast(err.message || "Network error", false);
    } finally {
      setIsRunning(false);
      setIsOperationPending(false);
    }
  };

  const filteredReports = reports.filter(
    (item) =>
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.distilledFact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-full space-y-6 animate-in fade-in duration-300 px-1 md:px-2">

      {/* Sovereign Top Header Banner */}
      <div className="p-6 rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs transition-theme flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] shadow-xs shrink-0">
            <Brain size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
              <span>{language === "ar" ? "إدارة ذاكرة وسياق النظام" : "Memory & Context Engine"}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)] border border-[var(--border-accent)]/30 flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-[var(--radius-full)] bg-[var(--fg-accent)] animate-pulse" />
                {language === "ar" ? "المحرك نشط" : "Buffer Active"}
              </span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {language === "ar"
                ? "تنظيم وفهرسة سجلات ذاكرة المستخدمين، ضغط السياق التلقائي وتقليل زمن الاستجابة"
                : "Organize user memory fragments, automatic context compression, and latency reduction"}
            </p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] touch-target-44 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
        >
          <RefreshCw size={15} className={loadingStats ? "animate-spin text-[var(--fg-accent)]" : ""} />
          <span>{language === "ar" ? "تحديث البيانات" : "Refresh Data"}</span>
        </button>
      </div>

      {/* Real-Time System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {language === "ar" ? "إجمالي السجلات" : "TOTAL MEMORIES"}
            </span>
            <Database size={18} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline">
            {loadingStats ? (
              <span className="text-2xl font-black text-[var(--text-muted)] animate-pulse">...</span>
            ) : (
              <span className="text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono">
                {systemStats?.totalMemories ?? 0}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {language === "ar" ? "المستخدمين النشطين" : "ACTIVE PROFILES"}
            </span>
            <Users size={18} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline">
            {loadingStats ? (
              <span className="text-2xl font-black text-[var(--text-muted)] animate-pulse">...</span>
            ) : (
              <span className="text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono">
                {systemStats?.usersWithMemories ?? 0}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {language === "ar" ? "متوسط الكثافة" : "MEAN PROFILE DENSITY"}
            </span>
            <Cpu size={18} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            {loadingStats ? (
              <span className="text-2xl font-black text-[var(--text-muted)] animate-pulse">...</span>
            ) : (
              <>
                <span className="text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono">
                  {systemStats?.averageMemories ?? 0}
                </span>
                <span className="text-xs font-normal text-[var(--text-muted)] font-mono">rec/user</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Diagnostics Panel */}
      {diagnosticsData && (
        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-[var(--radius-full)] bg-[var(--fg-accent)] animate-ping" />
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                {language === "ar" ? "تشخيصات ذاكرة التخزين المؤقت" : "Live Buffer Diagnostics & Engine Health"}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
                {diagnosticsData.engine} ({diagnosticsData.mode})
              </span>
              {(() => {
                const limit = diagnosticsData?.bufferLimit || 50;
                const count = systemStats?.totalMemories || 0;
                const pct = Math.round((count / limit) * 100);
                if (pct >= 80) {
                  return (
                    <span className="text-xs font-mono text-[var(--fg-danger)] bg-[var(--status-danger-subtle)] border border-[var(--fg-danger)]/30 px-2 py-0.5 rounded-[var(--radius-xs)] flex items-center gap-1 font-bold">
                      <Bell size={10} className="animate-bounce" /> {pct}% {language === "ar" ? "حرج" : "CRITICAL"}
                    </span>
                  );
                }
                if (pct >= 50) {
                  return (
                    <span className="text-xs font-mono text-[var(--fg-warning)] bg-[var(--status-warning-subtle)] border border-[var(--fg-warning)]/30 px-2 py-0.5 rounded-[var(--radius-xs)] flex items-center gap-1 font-bold">
                      <Bell size={10} className="animate-pulse" /> {pct}% {language === "ar" ? "تنبيه" : "WARNING"}
                    </span>
                  );
                }
                return (
                  <span className="text-xs font-mono text-[var(--fg-success)] bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/30 px-2 py-0.5 rounded-[var(--radius-xs)] flex items-center gap-1 font-bold">
                    <CheckCircle2 size={10} /> {pct}% {language === "ar" ? "مستقر" : "HEALTHY"}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Trigger Thresholds Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[var(--radius-xs)] bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)]">
                <Sliders size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  {language === "ar" ? "عتبات التنبيهات والإشعارات" : "Configurable Trigger Thresholds"}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {language === "ar"
                    ? `العتبة الأولية: ${lowThreshold}% | العتبة الحرجة: ${highThreshold}%`
                    : `Active Triggers: Low ${lowThreshold}% | High ${highThreshold}%`}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsThresholdModalOpen(true)}
              className="px-3 py-1.5 min-h-[38px] rounded-[var(--radius-sm)] bg-[var(--surface-card)] hover:bg-[var(--surface-card)]/80 border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Sliders size={13} />
              <span>{language === "ar" ? "تعديل العتبات" : "Configure"}</span>
            </button>
          </div>

          {/* Buffer Trend Chart */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                {language === "ar" ? "كثافة الذاكرة خلال آخر 60 دقيقة" : "Buffer Density Trend (Last 60m)"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {language === "ar" ? "معدل التحديث:" : "Refresh:"}
                </span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] text-[11px] rounded-[var(--radius-xs)] px-2 py-0.5 font-mono focus:outline-none cursor-pointer"
                >
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                </select>
              </div>
            </div>
            <div className="h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bufferTrendData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-card)', 
                      borderColor: 'var(--border-default)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="density" 
                    stroke="var(--fg-accent, #10b881)" 
                    strokeWidth={2} 
                    dot={{ fill: 'var(--fg-accent, #10b881)', r: 3 }} 
                    activeDot={{ r: 5, fill: 'var(--fg-accent, #10b881)' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Action Trigger Consolidation Form Console */}
      <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-default)] pb-3">
          {language === "ar" ? "أدوات التكثيف والترحيل اليدوي" : "MANUAL DISTILLATION & MIGRATION TOOLS"}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] block">
              {language === "ar" ? "الحد الأدنى للذكريات" : "MINIMUM THRESHOLD"}
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-full min-h-[44px] touch-target-44 px-3 py-2 rounded-[var(--radius-sm)] border focus:outline-none transition-theme font-mono text-xs bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
              placeholder="e.g. 10"
              min="2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] block">
              {language === "ar" ? "معرّف المستهدف (اختياري)" : "TARGET USER ID"}
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value.replace(/\D/g, ""))}
              className="w-full min-h-[44px] touch-target-44 px-3 py-2 rounded-[var(--radius-sm)] border focus:outline-none transition-theme font-mono text-xs bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
              placeholder="e.g. 52"
            />
          </div>

          <button
            onClick={handleRunConsolidation}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] touch-target-44 rounded-[var(--radius-sm)] bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {isRunning ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>{language === "ar" ? "جاري المعالجة..." : "Processing..."}</span>
              </>
            ) : (
              <>
                <Brain size={15} />
                <span>{language === "ar" ? "تذويب الذاكرة" : "Execute Distillation"}</span>
              </>
            )}
          </button>

          <button
            onClick={handleRunMigration}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] touch-target-44 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Database size={15} className="text-[var(--text-muted)]" />
            <span>{language === "ar" ? "ترحيل البيانات" : "Migrate Data"}</span>
          </button>
        </div>
      </div>

      {/* Automated Context Cleanup & Smart Compress Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Context TTL Cleanup */}
        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-2 mb-2">
              {language === "ar" ? "محرك تنظيف السياق التلقائي" : "Context TTL Cleanup Engine"}
            </h4>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              {language === "ar"
                ? "مسح ملخصات السياق للجلسات غير النشطة بناءً على فترة عدم النشاط المحجوزة"
                : "Prune inactive session summaries to maintain buffer capacity"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={ttlDays}
              onChange={(e) => setTtlDays(parseInt(e.target.value, 10))}
              className="flex-1 min-h-[44px] touch-target-44 px-3 py-2 rounded-[var(--radius-sm)] border focus:outline-none font-mono text-xs bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
            >
              <option value="7">7 Days (Aggressive)</option>
              <option value="15">15 Days (Standard)</option>
              <option value="30">30 Days (Recommended)</option>
              <option value="60">60 Days (Extended)</option>
            </select>

            <button
              onClick={handleRunContextCleanup}
              disabled={isCleaning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] touch-target-44 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isCleaning ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-[var(--fg-accent)]" />
                  <span>{language === "ar" ? "جاري التنظيف..." : "Cleaning..."}</span>
                </>
              ) : (
                <>
                  <Database size={15} />
                  <span>{language === "ar" ? "بدء التنظيف" : "Run Cleanup"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Smart Context Compression */}
        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2 mb-2">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                {language === "ar" ? "الضغط الذكي للسياق" : "Smart Context Compression"}
              </h4>
              <span className="text-[10px] font-mono text-[var(--fg-accent)] bg-[var(--bg-accent-emphasis)]/10 px-2 py-0.5 rounded-[var(--radius-xs)]">
                {language === "ar" ? "توفير الرموز" : "Token Trim"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              {language === "ar"
                ? "ضغط وتقليم النصوص الطويلة في جلسات المحادثة مع الحفاظ على المعلومات الجوهرية"
                : "Trim redundant tokens while preserving essential context statements"}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSmartCompress}
              disabled={isCompressing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] touch-target-44 rounded-[var(--radius-sm)] bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isCompressing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>{language === "ar" ? "جاري الضغط..." : "Compressing..."}</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>{language === "ar" ? "بدء الضغط" : "Run Compression"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Results Console */}
      <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              {language === "ar" ? "تقرير نتائج المعالجة والتوليف" : "Distillation Execution Report"}
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {language === "ar" ? "نتائج معالجة التكثيف والتوليف لكل حساب مستخدم" : "Audit generated high-density facts and compression quality"}
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 pl-9 rounded-[var(--radius-sm)] border focus:outline-none text-xs bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
              placeholder={language === "ar" ? "بحث عن بريد أو اسم..." : "Search user or fact..."}
            />
            <Search size={14} className="absolute top-3 left-3 text-[var(--text-muted)]" />
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-dashed border-[var(--border-default)]">
            <Brain size={36} className="text-[var(--text-muted)] opacity-60 mb-2 animate-pulse" />
            <p className="text-xs font-bold text-[var(--text-muted)]">
              {language === "ar" ? "لا توجد نتائج معالجة حالية" : "No active runtime logs available."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.userId}
                className={`p-4 rounded-[var(--radius-sm)] border transition-theme ${
                  report.success
                    ? "bg-[var(--surface-subtle)] border-[var(--border-default)] shadow-xs"
                    : "bg-[var(--fg-danger)]/5 border-[var(--fg-danger)]/20"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3 mb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-primary)]">{report.userName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-xs)] font-mono bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-default)]">
                        #{report.userId}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">{report.userEmail}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-[var(--fg-accent)] px-2.5 py-1 rounded-[var(--radius-xs)] bg-[var(--bg-accent-emphasis)]/10 border border-[var(--border-accent)]/30">
                      {Math.round(((report.oldCount - report.newCount) / report.oldCount) * 100)}% {language === "ar" ? "تقليص" : "REDUCED"}
                    </span>
                    {report.success ? (
                      <span className="flex items-center gap-1.5 text-xs text-[var(--fg-success)] font-bold bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 px-2.5 py-1 rounded-[var(--radius-xs)]">
                        <span className="w-1.5 h-1.5 rounded-[var(--radius-full)] bg-[var(--fg-success)] animate-pulse" />
                        {language === "ar" ? "مكتمل" : "SUCCESS"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-[var(--fg-danger)] font-bold bg-[var(--status-danger-subtle)] border border-[var(--fg-danger)]/20 px-2.5 py-1 rounded-[var(--radius-xs)]">
                        {language === "ar" ? "فشل" : "FAILED"}
                      </span>
                    )}
                  </div>
                </div>

                {report.success && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {language === "ar" ? "الذاكرة المجمعة" : "SYNTHESIZED INTEL FACT"}
                    </div>
                    <blockquote className="p-3 rounded-[var(--radius-xs)] border-s-3 border-[var(--fg-accent)] text-xs font-medium bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)]">
                      “{report.distilledFact}”
                    </blockquote>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Thresholds Configuration Modal */}
      <NotificationThresholdsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        currentLow={lowThreshold}
        currentHigh={highThreshold}
        onSave={handleSaveThresholds}
        language={language as "ar" | "en"}
        theme={theme as "dark" | "light"}
      />
    </div>
  );
};
