import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { getTimeAgo } from "../../utils/adminUtils";
import {
  Activity,
  Key,
  Database,
  Cpu,
  Landmark,
  CreditCard,
  Users,
  Settings,
  TrendingUp,
  Zap,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Globe,
  ShieldAlert,
  Search,
  Trash2,
  X,
  Shield,
  ShieldCheck,
  Settings2,
  ChevronDown,
  BellRing,
} from "lucide-react";
import { ActionConfirmationModal } from "../ActionConfirmationModal";
import { HighlightText } from "../HighlightText";
import { CommandCenterViewProps } from "./adminTypes";
import { SelectDropdown } from "../../design-system";

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  theme,
  t,
  showToast = () => {},
}) => {
  const { token, language, socket, dir } = useAppContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    monthlyRevenue: number;
    activeUsersToday: number;
    aiGenerations: number;
    systemHealth: string;
  } | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logToolFilter, setLogToolFilter] = useState("all");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");
  const [apiHealth, setApiHealth] = useState<any[]>([]);
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reconnectingPool, setReconnectingPool] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const handleForceReconnect = async (poolName: string) => {
    try {
      setReconnectingPool(poolName);
      const res = await fetch('/api/admin/reconnect-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ poolName })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Reconnect failed');
      }
      
      const healthRes = await fetch("/api/admin/health", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (healthRes.ok) {
        setServerHealth(await healthRes.json());
      }
    } catch (err: any) {
      console.error('Failed to force reconnect pool:', err);
      showToast(err.message || 'Failed to reconnect pool', 'error');
    } finally {
      setReconnectingPool(null);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string | { ar: string; en: string };
    description: string | { ar: string; en: string };
    variant?: 'danger' | 'success' | 'warning' | 'info';
    confirmLabel?: string | { ar: string; en: string };
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Cache-Control": "no-cache",
      };
      const [statsRes, alertsRes, activityRes, apiRes, healthRes] =
        await Promise.all([
          fetch("/api/admin/stats", { headers }),
          fetch("/api/admin/security-alerts", { headers }),
          fetch("/api/admin/activity-stream", { headers }),
          fetch("/api/admin/api-keys", { headers }),
          fetch("/api/admin/health", { headers }),
        ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
      if (healthRes.ok) setServerHealth(await healthRes.json());
      if (apiRes.ok) {
        const data = await apiRes.json();
        setApiHealth(Array.isArray(data) ? data : data.keys || []);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Failed to fetch") {
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "[Admin] Initial fetch failed, likely server starting...",
          );
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching admin data:", error);
        }
      }
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, [token]);

  useEffect(() => {
    if (token && !hasFetched.current) {
      fetchData();
    }

    // Live Broadcasting Listener
    if (socket) {
      const handleNewActivity = (log: any) => {
        setActivity((prev) => [log, ...prev].slice(0, 50));
      };

      const handleNewAiLog = (log: any) => {
        setActivity((prev) => [log, ...prev].slice(0, 50));
      };

      const handleStatsUpdate = (newStats: any) => {
        if (newStats) setStats(newStats);
      };

      socket.on("new_system_activity", handleNewActivity);
      socket.on("new_ai_log", handleNewAiLog);
      socket.on("admin_stats_update", handleStatsUpdate);

      return () => {
        socket.off("new_system_activity", handleNewActivity);
        socket.off("new_ai_log", handleNewAiLog);
        socket.off("admin_stats_update", handleStatsUpdate);
      };
    }
  }, [token, socket, fetchData]);

  const handleDeleteActivity = (id: string, type: string) => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: { ar: "حذف السجل؟", en: "Delete Log?" },
      description: {
        ar: language === "ar" ? "هل أنت متأكد من حذف هذا السجل بشكل نهائي؟" : "Are you sure you want to delete this log?",
        en: t("deleteLogConfirm") || "Are you sure you want to delete this log?"
      },
      variant: 'danger',
      onConfirm: async () => {
        const backendType = "log";
        try {
          const res = await fetch(`/api/admin/activity/${id}/${backendType}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setActivity((prev) =>
              prev.filter((a) => String(a.id) !== String(id)),
            );
            setSelectedActivityIds((prev) => prev.filter((item) => String(item) !== String(id)));
            showToast(t("logDeleted") || (language === "ar" ? "تم حذف السجل بنجاح" : "Log deleted successfully"), "success");
            fetchData();
          }
        } catch (err) {
          console.error("Failed to delete activity log", err);
        }
      }
    });
  };

  const handleDeleteAlert = (id: string) => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: { ar: "حذف الإنذار؟", en: "Delete Alert?" },
      description: {
        ar: language === "ar" ? "هل أنت متأكد من حذف هذا الإنذار الأمني؟" : "Are you sure you want to delete this safety alert?",
        en: t("deleteAlertConfirm") || "Are you sure you want to delete this alert?"
      },
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/security-alerts/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setAlerts((prev) => prev.filter((a) => a.id !== id));
            showToast(language === "ar" ? "تم الحذف بنجاح" : "Deleted successfully", "success");
          }
        } catch (err) {
          console.error("Failed to delete alert", err);
        }
      }
    });
  };

  const handleBulkDeleteActivity = (type: "ai_generation" | "system_event" | "all" | "log") => {
    if (!token) return;
    const mappedType = type;
    const typeLabel =
      mappedType === "ai_generation"
        ? language === "ar"
          ? "الذكاء الاصطناعي"
          : "AI"
        : mappedType === "system_event"
        ? language === "ar"
          ? "النظام"
          : "System"
        : language === "ar"
        ? "كل السجلات"
        : "All Logs";

    const confirmMsg = t("bulkDeleteActivityConfirm")?.replace("{type}", typeLabel) || 
      (language === "ar" ? `هل أنت متأكد من حذف كافة سجلات ${typeLabel}؟` : `Are you sure you want to delete all ${typeLabel} logs?`);

    setConfirmModal({
      isOpen: true,
      title: { ar: "تطهير السجلات؟", en: "Bulk Delete Logs?" },
      description: {
        ar: confirmMsg,
        en: confirmMsg
      },
      variant: 'danger',
      onConfirm: async () => {
        const backendType = mappedType === "ai_generation" ? "ai" : (mappedType === "system_event" ? "system" : "log");
        try {
          const res = await fetch(`/api/admin/activity/all/${backendType}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            if (mappedType === "ai_generation") {
              setActivity((prev) => prev.filter((a) => a.type !== "ai_generation"));
            } else if (mappedType === "system_event") {
              setActivity((prev) => prev.filter((a) => a.type !== "system_event"));
            } else {
              setActivity([]);
            }
            showToast(t("activityCleared") || (language === "ar" ? "تم تطهير السجلات بنجاح" : "Records cleared successfully"), "success");
            fetchData();
          }
        } catch (err) {
          console.error("Bulk delete failed", err);
        }
      }
    });
  };

  const handleBulkDeleteAlerts = () => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: { ar: "تطهير كافة الإنذارات؟", en: "Wipe All Alerts?" },
      description: {
        ar: language === "ar" ? "هل أنت متأكد من حذف كافة الإنذارات الأمنية من السجل؟" : "Are you sure you want to clear all safety alerts?",
        en: t("bulkDeleteAlertsConfirm") || "Are you sure you want to clear all safety alerts?"
      },
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/activity/all/alert", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setAlerts([]);
            showToast(t("alertsCleared") || "Alerts cleared", "success");
          }
        } catch (err) {
          console.error("Bulk delete failed", err);
        }
      }
    });
  };

  const handleBatchDelete = (type: "activity" | "alert") => {
    if (!token) return;
    const ids = type === "activity" ? selectedActivityIds : selectedAlertIds;
    if (ids.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: { ar: "حذف العناصر المحددة؟", en: "Delete Selected Items?" },
      description: {
        ar: t("batchDeleteConfirm")?.replace("{count}", ids.length.toString()) || `هل أنت متأكد من حذف ${ids.length} من العناصر المحددة؟`,
        en: t("batchDeleteConfirm")?.replace("{count}", ids.length.toString()) || `Are you sure you want to delete the ${ids.length} selected items?`
      },
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/activity/batch-delete", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids, type: type === "activity" ? "log" : "alert" }),
          });

          if (res.ok) {
            const strIds = ids.map(String);
            if (type === "activity") {
              setActivity((prev) => prev.filter((a) => !strIds.includes(String(a.id))));
              setSelectedActivityIds([]);
            } else {
              setAlerts((prev) => prev.filter((a) => !strIds.includes(String(a.id))));
              setSelectedAlertIds([]);
            }
            showToast(
              t("batchDeleteSuccess")?.replace("{count}", ids.length.toString()) || "Batch delete successful",
              "success",
            );
            fetchData(); // Refresh counts in KPI
          }
        } catch (err) {
          console.error("Batch delete failed", err);
        }
      }
    });
  };

  const handleSelectAll = (type: "activity" | "alert") => {
    if (type === "activity") {
      if (selectedActivityIds.length === activity.length) {
        setSelectedActivityIds([]);
      } else {
        setSelectedActivityIds(activity.map((a) => a.id));
      }
    } else {
      if (selectedAlertIds.length === alerts.length) {
        setSelectedAlertIds([]);
      } else {
        setSelectedAlertIds(alerts.map((a) => a.id));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw size={40} className="text-accent animate-spin" />
        <p className="text-[var(--text-secondary)] font-medium">
          {t("loadingCommandCenter")}
        </p>
      </div>
    );
  }

  const kpis = [
    {
      title: t("monthlyRevenue") || "إجمالي الإيرادات",
      value: `$${stats?.monthlyRevenue?.toLocaleString() || "0"}`,
      trend: t("optimal"),
      isPositive: true,
      icon: <TrendingUp size={20} />,
    },
    {
      title: t("activeUsersToday") || "المستخدمين اليوم",
      value: stats?.activeUsersToday?.toLocaleString() || "0",
      trend: t("optimal"),
      isPositive: true,
      icon: <Users size={20} />,
    },
    {
      title: t("aiGenerations") || "عمليات التوليد",
      value: stats?.aiGenerations?.toLocaleString() || "0",
      trend: t("optimal"),
      isPositive: true,
      icon: <Zap size={20} />,
    },
    {
      title: t("systemHealth") || "صحة النظام",
      value: stats?.systemHealth === "optimal" ? "99.9%" : "85%",
      trend: t("optimal"),
      isPositive: true,
      icon: <Activity size={20} />,
    },
  ];

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return t("justNow");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("minutesAgo").replace("{n}", minutes.toString());
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo").replace("{n}", hours.toString());
    return new Date(date).toLocaleDateString(
      language === "ar" ? "ar-EG" : "en-US",
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={`cmd-kpi-${idx}-${kpi.title}`}
            className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] transition-theme shadow-2xs hover:border-[var(--border-accent)]"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-9 h-9 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] flex items-center justify-center shrink-0"
              >
                {kpi.icon}
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-[var(--radius-xs)] border ${kpi.isPositive ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/20" : "bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] border-[var(--fg-danger)]/20"}`}
              >
                {kpi.trend}
              </span>
            </div>
            <h3 className="text-[var(--text-secondary)] text-xs font-semibold mb-1 transition-theme">
              {kpi.title}
            </h3>
            <p className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Launchpad & SEO Operations Hub */}
      <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-4 shadow-2xs transition-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--text-secondary)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {language === 'ar' ? 'اختصارات الأقسام والعمليات السريعة' : 'Command Operations & Quick Launchpad'}
            </h2>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
            {language === 'ar' ? 'وصول فوري' : 'Direct Access'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <button
            onClick={() => navigate('/admin/seo')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <Globe size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'مركز السيو' : 'SEO Audit'}
            </span>
          </button>

          <button
            onClick={() => navigate('/admin/orchestrator')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <Cpu size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'الموجّه الذكي' : 'Orchestrator'}
            </span>
          </button>

          <button
            onClick={() => navigate('/admin/databases')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <Database size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'قواعد البيانات' : 'Databases'}
            </span>
          </button>

          <button
            onClick={() => navigate('/admin/keys')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <Key size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'مفاتيح API' : 'API Keys'}
            </span>
          </button>

          <button
            onClick={() => navigate('/admin/radar')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'رادار الأمان' : 'Security'}
            </span>
          </button>

          <button
            onClick={() => navigate('/admin/finance')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <Landmark size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'المالية والدفتر' : 'Finance'}
            </span>
          </button>

          <button
            onClick={() => navigate('/admin/plans')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'الاشتراكات' : 'Plans'}
            </span>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)] flex items-center justify-center">
              <Users size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {language === 'ar' ? 'المستخدمين' : 'Users'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col shadow-2xs transition-theme"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Cpu className="text-[var(--text-secondary)]" size={18} />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">{t("resourceUtilization")}</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[var(--fg-success)]" />
              {language === "ar" ? "تشخيص لحظي" : "Live Diagnostics"}
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--text-secondary)]">{t("cpuLoad")}</span>
                <span className="text-[var(--text-primary)] font-bold">
                  {serverHealth?.cpu || 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border-default)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${serverHealth?.cpu || 0}%` }}
                  className="h-full bg-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--text-secondary)]">{t("memoryAllocation")}</span>
                <span className="text-[var(--text-primary)] font-bold">
                  {serverHealth?.memory?.used || 0}MB
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border-default)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${serverHealth?.memory?.percent || 0}%` }}
                  className="h-full bg-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--text-secondary)]">{t("systemLoad")}</span>
                <span className="text-[var(--text-primary)] font-bold">
                  {serverHealth?.load
                    ? serverHealth.load[0].toFixed(2)
                    : "0.00"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border-default)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, (serverHealth?.load?.[0] || 0) * 10)}%`,
                  }}
                  className="h-full bg-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-center">
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                {t("serverMonitoringActive")}
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col shadow-2xs transition-theme"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="text-[var(--text-secondary)]" size={18} />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t("systemUptime")}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)]" />
              {language === "ar" ? "بروتوكول مستقر" : "Optimal"}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-10">
            <p className="text-4xl font-black text-[var(--text-primary)] tracking-tight">100%</p>
            <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
              {t("stableOperationalProtocol")}
            </p>
          </div>
        </div>
      </div>

      {/* Database Pool Connectivity Monitors */}
      <div className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col gap-6 shadow-2xs transition-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="text-[var(--text-secondary)]" size={18} />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {language === "ar" ? "مراقب اتصال قواعد البيانات النشطة" : "Database Pool Connectivity Monitor"}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[var(--fg-success)]" />
            {language === "ar" ? "فحص دوري مباشر" : "Active Pool Polling"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['core', 'ledger', 'external', 'security'].map((dbId) => {
            const dbInfo = serverHealth?.databases?.[dbId] || { status: 'loading' };
            const isConnected = dbInfo.status === 'connected';
            const isLoading = dbInfo.status === 'loading';
            
            return (
              <div 
                key={dbId}
                className="p-4 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col gap-3 relative transition-theme hover:border-[var(--border-accent)] shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={15} className={`${isConnected ? 'text-[var(--text-primary)]' : isLoading ? 'text-[var(--text-muted)]' : 'text-[var(--fg-danger)]'}`} />
                    <span className="font-bold text-xs tracking-tight text-[var(--text-primary)]">
                      {dbId === 'core' && (language === "ar" ? "قاعدة البيانات الأساسية" : "Core DB")}
                      {dbId === 'ledger' && (language === "ar" ? "دفتر الأرباح المالي" : "Ledger DB")}
                      {dbId === 'external' && (language === "ar" ? "قاعدة المجتمع والمدونة" : "External DB")}
                      {dbId === 'security' && (language === "ar" ? "قاعدة الأمان والحماية" : "Security DB")}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-xs)] border ${isConnected ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/20' : isLoading ? 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-default)]' : 'bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] border-[var(--fg-danger)]/20'}`}>
                    {isLoading ? (language === "ar" ? "جاري الفحص" : "Checking") : isConnected ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Offline")}
                  </span>
                </div>

                <div className="mt-1 flex flex-col gap-1.5 text-xs text-[var(--text-muted)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[var(--text-secondary)]">{language === "ar" ? "المعرف" : "Identifier"}</span>
                    <span className="font-mono font-bold text-[var(--text-primary)] uppercase text-[11px]">{dbId}</span>
                  </div>
                  {isConnected && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-[var(--text-secondary)]">{language === "ar" ? "زمن الاستجابة" : "Latency"}</span>
                        <span className="font-mono font-bold text-[var(--fg-success)] text-[11px]">{dbInfo.latencyMs}ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-[var(--text-secondary)]">{language === "ar" ? "اتصالات نشطة / الحد الأقصى" : "Active / Max"}</span>
                        <span className="font-mono font-bold text-[var(--text-primary)] text-[11px]">{dbInfo.active ?? 0} / {dbInfo.max ?? 20}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-[var(--text-secondary)]">{language === "ar" ? "خاملة / قيد الانتظار" : "Idle / Waiting"}</span>
                        <span className="font-mono font-bold text-[var(--text-primary)] text-[11px]">{dbInfo.idle ?? 0} / {dbInfo.waiting ?? 0}</span>
                      </div>
                      {dbInfo.connection_leak_risk && (
                        <div className="mt-2 p-2.5 rounded-[var(--radius-xs)] bg-[var(--status-warning-subtle)] border border-[var(--fg-warning)]/20 text-[var(--fg-warning)] text-[10px] flex flex-col gap-2">
                          <span className="font-bold flex items-center gap-1">
                            ⚠️ {language === 'ar' ? 'خطر تسريب الاتصال!' : 'Connection Leak Risk!'}
                          </span>
                          <button
                            disabled={reconnectingPool !== null}
                            onClick={() => handleForceReconnect(dbId)}
                            className="w-full py-1.5 rounded-[var(--radius-xs)] text-[10px] font-bold border border-[var(--fg-warning)]/30 text-[var(--fg-warning)] hover:bg-[var(--status-warning-subtle)] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            {reconnectingPool === dbId ? (
                              <span className="animate-spin h-3 w-3 border-2 border-[var(--fg-warning)]/40 border-t-transparent rounded-full" />
                            ) : (
                              language === 'ar' ? 'إعادة اتصال إجباري' : 'Force Reconnect'
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {!isConnected && !isLoading && (
                    <div className="text-[var(--fg-danger)] font-medium text-[11px] truncate leading-normal" title={dbInfo.error}>
                      {dbInfo.error || (language === "ar" ? "فشل اختبار الاتصال" : "Connection failed")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="text-[var(--text-secondary)]" size={18} />
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t("activityStream")}
                </h2>
                <span className="text-[10px] bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] px-2 py-0.5 rounded-full font-bold">
                  {activity.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--fg-success)]" />
                {activity.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] px-2 py-1 rounded-[var(--radius-xs)] border border-[var(--border-default)] transition-theme">
                    <input
                      type="checkbox"
                      checked={
                        activity.length > 0 &&
                        selectedActivityIds.length === activity.length
                      }
                      onChange={() => handleSelectAll("activity")}
                      className="w-3.5 h-3.5 rounded-shape-xs border-[var(--border-default)] text-[var(--comp-button-primary-bg)] cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                      {language === "ar" ? "تحديد الكل" : (t("selectAll") || "Select All")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {selectedActivityIds.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    onClick={() => handleBatchDelete("activity")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-shape-sm bg-[var(--fg-danger)] text-[var(--surface-page)] text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-theme shadow-xs active:scale-95"
                  >
                    <Trash2 size={13} />
                    {t("deleteSelected") || (language === "ar" ? "حذف المحدد" : "Delete Selected")} ({selectedActivityIds.length})
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Audit Log Filters Row */}
          {(() => {
            const statusOptions = [
              { id: 'all', labelEn: 'All Status / Category', labelAr: 'جميع الحالات والتصنيفات' },
              { id: 'success', labelEn: 'Success / Completed', labelAr: 'العمليات الناجحة والمكتملة' },
              { id: 'failed', labelEn: 'Failed / Error', labelAr: 'العمليات الفاشلة والأخطاء' },
              { id: 'system', labelEn: 'System Events', labelAr: 'أحداث النظام' },
              { id: 'finance', labelEn: 'Financial Operations', labelAr: 'العمليات المالية' },
              { id: 'communication', labelEn: 'Communications / Emails', labelAr: 'الاتصالات والرسائل البريدية' },
              { id: 'ai_generation', labelEn: 'AI Generation / Tools', labelAr: 'توليد الذكاء الاصطناعي الأكاديمي' }
            ];

            const standardTools = [
              { id: 'chat_fast', labelEn: 'Fast Chat', labelAr: 'المحادثة السريعة' },
              { id: 'chat_pro', labelEn: 'Pro Chat', labelAr: 'المحادثة المتقدمة' },
              { id: 'chat_reasoning', labelEn: 'Reasoning Mode', labelAr: 'نمط التفكير العميق' },
              { id: 'perplexta_analysis', labelEn: 'Analysis', labelAr: 'تحليل' },
              { id: 'x402_api', labelEn: 'x402 Agent API', labelAr: 'بوابة عملاء x402' },
              { id: 'image', labelEn: 'Image', labelAr: 'صورة' },
              { id: 'code', labelEn: 'Code', labelAr: 'كود' },
              { id: 'ads_copilot', labelEn: 'Ads Copilot', labelAr: 'مساعد الإعلانات' }
            ];

            const uniqueToolsInLogs = Array.from(new Set(
              activity
                .filter(log => log && log.type === "ai_generation" && log.action)
                .map(log => log.action)
            ));

            const availableToolFilters = [
              ...standardTools,
              ...uniqueToolsInLogs
                .filter(toolId => !standardTools.find(st => st.id === toolId))
                .map(toolId => ({
                  id: toolId,
                  labelEn: toolId.replace(/_/g, " ").toUpperCase(),
                  labelAr: t(toolId) || toolId
                }))
            ];

            return (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Status Selector */}
                  <div className="relative">
                    <SelectDropdown
                      label={language === "ar" ? "تصفية حسب الحالة" : "Filter by Status"}
                      value={logStatusFilter}
                      onChange={(val) => setLogStatusFilter(val)}
                      dir={dir}
                      options={statusOptions.map(opt => ({
                        value: opt.id,
                        label: dir === "rtl" ? opt.labelAr : opt.labelEn,
                        labelEn: opt.labelEn,
                        labelAr: opt.labelAr
                      }))}
                    />
                  </div>

                  {/* Tool Selector */}
                  <div className="relative">
                    <SelectDropdown
                      label={language === "ar" ? "تصفية حسب الأداة" : "Filter by Tool"}
                      value={logToolFilter}
                      onChange={(val) => setLogToolFilter(val)}
                      dir={dir}
                      searchable={availableToolFilters.length > 6}
                      options={[
                        {
                          value: 'all',
                          label: dir === "rtl" ? "جميع الأدوات والخدمات" : "All Tools & Services",
                          labelEn: "All Tools & Services",
                          labelAr: "جميع الأدوات والخدمات"
                        },
                        ...availableToolFilters.map(tool => ({
                          value: tool.id,
                          label: dir === "rtl" ? tool.labelAr : tool.labelEn,
                          labelEn: tool.labelEn,
                          labelAr: tool.labelAr
                        }))
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Start Date */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                      {language === "ar" ? "تاريخ البدء" : "Start Date"}
                    </label>
                    <input
                      type="date"
                      value={logStartDate}
                      onChange={(e) => setLogStartDate(e.target.value)}
                      className="w-full px-3 py-2 min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--border-default)] focus:border-[var(--border-accent)] focus:outline-none text-xs font-semibold bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all"
                    />
                  </div>

                  {/* End Date */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                      {language === "ar" ? "تاريخ الانتهاء" : "End Date"}
                    </label>
                    <input
                      type="date"
                      value={logEndDate}
                      onChange={(e) => setLogEndDate(e.target.value)}
                      className="w-full px-3 py-2 min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--border-default)] focus:border-[var(--border-accent)] focus:outline-none text-xs font-semibold bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="mb-4 relative group">
            <Search
              className={`absolute ${dir === "rtl" ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 transition-colors ${search ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] group-focus-within:text-[var(--text-primary)]"}`}
              size={15}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === "ar" ? "بحث في سجل العمليات والأنشطة..." : "Search activity stream & logs..."}
              className={`w-full ${dir === "rtl" ? "pr-10 pl-10" : "pl-10 pr-10"} py-2.5 min-h-[44px] rounded-[var(--radius-sm)] border text-xs font-medium transition-all focus:outline-none bg-[var(--surface-subtle)] border-[var(--border-default)] focus:border-[var(--border-accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className={`absolute ${dir === "rtl" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--fg-danger)] transition-colors p-1.5 rounded-full hover:bg-[var(--surface-card)] cursor-pointer`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
            {(() => {
              const filteredList = activity.filter(log => {
                if (!log) return false;

                // 1. Filter by Status/Category
                if (logStatusFilter !== "all") {
                  if (logStatusFilter === "success") {
                    const hasFailed = 
                      (log.action && /failed|error|failure/i.test(log.action)) ||
                      (log.detail && /failed|error|failure/i.test(log.detail)) ||
                      (log.description && /failed|error|failure/i.test(log.description));
                    if (hasFailed) return false;
                  } else if (logStatusFilter === "failed") {
                    const hasFailed = 
                      (log.action && /failed|error|failure/i.test(log.action)) ||
                      (log.detail && /failed|error|failure/i.test(log.detail)) ||
                      (log.description && /failed|error|failure/i.test(log.description));
                    if (!hasFailed) return false;
                  } else {
                    if (log.type !== logStatusFilter) return false;
                  }
                }

                // 2. Filter by Tool
                if (logToolFilter !== "all") {
                  if (log.type !== "ai_generation" || log.action !== logToolFilter) {
                    return false;
                  }
                }

                // 3. Date Range Filter
                if (logStartDate) {
                  const sDate = new Date(logStartDate);
                  sDate.setHours(0, 0, 0, 0);
                  const logDate = new Date(log.created_at);
                  if (logDate < sDate) return false;
                }
                if (logEndDate) {
                  const eDate = new Date(logEndDate);
                  eDate.setHours(23, 59, 59, 999);
                  const logDate = new Date(log.created_at);
                  if (logDate > eDate) return false;
                }

                // 4. Search Filter
                if (!search.trim()) return true;
                const term = search.toLowerCase();
                return (
                  log.user_id?.toString().toLowerCase().includes(term) ||
                  log.user_name?.toLowerCase().includes(term) ||
                  log.action?.toLowerCase().includes(term) ||
                  log.detail?.toLowerCase().includes(term)
                );
              });

              if (filteredList.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-[var(--border-default)] rounded-shape-md bg-[var(--surface-subtle)]/30">
                    <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                      <Search size={20} className="stroke-[1.5]" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {language === "ar" ? "لم يتم العثور على سجلات" : "No Records Found"}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                      {language === "ar" 
                        ? "جرب تعديل المعايير المحددة أو تصفير كلمات البحث للحصول على نتائج مغايرة." 
                        : "Try adjusting your filters or clearing your search term to view other entries."}
                    </p>
                    {(logStatusFilter !== "all" || logToolFilter !== "all" || logStartDate || logEndDate || search.trim()) && (
                      <button
                        onClick={() => {
                          setLogStatusFilter("all");
                          setLogToolFilter("all");
                          setLogStartDate("");
                          setLogEndDate("");
                          setSearch("");
                        }}
                        className="mt-4 px-3 py-1.5 rounded-shape-sm bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent/20 transition-theme"
                      >
                        {language === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}
                      </button>
                    )}
                  </div>
                );
              }

              return filteredList.map((log, idx) => {
                const isSelected = selectedActivityIds.includes(log.id);
                const translateAction = (action: string) => {
                  const key = `log_${action}`;
                  const translation = t(key);
                  if (translation !== key) return translation;

                  if (log.type === "ai_generation") {
                    const toolName = t(log.action);
                    return t("log_used_tool").replace(
                      "{tool}",
                      toolName !== log.action ? toolName : log.action,
                    );
                  }
                  return action.replace(/_/g, " ");
                };

                const translateDetail = (detail: string) => {
                  if (!detail) return "";
                  if (detail.includes("Pruned notifications"))
                    return t("log_notifications_prune_detail");
                  if (detail.includes("Logged into"))
                    return t("log_login_detail");
                  if (detail.includes("Registered as"))
                    return t("log_registration_detail");
                  return detail;
                };

                return (
                  <div
                    key={`cmd-log-${log.id || idx}-${idx}`}
                    className={`flex items-start gap-3 group p-2 rounded-shape-sm transition-theme border border-transparent ${isSelected ? "bg-accent/5 border-accent/20" : "hover:bg-[var(--surface-subtle)]0/5"}`}
                  >
                    <div className="pt-1 select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedActivityIds((prev) =>
                            prev.includes(log.id)
                              ? prev.filter((id) => id !== log.id)
                              : [...prev, log.id],
                          );
                        }}
                        className="w-4 h-4 rounded-shape-xs border-[var(--border-default)] text-[var(--fg-accent)] focus:ring-[var(--fg-accent)] cursor-pointer accent-[var(--fg-accent)]"
                      />
                    </div>
                    <div
                      className={`mt-0.5 p-1.5 rounded-shape-sm shrink-0 ${
                        log.type === "ai_generation"
                          ? "bg-[var(--fg-accent)]/10 text-[var(--fg-accent)]"
                          : "bg-[var(--fg-accent)]/10 text-[var(--fg-accent)]"
                      }`}
                    >
                      {log.type === "ai_generation" ? (
                        <Zap size={15} />
                      ) : (
                        <Settings size={15} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug truncate">
                        <span className="text-accent font-bold bg-accent/5 px-1.5 py-0.5 rounded-[4px] border border-accent/10">
                          <HighlightText text={log.user_name || t("systemUser")} query={search} />
                        </span>{" "}
                        <span className="ml-1 opacity-90"><HighlightText text={translateAction(log.action)} query={search} /></span>
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1.5 transition-theme flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="opacity-50" />
                          {getTimeAgo(log.created_at)}
                        </span>
                        {log.detail &&
                        !log.detail.includes("-") &&
                        !log.detail.includes("gpt")
                          ? (
                            <>
                              <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                              <span className="truncate max-w-[200px]"><HighlightText text={translateDetail(log.detail)} query={search} /></span>
                            </>
                          )
                          : ""}
                        {log.points > 0
                          ? (
                            <>
                              <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                              <span className="text-accent font-bold">{log.points} {language === "ar" ? "نقطة" : "pts"}</span>
                            </>
                          )
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(log.id, log.type)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--fg-danger)] transition-theme"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div
          className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-[var(--fg-danger)]" size={18} />
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t("securityAlerts")}
                </h2>
                {alerts.length > 0 && (
                  <span className="text-[10px] bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] border border-[var(--fg-danger)]/20 px-2 py-0.5 rounded-full font-bold">
                    {alerts.length}
                  </span>
                )}
              </div>
              {alerts.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] px-2 py-1 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
                  <input
                    type="checkbox"
                    checked={
                      alerts.length > 0 &&
                      selectedAlertIds.length === alerts.length
                    }
                    onChange={() => handleSelectAll("alert")}
                    className="w-3.5 h-3.5 rounded-shape-xs border-[var(--border-default)] text-[var(--fg-danger)] focus:ring-rose-500 cursor-pointer accent-rose-500"
                  />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    {language === "ar" ? "تحديد الكل" : (t("selectAll") || "Select All")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <AnimatePresence>
                {selectedAlertIds.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    onClick={() => handleBatchDelete("alert")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-shape-sm bg-[var(--fg-danger)] text-[var(--surface-page)] text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-theme shadow-xs active:scale-95"
                  >
                    <Trash2 size={13} />
                    {t("deleteSelected")} ({selectedAlertIds.length})
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Combined Maintenance Toolkit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 p-4 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs">
            <div className="col-span-full flex items-center justify-between mb-1 px-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {t("systemMaintenance")}
              </span>
              <Settings2 size={14} className="text-[var(--text-muted)]" />
            </div>

            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: { ar: "تطهير الذاكرة السحابية؟", en: "Purge All Chats?" },
                  description: {
                    ar: t("clearAllChatsConfirm") || "تحذير: هذا سيؤدي إلى حذف كافة المحادثات والرسائل من قاعدة البيانات. هل أنت متأكد؟",
                    en: t("clearAllChatsConfirm") || "WARNING: This will delete ALL chat history and messages from the database. Are you sure?"
                  },
                  variant: "danger",
                  onConfirm: async () => {
                    try {
                      const res = await fetch(
                        "/api/admin/maintenance/clear-chats",
                        {
                          method: "DELETE",
                          headers: { 
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "x-confirm-action": "DELETE_ALL"
                          },
                          body: JSON.stringify({ confirm: "DELETE_ALL" }),
                        },
                      );
                      if (res.ok) {
                        showToast(t("activityCleared"), "success");
                        fetchData();
                      }
                    } catch (e) {
                      console.error("Purge failed", e);
                    }
                  }
                });
              }}
              className="group flex flex-col items-center justify-center gap-1.5 p-2.5 min-h-[60px] rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Database
                size={16}
                className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"
              />
              <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] text-center leading-tight transition-colors">
                {t("clearAllChats")}
              </span>
            </button>

            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: { ar: "تطهير السجلات المعلقة؟", en: "Prune Orphaned Records?" },
                  description: {
                    ar: "هل أنت متأكد من فحص وتطهير السجلات المعلقة وتوريدات الملفات التالفة؟",
                    en: "Are you sure you want to run the database maintenance routine to look for and delete orphaned files and requests?"
                  },
                  variant: "warning",
                  onConfirm: async () => {
                    try {
                      const res = await fetch(
                        "/api/admin/maintenance/cleanup",
                        {
                          method: "POST",
                          headers: { 
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({ dryRun: false }),
                        },
                      );
                      if (res.ok) {
                        const cleanRes = await res.json();
                        const msg = language === "ar"
                          ? `تم التطهير بنجاح! (الملفات المحدوفة: ${cleanRes.summary.userFiles.prunedCount} | الطلبات المحذوفة: ${cleanRes.summary.depositRequests.prunedCount})`
                          : `Cleanup Completed Successfully! (Pruned files: ${cleanRes.summary.userFiles.prunedCount} | Pruned requests: ${cleanRes.summary.depositRequests.prunedCount})`;
                        showToast(msg, "success");
                        fetchData();
                      } else {
                        const errData = await res.json();
                        showToast(errData.error || "Cleanup failed", "error");
                      }
                    } catch (e: any) {
                      console.error("Cleanup failed", e);
                      showToast(e.message || "Cleanup failed", "error");
                    }
                  }
                });
              }}
              className="group flex flex-col items-center justify-center gap-1.5 p-2.5 min-h-[60px] rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Database
                size={16}
                className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"
              />
              <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] text-center leading-tight transition-colors">
                {language === "ar" ? "تطهير السجلات المعلقة" : "Prune Orphaned Records"}
              </span>
            </button>

            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: { ar: "مسح الإشعارات القديمة؟", en: "Prune Old Notifications?" },
                  description: {
                    ar: "هل أنت متأكد من تطهير الإشعارات القديمة؟",
                    en: "Prune system notifications older than 30 days?"
                  },
                  variant: "warning",
                  onConfirm: async () => {
                    try {
                      const res = await fetch(
                        "/api/admin/notifications/prune?days=30",
                        {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      if (res.ok) {
                        const data = await res.json();
                        showToast(
                          language === "ar"
                            ? `تم تطهير ${data.count} إشعار بنجاح.`
                            : `Successfully pruned ${data.count} notifications.`,
                          "success",
                        );
                      }
                    } catch (e) {
                      console.error("Pruning failed", e);
                    }
                  }
                });
              }}
              className="group flex flex-col items-center justify-center gap-1.5 p-2.5 min-h-[60px] rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <BellRing
                size={16}
                className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"
              />
              <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] text-center leading-tight transition-colors">
                {t("maintenancePruneLegacy")}
              </span>
            </button>

            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: { ar: "مسح كافة الإشعارات؟", en: "Clear All Notifications?" },
                  description: {
                    ar: t("clearNotifsConfirm") || "هل أنت متأكد من حذف كافة إشعارات النظام لجميع المستخدمين بشكل نهائي؟",
                    en: t("clearNotifsConfirm") || "Are you sure you want to permanently delete ALL system notifications for all users?"
                  },
                  variant: "danger",
                  onConfirm: async () => {
                    try {
                      const res = await fetch(
                        "/api/admin/notifications/prune?mode=all",
                        {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      if (res.ok) {
                        showToast(t("pruneSuccess"), "success");
                      }
                    } catch (e) {
                      console.error("Wipe failed", e);
                    }
                  }
                });
              }}
              className="group flex flex-col items-center justify-center gap-1.5 p-2.5 min-h-[60px] rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--fg-danger)]/40 hover:bg-[var(--fg-danger)]/5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Shield
                size={16}
                className="text-[var(--text-secondary)] group-hover:text-[var(--fg-danger)] transition-colors"
              />
              <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--fg-danger)] text-center leading-tight transition-colors">
                {t("maintenanceClearAllNotifs")}
              </span>
            </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
            {alerts.map((alert, idx) => {
              const isSelected = selectedAlertIds.includes(alert.id);
              const translateAlertDescription = (alert: any) => {
                const key = `alert_${alert.alert_type}`;
                const title = t(key);
                if (title !== key) {
                  const matches = alert.description.match(/\d+(\.\d+)?/g);
                  if (matches && matches.length > 0 && language === "ar") {
                    if (alert.alert_type === "usage_anomaly")
                      return `${title} (${matches[0]} عملية)`;
                    if (alert.alert_type === "quota_bypass")
                      return `${title} (${matches[1]}/${matches[2]})`;
                  }
                  return title;
                }
                return alert.description;
              };

              return (
                <div
                  key={`cmd-alert-${alert.id || idx}-${idx}`}
                  className={`flex items-start gap-3 group p-2 rounded-shape-sm transition-theme border border-transparent ${isSelected ? "bg-[var(--status-danger-subtle)] border-[var(--fg-danger)]/20" : "hover:bg-[var(--surface-subtle)]0/5"}`}
                >
                  <div className="pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedAlertIds((prev) =>
                          prev.includes(alert.id)
                            ? prev.filter((id) => id !== alert.id)
                            : [...prev, alert.id],
                        );
                      }}
                      className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--fg-danger)] focus:ring-red-500 cursor-pointer accent-red-500"
                    />
                  </div>
                  <div className={`mt-0.5 p-1.5 rounded-shape-sm shrink-0 ${
                      alert.severity === "high" || alert.severity === "critical"
                        ? "bg-[var(--status-danger-subtle)] text-[var(--fg-danger)]"
                        : "bg-[var(--status-warning-subtle)] text-[var(--fg-warning)]"
                    }`}>
                    <AlertCircle size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
                      {translateAlertDescription(alert)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {getTimeAgo(alert.created_at)} •{" "}
                      <span className="font-bold">
                        {alert.user_name || t("systemUser")}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--fg-danger)] transition-theme font-bold"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] italic">
                {t("noSecurityAlerts")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <ActionConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          variant={confirmModal.variant}
          confirmLabel={confirmModal.confirmLabel}
        />
      )}
    </div>
  );
};

