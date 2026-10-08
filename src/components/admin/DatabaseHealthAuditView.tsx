import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Shield,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Server,
  Zap,
  HelpCircle,
  Layers,
  ArrowUpRight,
  Sliders,
  Landmark,
  ShieldAlert,
  HardDrive
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export interface DatabaseHealthAuditViewProps {
  theme?: string;
  t?: (key: string, replacements?: any) => string;
  dir?: string;
}

interface DatabaseHealthItem {
  id: "core" | "ledger" | "external" | "security" | "media";
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  status: "connected" | "disconnected" | "not_configured";
  latencyMs: number;
  host: string;
  port: string;
  database: string;
  version: string | null;
  ssl: boolean;
  error: string | null;
  checkedAt: string;
}

interface HealthSummary {
  total: number;
  connected: number;
  disconnected: number;
  notConfigured: number;
  averageLatencyMs: number;
  healthStatus: "healthy" | "degraded" | "critical";
}

export const DatabaseHealthAuditView: React.FC<DatabaseHealthAuditViewProps> = ({
  dir = "rtl",
}) => {
  const { token, language } = useAppContext();
  const isRtl = language === "ar";

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [databases, setDatabases] = useState<DatabaseHealthItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchHealth = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await fetch("/api/admin/databases/health-status", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
          setDatabases(data.databases || []);
          setLastUpdated(data.timestamp || new Date().toISOString());
        }
      } catch (err) {
        console.error("Failed to fetch databases health:", err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh timer every 25 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 25000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getDbIcon = (id: string) => {
    switch (id) {
      case "core":
        return <Database size={22} className="text-[var(--fg-accent)]" />;
      case "ledger":
        return <Landmark size={22} className="text-[var(--fg-warning)]" />;
      case "external":
        return <Layers size={22} className="text-[var(--fg-accent)]" />;
      case "security":
        return <ShieldAlert size={22} className="text-[var(--fg-accent)]" />;
      case "media":
        return <HardDrive size={22} className="text-[var(--fg-success)]" />;
      default:
        return <Server size={22} className="text-[var(--text-muted)]" />;
    }
  };

  const getLatencyColor = (status: string, latency: number) => {
    if (status !== "connected") return "text-[var(--fg-danger)] bg-[var(--status-danger-subtle)] border-[var(--fg-danger)]/20";
    if (latency <= 80) return "text-[var(--fg-success)] bg-[var(--status-success-subtle)] border-[var(--fg-success)]/20";
    if (latency <= 250) return "text-[var(--fg-warning)] bg-[var(--status-warning-subtle)] border-[var(--fg-warning)]/20";
    return "text-[var(--fg-accent)] bg-[var(--bg-accent-subtle)] border-[var(--border-accent)]/20";
  };

  const getLatencyLabel = (status: string, latency: number) => {
    if (status !== "connected") return isRtl ? "فشل الاتصال" : "Failed";
    if (latency <= 80) return isRtl ? "سرعة فائقة" : "Ultra Fast";
    if (latency <= 250) return isRtl ? "استجابة طبيعية" : "Normal";
    return isRtl ? "سحابي معتدل" : "Cloud Latency";
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return "--";
    try {
      return new Date(iso).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 font-sans" dir={dir}>
      {/* Top Header & Action Controls */}
      <div className="p-5 md:p-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)] border border-[var(--border-default)] flex-shrink-0">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-tight">
                  {isRtl
                    ? "رادار سلامة وتأخير قواعد البيانات (Database Health & Latency Radar)"
                    : "Database Health & Latency Radar"}
                </h2>
                {summary && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      summary.healthStatus === "healthy"
                        ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border-[var(--fg-success)]/20"
                        : summary.healthStatus === "degraded"
                        ? "bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] dark:text-[var(--fg-warning)] border-[var(--fg-warning)]/20"
                        : "bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] dark:text-[var(--fg-danger)] border-[var(--fg-danger)]/20"
                    }`}
                  >
                    {summary.healthStatus === "healthy"
                      ? isRtl
                        ? "جميع الاتصالات نشطة"
                        : "All Connected"
                      : summary.healthStatus === "degraded"
                      ? isRtl
                        ? "اتصال جزئي / تدهور"
                        : "Partially Degraded"
                      : isRtl
                      ? "انقطاع حرج"
                      : "Critical Disconnection"}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {isRtl
                  ? "فحص حي وفوري لزمن الاستجابة (Latency) والمصافحة المشفرة لقواعد البيانات الخمس المعزولة معمارياً."
                  : "Live latency benchmarking and secure SSL handshake telemetry across all 5 segregated database clusters."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`min-h-[44px] px-3 py-2 rounded-[var(--radius-md)] text-xs font-bold border transition-theme flex items-center gap-1.5 cursor-pointer ${
                autoRefresh
                  ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border-[var(--fg-success)]/30"
                  : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-default)]"
              }`}
            >
              <Activity size={14} className={autoRefresh ? "animate-pulse" : ""} />
              <span>
                {autoRefresh
                  ? isRtl
                    ? "التحديث التلقائي نشط (25ث)"
                    : "Auto Refresh ON (25s)"
                  : isRtl
                  ? "تفعيل التحديث التلقائي"
                  : "Enable Auto Refresh"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              className="min-h-[44px] px-4 py-2 rounded-[var(--radius-md)] text-xs font-bold bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span>{isRtl ? "إعادة الفحص الآن" : "Ping & Test All"}</span>
            </button>
          </div>
        </div>

        {/* Last Checked Badge */}
        {lastUpdated && (
          <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {isRtl ? "آخر فحص شبكي:" : "Last verified:"}{" "}
              <strong className="text-[var(--text-secondary)]">
                {formatTimestamp(lastUpdated)}
              </strong>
            </span>
            <span className="font-mono text-[10px]">
              Protocol: PostgreSQL / Pooler via pg-client
            </span>
          </div>
        )}
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall System Status */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {isRtl ? "الحالة العامة للبنية" : "Overall Infrastructure"}
            </span>
            <div
              className={`p-2 rounded-full ${
                summary?.healthStatus === "healthy"
                  ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)]"
                  : summary?.healthStatus === "degraded"
                  ? "bg-[var(--status-warning-subtle)] text-[var(--fg-warning)]"
                  : "bg-[var(--status-danger-subtle)] text-[var(--fg-danger)]"
              }`}
            >
              {summary?.healthStatus === "healthy" ? (
                <CheckCircle2 size={18} />
              ) : summary?.healthStatus === "degraded" ? (
                <AlertCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2">
            {summary?.healthStatus === "healthy"
              ? isRtl
                ? "جاهزية 100%"
                : "100% Operational"
              : summary?.healthStatus === "degraded"
              ? isRtl
                ? "تشغيل في النمط المقيد"
                : "Degraded Mode"
              : isRtl
              ? "غير متصل"
              : "Critical Offline"}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {isRtl
              ? "التطبيق يعمل بنمط Degraded Mode للبيانات غير المتصلة"
              : "Operates safely with memory caching for offline pools"}
          </p>
        </div>

        {/* Metric 2: Connected Databases */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {isRtl ? "القواعد المتصلة" : "Connected Clusters"}
            </span>
            <div className="p-2 rounded-full bg-[var(--fg-accent)]/10 text-[var(--fg-accent)]">
              <Database size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2 flex items-baseline gap-1">
            <span>{summary?.connected ?? 0}</span>
            <span className="text-sm font-normal text-[var(--text-muted)]">
              / {summary?.total ?? 5}
            </span>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-[var(--surface-subtle)] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (summary?.connected ?? 0) === (summary?.total ?? 5)
                  ? "bg-[var(--fg-success)]"
                  : (summary?.connected ?? 0) > 0
                  ? "bg-[var(--fg-warning)]"
                  : "bg-[var(--fg-danger)]"
              }`}
              style={{
                width: `${((summary?.connected ?? 0) / (summary?.total ?? 5)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3: Average Latency */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {isRtl ? "متوسط زمن الاستجابة" : "Avg Roundtrip Latency"}
            </span>
            <div className="p-2 rounded-full bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]">
              <Zap size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2 flex items-baseline gap-1">
            <span>{summary?.averageLatencyMs ?? 0}</span>
            <span className="text-xs font-bold text-[var(--text-muted)]">ms</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {isRtl
              ? "معدل سرعة الاتصال بالقواعد السحابية النشطة"
              : "Ping across active cloud-connected endpoints"}
          </p>
        </div>

        {/* Metric 4: SSL & Security */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {isRtl ? "تشفير القنوات (SSL/TLS)" : "Secure Encryption"}
            </span>
            <div className="p-2 rounded-full bg-[var(--status-success-subtle)] text-[var(--fg-success)]">
              <Lock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2">
            {databases.some((d) => d.status === "connected" && d.ssl)
              ? isRtl
                ? "مُشفّر بنشاط"
                : "TLS Enforced"
              : isRtl
              ? "وضع محلي / مختلط"
              : "Local / Mixed"}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {isRtl
              ? "شهادات SSL التلقائية مفعلة للسحابة"
              : "Context-aware SSL auto-handshake enabled"}
          </p>
        </div>
      </div>

      {/* Main Grid: All 5 Segregated Databases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {databases.map((db) => {
          const isConnected = db.status === "connected";
          const isNotConfigured = db.status === "not_configured";

          return (
            <div
              key={db.id}
              className={`p-5 rounded-[var(--radius-lg)] border transition-all flex flex-col justify-between ${
                isConnected
                  ? "bg-[var(--surface-card)] border-[var(--fg-success)]/30 shadow-sm"
                  : isNotConfigured
                  ? "bg-[var(--surface-card)] border-[var(--border-default)] opacity-80"
                  : "bg-[var(--surface-card)] border-[var(--fg-danger)]/30"
              }`}
            >
              <div>
                {/* Card Header: Icon, Name, ID Pill & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      {getDbIcon(db.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[var(--text-primary)] leading-tight">
                          {isRtl ? db.nameAr : db.name}
                        </h3>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)]">
                          {db.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                        {isRtl ? db.descriptionAr : db.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${
                      isConnected
                        ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border-[var(--fg-success)]/20"
                        : isNotConfigured
                        ? "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]"
                        : "bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] dark:text-[var(--fg-danger)] border-[var(--fg-danger)]/20"
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>{isRtl ? "متصلة" : "Connected"}</span>
                      </>
                    ) : isNotConfigured ? (
                      <>
                        <AlertCircle size={12} />
                        <span>{isRtl ? "غير مهيأة" : "Not Set"}</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />
                        <span>{isRtl ? "غير متصلة" : "Disconnected"}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Latency Meter Pill */}
                <div
                  className={`p-3 rounded-[var(--radius-md)] border flex items-center justify-between mb-4 ${getLatencyColor(
                    db.status,
                    db.latencyMs
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={15} />
                    <span className="text-xs font-bold">
                      {isRtl ? "زمن الاستجابة (Latency):" : "Roundtrip Latency:"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-black">
                      {isConnected ? `${db.latencyMs} ms` : isNotConfigured ? "--" : `${db.latencyMs} ms`}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                      {getLatencyLabel(db.status, db.latencyMs)}
                    </span>
                  </div>
                </div>

                {/* Technical Details Grid */}
                <div className="space-y-2 text-xs border-t border-[var(--border-default)] pt-3">
                  {/* Host */}
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)] font-medium">
                      {isRtl ? "المضيف (Host):" : "Host Target:"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] max-w-[160px] truncate text-[var(--text-primary)]" title={db.host}>
                        {db.host}
                      </span>
                      {db.host && db.host !== "None" && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(db.host, `host-${db.id}`)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
                          title="Copy Host"
                        >
                          {copiedKey === `host-${db.id}` ? <Check size={12} className="text-[var(--fg-success)]" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Database Name */}
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)] font-medium">
                      {isRtl ? "اسم القاعدة:" : "Database Name:"}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[var(--text-primary)]">
                      {db.database}
                    </span>
                  </div>

                  {/* Version / Engine */}
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)] font-medium">
                      {isRtl ? "المحرك والنسخة:" : "Engine & Version:"}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {db.version || "PostgreSQL"}
                    </span>
                  </div>

                  {/* SSL Status */}
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)] font-medium">
                      {isRtl ? "شهادة الأمان:" : "SSL Encryption:"}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold flex items-center gap-1 ${
                        db.ssl ? "text-[var(--fg-success)]" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {db.ssl ? (
                        <>
                          <Lock size={10} />
                          <span>TLS/SSL Active</span>
                        </>
                      ) : (
                        <span>Disabled / Local</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Error diagnostics banner if disconnected */}
                {db.status === "disconnected" && db.error && (
                  <div className="mt-3 p-2.5 rounded-[var(--radius-sm)] bg-[var(--status-danger-subtle)] border border-[var(--fg-danger)]/20 text-[var(--fg-danger)] dark:text-[var(--fg-danger)] text-[11px] leading-relaxed font-mono">
                    <div className="font-bold flex items-center gap-1 mb-1 font-sans">
                      <AlertCircle size={12} />
                      <span>{isRtl ? "تفاصيل الخطأ:" : "Error Diagnostic:"}</span>
                    </div>
                    <div className="break-all">{db.error}</div>
                    {db.error.includes("ECONNREFUSED") && db.host === "localhost" && (
                      <div className="mt-1.5 text-[10px] text-[var(--text-muted)] font-sans border-t border-[var(--fg-danger)]/20 pt-1">
                        {isRtl
                          ? "💡 تنبيه: يعمل التطبيق في حاوية سحابية، لذا localhost غير متاح. يرجى إدخال رابط قاعدة بيانات سحابية (مثل Neon أو RDS) في الإعدادات."
                          : "💡 Note: The container has no local postgres. Set a cloud database connection string in Environment Settings."}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Help */}
              <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span className="text-[10px]">
                  {isRtl ? "البيئة المستهدفة:" : "Target Env:"}{" "}
                  <code className="text-[var(--text-secondary)] font-mono">
                    {db.id === "core"
                      ? "DATABASE_URL"
                      : `${db.id.toUpperCase()}_DATABASE_URL`}
                  </code>
                </span>
                <a
                  href="/admin/databases"
                  className="text-[var(--fg-accent)] hover:underline flex items-center gap-0.5 font-bold"
                >
                  <span>{isRtl ? "إعدادات الربط" : "Configure"}</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informational Guidance Footer */}
      <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-start gap-3 text-xs text-[var(--text-secondary)] leading-relaxed">
        <HelpCircle size={18} className="text-[var(--fg-accent)] flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-[var(--text-primary)] font-bold block mb-1">
            {isRtl
              ? "ملاحظة أمنية ومعمارية حول فصل قواعد البيانات (Segregation of Concerns):"
              : "Architectural Directive: Segregation of Concerns"}
          </strong>
          {isRtl
            ? "وفقاً للوثيقة المرجعية الحاكمة لـ Perplexta، تلتزم المنصة بالعزل التام بين بيانات التشغيل الأساسية (Core)، والسجل المالي المقفل (Ledger)، وسجلات الأمان والتدقيق (Security). يتم قياس أزمنة الاستجابة دورياً لتفادي عنق الزجاجة (Bottlenecks) وضمان استمرارية الخدمات دون توقف."
            : "In strict accordance with the Perplexta Master Architecture, complete segregation between Core Operational Data, Append-Only Ledger, and Security Audit Logs is enforced. Latency is continuously benchmarked to prevent bottlenecks and ensure zero-downtime silent failovers."}
        </div>
      </div>
    </div>
  );
};
