import { ErrorBoundary } from "../components/ErrorBoundary";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../hooks/useToast";
import { motion, AnimatePresence } from "motion/react";
import { perplextaPageTransition } from "@/design-system";
import {
  Activity,
  Key,
  Database,
  Cpu,
  Landmark,
  CreditCard,
  Users,
  Settings,
  Mail,
  Plus,
  Settings2,
  ArrowLeft,
  ArrowRight,
  Palette,
  Brain,
  Globe,
  ShieldAlert,
  Send,
  Shield,
  UserPlus,
  Server,
  MonitorSmartphone,
  MapPin,
  Music,
  Fingerprint,
  Sliders,
  Coins,
  Bell,
  Megaphone,
  Save,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { ReferralDashboardView } from "./ReferralDashboardView";
import { AdsManagementView } from "./AdsManagementView";
import { UserManagementView } from "./UserManagementView";
import { AdminRateLimitMetricsView } from "./AdminRateLimitMetricsView";
import { AdminRenderMetricsView } from "../components/AdminRenderMetricsView";
import { SeoCenterView } from "../components/SeoCenterView";
import { PagePreviewModal } from "../components/PagePreviewModal";

import { CommandCenterView } from "../components/admin/CommandCenterView";
import { ApiKeysVaultView } from "../components/admin/ApiKeysVaultView";
import { GpuInfrastructureView } from "../components/admin/GpuInfrastructureView";
import { DatabaseOrchestrationView } from "../components/admin/DatabaseOrchestrationView";
import { OrchestratorView } from "../components/admin/OrchestratorView";
import { FinanceVaultView } from "../components/admin/FinanceVaultView";
import { PlansSubscriptionsView } from "../components/admin/PlansSubscriptionsView";
import { SmartEmailHubView } from "../components/admin/SmartEmailHubView";
import { MassBroadcastView } from "../components/admin/MassBroadcastView";
import { MemoryCenterView } from "../components/admin/MemoryCenterView";
import { SystemSettingsView } from "../components/admin/SystemSettingsView";
import { ThemeStudioView } from "../components/admin/ThemeStudioView";

import { AiInfrastructureHubView } from "../components/admin/hubs/AiInfrastructureHubView";
import { FinanceMonetizationHubView } from "../components/admin/hubs/FinanceMonetizationHubView";
import { UsersCommunityHubView } from "../components/admin/hubs/UsersCommunityHubView";
import { CommunicationsHubView } from "../components/admin/hubs/CommunicationsHubView";

import { ComplianceAuditLogsView } from "../components/admin/ComplianceAuditLogsView";

export const AdminDashboard: React.FC = () => {
  const {
    t,
    theme,
    dir,
    language,
    token,
    user,
    socket,
    setIsOperationPending,
    isMobile,
  } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [isRtl, setIsRtl] = useState(language === "ar");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isSupport = user?.role === "support";
  const path = location.pathname.split("/").pop() || "dashboard";

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "support") {
      navigate("/chat");
    }
    const sensitivePaths = [
      "keys",
      "gpu",
      "maps",
      "databases",
      "finance",
      "settings",
      "theme",
      "orchestrator",
      "audit",
    ];
    if (isSupport && sensitivePaths.includes(path)) {
      navigate("/admin/dashboard");
    }
  }, [user, path, isSupport, navigate]);

  const [providerModels, setProviderModels] = useState<Record<string, any[]>>(
    {},
  );
  const { toast, showToast } = useToast(3000);

  const fetchProviderModels = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/orchestrator/models", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProviderModels(data.providerModels);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  useEffect(() => {
    if (token && (path === "orchestrator" || path === "keys" || Object.keys(providerModels).length === 0)) {
      fetchProviderModels();
    }
  }, [token, path]);

  const [pulseData, setPulseData] = useState<any>(null);
  const [isPulseOpen, setIsPulseOpen] = useState(false);
  const [pulseErrorCount, setPulseErrorCount] = useState(0);

  const fetchPulseData = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/pulse", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPulseData(data);
        setPulseErrorCount(0);
      } else {
        setPulseErrorCount((prev) => prev + 1);
      }
    } catch {
      setPulseErrorCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPulseData();
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        fetchPulseData();
      }, 30000);

      const handleVisibility = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchPulseData();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [token]);

  const formatPulseUptime = (seconds: number) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatPulseRelative = (isoString: string | null) => {
    if (!isoString) return language === "ar" ? "معلق" : "Pending";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffSec < 10) return language === "ar" ? "الآن" : "Just now";
    if (diffSec < 60) return language === "ar" ? `منذ ${diffSec} ثانية` : `${diffSec}s ago`;
    if (diffMin < 60) return language === "ar" ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return language === "ar" ? `منذ ${diffHour} ساعة` : `${diffHour}h ago`;
    return new Date(isoString).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const getTitle = () => {
    switch (path) {
      case "dashboard":
        return language === "ar" ? "مركز القيادة" : "COMMAND CENTER";
      case "keys":
      case "gpu":
      case "maps":
      case "audio":
      case "orchestrator":
      case "ai-infra":
        return language === "ar"
          ? "البنية التحتية والذكاء"
          : "AI & INFRASTRUCTURE";
      case "databases":
        return language === "ar"
          ? "قواعد البيانات"
          : "DATABASES";
      case "finance":
      case "plans":
      case "referrals":
        return language === "ar"
          ? "المالية والاشتراكات"
          : "FINANCE & SUBSCRIPTIONS";
      case "users":
      case "ads":
        return language === "ar"
          ? "المستخدمين والإعلانات"
          : "USERS & COMMUNITY";
      case "emails":
      case "broadcast":
        return language === "ar"
          ? "مركز المراسلات"
          : "COMMUNICATIONS";
      case "theme":
        return language === "ar"
          ? "اعدادات المظهر"
          : "APPEARANCE SETTINGS";
      case "audit":
      case "radar":
      case "metrics":
        return language === "ar"
          ? "الامان والتدقيق"
          : "SECURITY & AUDITING";
      case "settings":
      case "seo":
      case "design-seo":
      case "memories":
      case "memory":
        return language === "ar"
          ? "اعدادات النظام"
          : "SYSTEM SETTINGS";
      default:
        return language === "ar" ? "لوحة التحكم" : "ADMIN DASHBOARD";
    }
  };

  const getSubTitle = () => {
    switch (path) {
      case "dashboard":
        return language === "ar"
          ? "مراقبة وتشخيص النظام والعمليات الحية في الوقت الفعلي"
          : "REAL-TIME DIAGNOSTICS & SYSTEM PERFORMANCE MONITORING";
      case "keys":
      case "gpu":
      case "maps":
      case "audio":
      case "orchestrator":
      case "ai-infra":
        return language === "ar"
          ? "خزائن المفاتيح، خوادم الـ GPU، مزودو الخرائط، مزودو الصوت وتوجيه الموديلات"
          : "LLM KEYS, GPU CLUSTERS, MAP PROVIDERS, AUDIO INFRA & MODEL ROUTING";
      case "databases":
        return language === "ar"
          ? "عقد الاتصال المعزولة، الترحيل الآلي، والنسخ الاحتياطي والإنعاش"
          : "SEGREGATED CLUSTERS, MIGRATIONS & DISASTER RECOVERY";
      case "finance":
      case "plans":
      case "referrals":
        return language === "ar"
          ? "السجل التراكمي المقفل، الباقات والحدود الدقيقة، وشجرة الإحالات"
          : "APPEND-ONLY LEDGER, SUBSCRIPTION PLANS & AFFILIATE RADAR";
      case "users":
      case "ads":
        return language === "ar"
          ? "إدارة الحسابات والرتب، منشورات بيربليكستا بورد، والحملات الممولة"
          : "USER ROLES, WALLETS, BULLETIN ADS & PROMOTIONS";
      case "emails":
      case "broadcast":
        return language === "ar"
          ? "قوالب البريد الذكي ثنائية اللغة وحملات البث والإشعارات الموجهة"
          : "BILINGUAL EMAIL TEMPLATES & TARGETED BROADCAST NOTIFICATIONS";
      case "theme":
        return language === "ar"
          ? "استوديو الثيمات وتوكنز الألوان وتخصيص متغيرات المظهر"
          : "THEME TOKENS, SURFACE STYLING & APPEARANCE CONTROLS";
      case "audit":
      case "radar":
      case "metrics":
        return language === "ar"
          ? "سجلات التدقيق الإداري، رادار الهجمات، ومقاييس الأداء والرندر"
          : "COMPLIANCE AUDIT TRAIL, SECURITY RADAR & RENDER METRICS";
      case "settings":
      case "seo":
      case "design-seo":
      case "memories":
      case "memory":
        return language === "ar"
          ? "وضع الصيانة، سياسات التسجيل، مركز السيو والذاكرة المعرفية والتحكم العام بالمنصة"
          : "MAINTENANCE MODE, REGISTRATION POLICIES, SEO, COGNITIVE MEMORY & SYSTEM PARAMETERS";
      default:
        return "ENTERPRISE COMMAND & CONTROL";
    }
  };

  const getIcon = () => {
    const iconClass = "text-[var(--text-primary)]";
    switch (path) {
      case "dashboard":
        return <Activity size={20} className={iconClass} />;
      case "keys":
      case "gpu":
      case "maps":
      case "audio":
      case "orchestrator":
      case "ai-infra":
        return <Cpu size={20} className={iconClass} />;
      case "databases":
        return <Database size={20} className={iconClass} />;
      case "finance":
      case "plans":
      case "referrals":
        return <Landmark size={20} className={iconClass} />;
      case "users":
      case "ads":
        return <Users size={20} className={iconClass} />;
      case "emails":
      case "broadcast":
        return <Mail size={20} className={iconClass} />;
      case "theme":
        return <Palette size={20} className={iconClass} />;
      case "audit":
      case "radar":
      case "metrics":
        return <ShieldAlert size={20} className={iconClass} />;
      case "settings":
      case "seo":
      case "design-seo":
      case "memories":
      case "memory":
        return <Settings size={20} className={iconClass} />;
      default:
        return <Settings2 size={20} className={iconClass} />;
    }
  };

  const getHeaderActionConfig = () => {
    const isAr = language === "ar";
    switch (path) {
      case "settings":
        return {
          label: isAr ? "حفظ الإعدادات" : "Save Settings",
          icon: <Save size={15} />,
          event: "admin-save-settings",
          variant: "primary",
        };
      case "seo":
        return {
          label: isAr ? "بدء المزامنة" : "Start Sync",
          icon: <Sparkles size={15} />,
          event: "admin-sync-seo",
          variant: "primary",
        };
      case "memories":
      case "memory":
        return {
          label: isAr ? "تنظيف السياق" : "Clean Memory",
          icon: <Brain size={15} />,
          event: "admin-clean-memory",
          variant: "primary",
        };
      case "theme":
        return {
          label: isAr ? "حفظ المظهر" : "Save Theme",
          icon: <Palette size={15} />,
          event: "admin-save-theme",
          variant: "primary",
        };
      case "users":
        return {
          label: isAr ? "إضافة مستخدم" : "Add User",
          icon: <UserPlus size={15} />,
          event: "admin-add-user",
          variant: "primary",
        };
      case "ads":
        return {
          label: isAr ? "إضافة إعلان" : "Add Ad",
          icon: <Plus size={15} />,
          event: "admin-add-ad",
          variant: "primary",
        };
      case "plans":
        return {
          label: isAr ? "إضافة خطة" : "New Plan",
          icon: <Plus size={15} />,
          event: "admin-add-plan",
          variant: "primary",
        };
      case "broadcast":
        return {
          label: isAr ? "إرسال بث" : "New Broadcast",
          icon: <Send size={15} />,
          event: "admin-add-broadcast",
          variant: "primary",
        };
      case "audit":
        return {
          label: isAr ? "تحديث السجل" : "Refresh Audit",
          icon: <RefreshCw size={15} />,
          event: "admin-refresh-audit",
          variant: "secondary",
        };
      case "keys":
        return {
          label: isAr ? "تحديث المفاتيح" : "Sync Keys",
          icon: <RefreshCw size={15} />,
          event: "admin-sync-keys",
          variant: "secondary",
        };
      case "databases":
        return {
          label: isAr ? "فحص قواعد البيانات" : "Test DB Connections",
          icon: <Database size={15} />,
          event: "admin-test-db",
          variant: "secondary",
        };
      default:
        return null;
    }
  };

  const headerAction = getHeaderActionConfig();

  const handleHeaderActionClick = () => {
    if (headerAction) {
      window.dispatchEvent(new CustomEvent(headerAction.event));
    }
  };

  const isOptimal = pulseData && pulseData.status === 'optimal' && pulseErrorCount < 3;
  const isDegraded = pulseData && pulseData.status === 'degraded' && pulseErrorCount < 3;
  const pulseColor = isOptimal ? '#334155' : isDegraded ? '#f59e0b' : '#f43f5e';
  const pulseText = isOptimal 
    ? (language === 'ar' ? 'ممتاز' : 'Optimal') 
    : isDegraded 
    ? (language === 'ar' ? 'منخفض' : 'Degraded') 
    : (language === 'ar' ? 'معطل' : 'Disrupted');
  const pulseGlowClass = isOptimal 
    ? 'text-accent' 
    : isDegraded 
    ? 'text-[var(--fg-warning)] font-bold' 
    : 'text-[var(--fg-danger)] font-bold';

  const getSubTabs = () => {
    // 1. AI Infrastructure Hub
    if (["keys", "gpu", "maps", "audio", "auth", "payments", "gateways", "orchestrator", "ai-infra"].includes(path)) {
      return [
        { id: "keys", labelAr: "المفاتيح", labelEn: "API Keys", path: "/admin/keys", icon: <Key size={15} /> },
        { id: "gpu", labelAr: "خوادم GPU", labelEn: "GPU Nodes", path: "/admin/gpu", icon: <Cpu size={15} /> },
        { id: "maps", labelAr: "الخرائط", labelEn: "Maps", path: "/admin/maps", icon: <MapPin size={15} /> },
        { id: "audio", labelAr: "الصوت", labelEn: "Audio", path: "/admin/audio", icon: <Music size={15} /> },
        { id: "auth", labelAr: "المصادقة", labelEn: "OAuth", path: "/admin/auth", icon: <Fingerprint size={15} /> },
        { id: "payments", labelAr: "الدفع", labelEn: "Payments", path: "/admin/payments", icon: <CreditCard size={15} /> },
        { id: "orchestrator", labelAr: "التوجيه", labelEn: "AI Routing", path: "/admin/orchestrator", icon: <Sliders size={15} /> },
      ];
    }
    // 2. Finance & Subscriptions Hub
    if (["finance", "plans", "referrals"].includes(path)) {
      return [
        { id: "finance", labelAr: "المالية والمحفظة", labelEn: "Financial Vault", path: "/admin/finance", icon: <Landmark size={15} /> },
        { id: "plans", labelAr: "الباقات والاشتراكات", labelEn: "Plans & Limits", path: "/admin/plans", icon: <Coins size={15} /> },
        { id: "referrals", labelAr: "شجرة الإحالات", labelEn: "Affiliates", path: "/admin/referrals", icon: <Users size={15} /> },
      ];
    }
    // 3. Communications Hub
    if (["emails", "broadcast"].includes(path)) {
      return [
        { id: "emails", labelAr: "قوالب البريد", labelEn: "Email Templates", path: "/admin/emails", icon: <Mail size={15} /> },
        { id: "broadcast", labelAr: "البث الجماعي", labelEn: "Mass Broadcast", path: "/admin/broadcast", icon: <Bell size={15} /> },
      ];
    }
    // 4. Security & Auditing Hub
    if (["audit", "radar", "metrics"].includes(path)) {
      return [
        { id: "audit", labelAr: "سجل التدقيق", labelEn: "Audit Trail", path: "/admin/audit", icon: <ShieldAlert size={15} /> },
        { id: "radar", labelAr: "رادار الأمان", labelEn: "Security Radar", path: "/admin/radar", icon: <Shield size={15} /> },
        { id: "metrics", labelAr: "مقاييس الأداء", labelEn: "Render Metrics", path: "/admin/metrics", icon: <Activity size={15} /> },
      ];
    }
    // 5. System Settings Hub
    if (["settings", "seo", "design-seo", "memories", "memory"].includes(path)) {
      return [
        { id: "settings", labelAr: "الإعدادات العامة", labelEn: "General Settings", path: "/admin/settings", icon: <Settings size={15} /> },
        { id: "seo", labelAr: "مركز السيو (SEO)", labelEn: "SEO Center", path: "/admin/seo", icon: <Globe size={15} /> },
        { id: "memories", labelAr: "إدارة الذاكرة والسياق", labelEn: "Memory Engine", path: "/admin/memories", icon: <Brain size={15} /> },
      ];
    }
    return [];
  };

  const subTabs = getSubTabs();

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen-safe bg-[var(--surface-page)] text-center p-6 transition-theme">
        <MonitorSmartphone size={64} className="text-[var(--text-muted)] mb-6 drop-shadow-sm" />
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3 tracking-tight">
          {language === 'ar' ? 'غير متاح على الجوال' : 'Not Available on Mobile'}
        </h2>
        <p className="text-base text-[var(--text-muted)] max-w-sm leading-relaxed">
          {language === 'ar'
            ? 'لوحة الإدارة مصممة للشاشات الكبيرة لضمان تجربة تحكم احترافية. يرجى فتح هذه الصفحة من جهاز كمبيوتر مكتبي.'
            : 'The Admin Dashboard is optimized for larger screens to ensure a professional control experience. Please access this page from a desktop computer.'}
        </p>
        <button
          onClick={() => navigate("/chat")}
          className="mt-6 px-5 py-2.5 bg-accent hover:bg-accent/90 text-[var(--fg-on-emphasis)] rounded-[var(--radius-md)] text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          {language === 'ar' ? 'العودة للمحادثة' : 'Back to Chat'}
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={perplextaPageTransition}
      className="flex flex-col w-full"
    >
      {/* Pinned Sticky Top Header Banner with Category Title, Pulse Indicator, & Integrated Sub-Tabs Navigation */}
      <div
        className="sticky top-0 z-30 -mx-6 md:-mx-8 px-6 md:px-8 pt-3 pb-3 mb-6 transition-theme bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-default)] shadow-xs flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {path !== "dashboard" && (
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2.5 rounded-[var(--radius-sm)] transition-theme flex items-center justify-center bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-default)] shadow-xs cursor-pointer shrink-0 min-h-[44px] touch-target-44"
                title={t("back")}
              >
                {dir === "rtl" ? (
                  <ArrowRight size={20} />
                ) : (
                  <ArrowLeft size={20} />
                )}
              </button>
            )}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--surface-card)] shadow-2xs border border-[var(--border-default)] transition-theme text-[var(--text-primary)] flex items-center justify-center shrink-0"
              >
                {getIcon()}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)] transition-theme font-sans leading-tight">
                  {getTitle()}
                </h1>
                <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 leading-normal hidden sm:block">
                  {getSubTitle()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {headerAction && (
              <button
                onClick={handleHeaderActionClick}
                className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] touch-target-44 rounded-[var(--radius-sm)] transition-all font-bold text-xs shadow-xs active:scale-95 cursor-pointer whitespace-nowrap ${
                  headerAction.variant === "secondary"
                    ? "bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)]"
                    : "bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] shadow-sm"
                }`}
              >
                {headerAction.icon}
                <span>{headerAction.label}</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setIsPulseOpen(!isPulseOpen)}
                className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] touch-target-44 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] transition-all hover:bg-[var(--surface-subtle)] cursor-pointer select-none active:scale-95 shadow-2xs text-xs font-bold text-[var(--text-primary)]"
              >
                <div className="w-2.5 h-2.5 rounded-[var(--radius-full)] shrink-0" style={{ backgroundColor: pulseColor }} />
                <span>{language === 'ar' ? 'نبض النظام' : 'Pulse'}: <span className="text-[var(--text-secondary)] font-normal">{pulseText}</span></span>
              </button>

              <AnimatePresence>
                {isPulseOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsPulseOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 w-96 z-50 p-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl transition-theme`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-default)]">
                        <div className="flex items-center gap-2">
                          <Activity size={16} className={pulseGlowClass} />
                          <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-primary)]">
                            {language === 'ar' ? 'فحص تشخيصي للنبض' : 'Pulse System Diagnostics'}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-[var(--text-muted)] font-mono">
                          {pulseData ? formatPulseUptime(pulseData.uptime) : '0s'}
                        </span>
                      </div>

                      <div className="mb-4 bg-[var(--surface-subtle)] rounded-[var(--radius-xs)] p-2 border border-[var(--border-default)] overflow-hidden">
                        <svg className="w-full h-10 stroke-current opacity-90" viewBox="0 0 100 20" fill="none">
                          <motion.path
                            d="M 0,10 Q 15,10 20,10 T 30,10 T 32,5 T 34,15 T 36,1 T 38,19 T 40,10 T 50,10 T 60,10 T 62,3 T 64,17 T 66,10 T 80,10 T 90,10 T 100,10"
                            stroke={pulseColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ strokeDasharray: "200", strokeDashoffset: "200" }}
                            animate={{ strokeDashoffset: ["200", "0"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          />
                        </svg>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 border-b border-[var(--border-default)]/60 pb-0.5">
                            {language === 'ar' ? 'عقد قواعد البيانات ومزامنتها' : 'Database Node Synchronization'}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="p-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex flex-col justify-between">
                              <span className="text-[8px] text-[var(--text-muted)] font-bold">{language === 'ar' ? 'قاعدة البيانات المركزية' : 'Core Engine DB'}</span>
                              <span className={`font-black ${pulseData?.databases?.core?.status === 'connected' ? 'text-accent' : 'text-[var(--fg-danger)]'}`}>
                                {pulseData?.databases?.core?.status === 'connected' ? `Connected (${pulseData.databases.core.latencyMs}ms)` : 'Offline'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex flex-col justify-between">
                              <span className="text-[8px] text-[var(--text-muted)] font-bold">{language === 'ar' ? 'دفتر الحسابات والمالية' : 'Ledger Vault DB'}</span>
                              <span className={`font-black ${pulseData?.databases?.ledger?.status === 'connected' ? 'text-accent' : 'text-[var(--fg-danger)]'}`}>
                                {pulseData?.databases?.ledger?.status === 'connected' ? `Connected (${pulseData.databases.ledger.latencyMs}ms)` : 'Offline'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex flex-col justify-between">
                              <span className="text-[8px] text-[var(--text-muted)] font-bold">{language === 'ar' ? 'السحابة الخارجية' : 'External Sync Registry'}</span>
                              <span className={`font-black ${pulseData?.databases?.external?.status === 'connected' ? 'text-accent' : 'text-[var(--fg-danger)]'}`}>
                                {pulseData?.databases?.external?.status === 'connected' ? `Connected (${pulseData.databases.external.latencyMs}ms)` : 'Offline'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex flex-col justify-between">
                              <span className="text-[8px] text-[var(--text-muted)] font-bold">{language === 'ar' ? 'حماية وأمن البيانات' : 'Security Registry'}</span>
                              <span className={`font-black ${pulseData?.databases?.security?.status === 'connected' ? 'text-accent' : 'text-[var(--fg-danger)]'}`}>
                                {pulseData?.databases?.security?.status === 'connected' ? `Connected (${pulseData.databases.security.latencyMs}ms)` : 'Offline'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex flex-col justify-between col-span-2">
                              <span className="text-[8px] text-[var(--text-muted)] font-bold">{language === 'ar' ? 'خزينة الوسائط والتصاميم' : 'Media & Canvas Vault'}</span>
                              <span className={`font-black ${pulseData?.databases?.media?.status === 'connected' ? 'text-accent' : 'text-[var(--fg-danger)]'}`}>
                                {pulseData?.databases?.media?.status === 'connected' ? `Connected (${pulseData.databases.media.latencyMs}ms)` : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 border-b border-[var(--border-default)]/60 pb-0.5">
                            {language === 'ar' ? 'العمليات الخلفية النشطة' : 'Background Process Handlers'}
                          </div>
                          <div className="space-y-1 text-[9px] text-[var(--text-muted)] font-medium font-sans">
                            <div className="flex justify-between items-center bg-[var(--surface-subtle)] px-2 py-1 rounded-[var(--radius-xs)]">
                              <span>{language === 'ar' ? 'الصيانة والمسح اليومي' : 'Daily Maintenance & Trash Purge'}</span>
                              <span className={`font-bold ${pulseData?.cronTasks?.dailyMaintenance?.status === 'success' ? 'text-accent' : pulseData?.cronTasks?.dailyMaintenance?.status === 'running' ? 'text-[var(--fg-warning)]' : 'text-[var(--fg-accent)]'}`}>
                                {pulseData?.cronTasks?.dailyMaintenance ? `${formatPulseRelative(pulseData.cronTasks.dailyMaintenance.lastRun)}` : 'Pending'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--surface-subtle)] px-2 py-1 rounded-[var(--radius-xs)]">
                              <span>{language === 'ar' ? 'نبض المزامنة الذكية' : 'Database Pulse Tracker'}</span>
                              <span className={`font-bold ${pulseData?.cronTasks?.databaseHeartbeat?.status === 'success' ? 'text-accent' : pulseData?.cronTasks?.databaseHeartbeat?.status === 'running' ? 'text-[var(--fg-warning)]' : 'text-[var(--fg-accent)]'}`}>
                                {pulseData?.cronTasks?.databaseHeartbeat ? `${formatPulseRelative(pulseData.cronTasks.databaseHeartbeat.lastRun)}` : 'Pending'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--surface-subtle)] px-2 py-1 rounded-[var(--radius-xs)]">
                              <span>{language === 'ar' ? 'تنظيف الجلسات المؤقتة' : 'Auth Token & Session Purge'}</span>
                              <span className={`font-bold ${pulseData?.cronTasks?.expiredTokensCleanup?.status === 'success' ? 'text-accent' : pulseData?.cronTasks?.expiredTokensCleanup?.status === 'running' ? 'text-[var(--fg-warning)]' : 'text-[var(--fg-accent)]'}`}>
                                {pulseData?.cronTasks?.expiredTokensCleanup ? `${formatPulseRelative(pulseData.cronTasks.expiredTokensCleanup.lastRun)}` : 'Pending'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--surface-subtle)] px-2 py-1 rounded-[var(--radius-xs)]">
                              <span>{language === 'ar' ? 'تدقيق الاشتراكات الفعالة' : 'Subscription Renewal Audits'}</span>
                              <span className={`font-bold ${pulseData?.cronTasks?.subscriptionAudit?.status === 'success' ? 'text-accent' : pulseData?.cronTasks?.subscriptionAudit?.status === 'running' ? 'text-[var(--fg-warning)]' : 'text-[var(--fg-accent)]'}`}>
                                {pulseData?.cronTasks?.subscriptionAudit ? `${formatPulseRelative(pulseData.cronTasks.subscriptionAudit.lastRun)}` : 'Pending'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--surface-subtle)] px-2 py-1 rounded-[var(--radius-xs)]">
                              <span>{language === 'ar' ? 'ضغط وتقليص ذاكرة الذكاء' : 'Memory Distillation Cycle'}</span>
                              <span className={`font-bold ${pulseData?.cronTasks?.memoryCompaction?.status === 'success' ? 'text-accent' : pulseData?.cronTasks?.memoryCompaction?.status === 'running' ? 'text-[var(--fg-warning)]' : 'text-[var(--fg-accent)]'}`}>
                                {pulseData?.cronTasks?.memoryCompaction ? `${formatPulseRelative(pulseData.cronTasks.memoryCompaction.lastRun)}` : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-[var(--border-default)]/60">
                          <div className="grid grid-cols-2 gap-4 text-[9px] text-[var(--text-muted)] font-bold">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span>CPU UTILIZATION</span>
                                <span>{pulseData?.cpu ?? 0}%</span>
                              </div>
                              <div className="h-1 bg-[var(--border-default)] rounded-full overflow-hidden">
                                <div className="h-full bg-accent" style={{ width: `${pulseData?.cpu ?? 0}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span>HEAP ALLOC</span>
                                <span>{pulseData?.memory?.percent ?? 0}%</span>
                              </div>
                              <div className="h-1 bg-[var(--border-default)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--fg-accent)]" style={{ width: `${pulseData?.memory?.percent ?? 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Integrated Sub-Tabs Navigation (pinned at top alongside title!) */}
        {subTabs.length > 0 && (
          <div className="w-full flex items-center gap-1.5 p-1 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] overflow-x-auto max-w-full custom-scrollbar">
            {subTabs.map((tab) => {
              const isActive = path === tab.id || (tab.id === "settings" && path === "settings") || (tab.id === "seo" && path === "seo") || (tab.id === "memories" && (path === "memories" || path === "memory"));
              return (
                <button
                  key={`sticky-subtab-${tab.id}`}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-[var(--radius-sm)] text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-44 ${
                    isActive
                      ? "bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-xs border border-[var(--border-accent)]/30 font-black"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]/50 border border-transparent"
                  }`}
                >
                  {tab.icon && <span className={isActive ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"}>{tab.icon}</span>}
                  <span>{language === 'ar' ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className={`relative transition-theme ${
          [
            "dashboard", "radar", "databases", "orchestrator", "keys", "gpu", "maps",
            "finance", "plans", "users", "emails", "broadcast", "settings",
            "audit", "referrals", "ads", "metrics", "seo", "theme", "ai-infra", "design-seo"
          ].includes(path)
            ? ""
            : `p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl`
        }`}
      >
        <ErrorBoundary name="Admin Command Panels">
          {path === "dashboard" ? (
            <CommandCenterView theme={theme} t={t} showToast={showToast} />
          ) : ["keys", "gpu", "maps", "audio", "auth", "payments", "gateways", "orchestrator", "ai-infra"].includes(path) ? (
            <AiInfrastructureHubView
              theme={theme}
              t={t}
              dir={dir}
              language={language}
              providerModels={providerModels}
              setProviderModels={setProviderModels}
              showToast={showToast}
              onRefreshModels={fetchProviderModels}
              hideSubTabs={true}
              initialTab={
                path === "gpu"
                  ? "gpu"
                  : path === "maps"
                  ? "maps"
                  : path === "audio"
                  ? "audio"
                  : path === "auth"
                  ? "auth"
                  : path === "payments" || path === "gateways"
                  ? "payments"
                  : path === "orchestrator"
                  ? "orchestrator"
                  : "keys"
              }
              onTabChange={(tab) => navigate(`/admin/${tab}`, { replace: true })}
            />
          ) : path === "databases" ? (
            <DatabaseOrchestrationView
              theme={theme}
              t={t}
              dir={dir}
              language={language}
            />
          ) : ["finance", "plans", "referrals"].includes(path) ? (
            <FinanceMonetizationHubView
              theme={theme}
              t={t}
              dir={dir}
              language={language}
              showToast={showToast}
              hideSubTabs={true}
              initialTab={
                path === "plans"
                  ? "plans"
                  : path === "referrals"
                  ? "referrals"
                  : "finance"
              }
              onTabChange={(tab) => navigate(`/admin/${tab}`, { replace: true })}
            />
          ) : path === "users" ? (
            <UserManagementView
              theme={theme}
              t={t}
              dir={dir}
              showToast={showToast}
            />
          ) : path === "ads" ? (
            <AdsManagementView
              theme={theme}
              t={t}
              dir={dir}
              language={language}
            />
          ) : ["emails", "broadcast"].includes(path) ? (
            <CommunicationsHubView
              theme={theme}
              t={t}
              dir={dir}
              language={language}
              showToast={showToast}
              hideSubTabs={true}
              initialTab={path === "broadcast" ? "broadcast" : "emails"}
              onTabChange={(tab) => navigate(`/admin/${tab}`, { replace: true })}
            />
          ) : path === "theme" ? (
            <ThemeStudioView
              t={t}
              showToast={showToast}
              token={token}
              language={language}
            />
          ) : ["audit", "radar", "metrics"].includes(path) ? (
            <ComplianceAuditLogsView
              theme={theme}
              t={t}
              dir={dir}
              hideSubTabs={true}
              initialTab={path === "radar" ? "radar" : path === "metrics" ? "metrics" : "logs"}
            />
          ) : ["settings", "seo", "design-seo", "memories", "memory"].includes(path) ? (
            <SystemSettingsView
              theme={theme}
              t={t}
              dir={dir}
              hideSubTabs={true}
              initialTab={
                path === "seo" 
                  ? "seo" 
                  : (path === "memories" || path === "memory") 
                  ? "memory" 
                  : "general"
              }
              onTabChange={(tab) => navigate(`/admin/${tab === "seo" ? "seo" : tab === "memory" ? "memories" : "settings"}`, { replace: true })}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
              <div className="mb-6 opacity-50">{getIcon()}</div>
              <p className="text-lg font-medium">
                This section is currently under construction.
              </p>
              <p className="text-sm mt-2">
                We are building the {getTitle()} module according to the AGENTS.md
                architecture.
              </p>
            </div>
          )}
        </ErrorBoundary>
      </div>

      <AnimatePresence>
        {previewUrl && (
          <PagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
