import { secureStorage } from "@/lib/storage";
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { getAuthHeaders, getTimeAgo } from "../../utils/adminUtils";
import { AdminService } from "../../services/adminService";
import { SelectDropdown } from "@/design-system";
import {
  Settings2,
  FileText,
  ShieldCheck,
  Download,
  ArrowRight,
  ArrowLeft,
  Mail,
  Send,
  Save,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  Sliders,
  DollarSign,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Shield,
  Key,
  Database,
  Users,
  Settings,
  Plus,
  Zap,
  Server,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Coins,
  Wrench,
  LayoutGrid,
  Scale,
  Megaphone,
  ImageIcon,
  Video,
  Mic,
  Volume2,
  GraduationCap,
  Code2,
  Music,
  Trash2,
  X,
  Star,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { SmartEmailHubViewProps } from "./adminTypes";
import { useConfirm } from '@/design-system';

export 
const SmartEmailHubView = ({
  theme,
  t,
  dir = 'rtl',
  showToast,
}: {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir?: 'rtl' | 'ltr';
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}) => {
  const [activeTab, setActiveTab] = useState<"settings" | "templates" | "feedback_logs">(
    "settings",
  );
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const confirm = useConfirm();
  const { token, language, siteSettings, setIsOperationPending, socket } = useAppContext();

  // Feedback Logs State
  const [feedbackLogs, setFeedbackLogs] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>({
    total: 0,
    likes_count: 0,
    dislikes_count: 0,
    avg_rating: 5
  });
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'like' | 'dislike'>('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');

  const [settings, setSettings] = useState<any>({
    mailer_type: "smtp",
    smtp_host: "",
    smtp_port: "",
    smtp_encryption: "tls",
    smtp_username: "",
    smtp_password: "",
    sender_name: "",
    sender_email: "",
    status: "active",
    last_verified_at: null,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isImportingDefaults, setIsImportingDefaults] = useState(false);

  useEffect(() => {
    setIsOperationPending(
      isSavingSettings ||
        isSavingTemplate ||
        isTestingConnection ||
        isImportingDefaults,
    );
  }, [
    isSavingSettings,
    isSavingTemplate,
    isTestingConnection,
    isImportingDefaults,
    setIsOperationPending,
  ]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/mail-services-v3/config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        } else {
          console.error("Failed to fetch settings: ", res.status);
          const text = await res.text();
          if (text.includes("<html>")) {
            showToast(
              "WAF/Firewall blocked the request (403 HTML received)",
              "error",
            );
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch email settings:", error);
        }
      }
    };
    if (token) fetchSettings();
  }, [token, showToast]);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch("/api/mail-services-v3/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch email templates:", error);
      }
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [token]);

  const fetchFeedbackLogs = useCallback(async () => {
    if (!token) return;
    setIsLoadingFeedback(true);
    try {
      let url = `/api/mail-services-v3/feedback-logs?type=${feedbackFilter}`;
      if (feedbackSearch.trim()) {
        url += `&search=${encodeURIComponent(feedbackSearch.trim())}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackLogs(data.logs || []);
        if (data.stats) {
          setFeedbackStats(data.stats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch feedback logs:", error);
    } finally {
      setIsLoadingFeedback(false);
    }
  }, [token, feedbackFilter, feedbackSearch]);

  useEffect(() => {
    if (activeTab === "feedback_logs") {
      fetchFeedbackLogs();
    }
  }, [activeTab, fetchFeedbackLogs]);

  // Real-time listener for incoming AI feedback emails & notifications
  useEffect(() => {
    if (!socket) return;
    const handleIncomingFeedback = (data: any) => {
      showToast(
        dir === "rtl" 
          ? `وصل إشعار بريد جديد: ${data.feedback_type === 'like' ? '🌟 تقييم إيجابي' : '⚠️ بلاغ تصحيح'} من ${data.user_name || 'مستخدم'}`
          : `New Email Notice: ${data.feedback_type === 'like' ? '🌟 Praise & Rating' : '⚠️ Dislike & Correction'} from ${data.user_name || 'User'}`,
        data.feedback_type === 'like' ? 'success' : 'warning'
      );
      fetchFeedbackLogs();
    };

    socket.on('admin_email_feedback', handleIncomingFeedback);
    return () => {
      socket.off('admin_email_feedback', handleIncomingFeedback);
    };
  }, [socket, dir, showToast, fetchFeedbackLogs]);

  const handleImportDefaults = async () => {
    const isConfirmed = await confirm({
      title: dir === "rtl" ? "استيراد القوالب الافتراضية" : "Import Default Templates",
      description: dir === "rtl"
        ? "هل أنت متأكد من جلب القوالب الافتراضية؟ سيتم تحديث القوالب الموجودة."
        : "Are you sure you want to fetch default templates? Existing system templates will be updated.",
      variant: "warning"
    });
    if (!isConfirmed) return;

    setIsImportingDefaults(true);
    try {
      const res = await fetch("/api/mail-services-v3/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast(
          dir === "rtl"
            ? "تم جلب القوالب بنجاح"
            : "Templates imported successfully",
          "success",
        );
        setTimeout(() => {
          fetchTemplates();
        }, 500);
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Security Filter Intervention" }));
        showToast(
          (dir === "rtl" ? "فشل جلب القوالب: " : "Failed: ") +
            (errorData.error || "Unknown error"),
          "error",
        );
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to import templates:", error);
      }
      showToast(error.message || "Error", "error");
    } finally {
      setIsImportingDefaults(false);
    }
  };

  useEffect(() => {
    if (activeTab === "templates") {
      fetchTemplates();
    }
  }, [activeTab, fetchTemplates]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/mail-services-v3/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast(
          dir === "rtl"
            ? "تم حفظ الإعدادات بنجاح"
            : "Settings saved successfully!",
          "success",
        );
      } else {
        const text = await res.text();
        if (text.includes("<html>")) {
          showToast("Blocked by Firewall (403 HTML)", "error");
        } else {
          showToast(
            dir === "rtl" ? "فشل حفظ الإعدادات" : "Failed to save settings",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast("Network/Security Error", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const token = secureStorage.getSync("app_token");
      const res = await fetch("/api/mail-services-v3/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        showToast("Security filter blocked the response body.", "error");
        setIsTestingConnection(false);
        return;
      }

      if (res.ok) {
        showToast(
          dir === "rtl"
            ? "تم التحقق من الاتصال بنجاح!"
            : "Connection verified successfully!",
          "success",
        );
        // Refresh settings
        const refreshRes = await fetch("/api/mail-services-v3/config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setSettings(freshData);
        }
      } else {
        showToast(data.error || "Connection Failed", "error");
      }
    } catch (error: any) {
      console.error("Failed to test connection:", error);
      showToast(error.message || "Error", "error");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    // Client-side validation
    const missingFields = [];
    if (!selectedTemplate.name?.trim())
      missingFields.push(dir === "rtl" ? "اسم القالب" : "Template Name");
    if (!selectedTemplate.subject_en?.trim())
      missingFields.push(dir === "rtl" ? "الموضوع (EN)" : "Subject (EN)");
    if (!selectedTemplate.subject_ar?.trim())
      missingFields.push(dir === "rtl" ? "الموضوع (AR)" : "Subject (AR)");
    if (!selectedTemplate.body_en?.trim())
      missingFields.push(dir === "rtl" ? "المحتوى (EN)" : "Body (EN)");
    if (!selectedTemplate.body_ar?.trim())
      missingFields.push(dir === "rtl" ? "المحتوى (AR)" : "Body (AR)");

    if (missingFields.length > 0) {
      showToast(
        dir === "rtl"
          ? `يرجى ملء الحقول التالية: ${missingFields.join("، ")}`
          : `Required: ${missingFields.join(", ")}`,
        "error"
      );
      return;
    }

    setIsSavingTemplate(true);
    try {
      const token = secureStorage.getSync("app_token");
      const res = await fetch("/api/mail-services-v3/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedTemplate),
      });
      if (res.ok) {
        await fetchTemplates();
        setSelectedTemplate(null);
        showToast(
          dir === "rtl" ? "تم حفظ القالب بنجاح" : "Template saved successfully",
          "success"
        );
      } else {
        const errorData = await res.json().catch(() => ({ error: "Blocked" }));
        showToast(errorData.error || "Failed to save", "error");
      }
    } catch (error) {
      showToast("Connection Error", "error");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const isConfirmed = await confirm({ title: "Delete Template", description: "Are you sure you want to delete this template?", variant: "danger" as const });
    if (!isConfirmed) return;
    try {
      const token = secureStorage.getSync("app_token");
      const res = await fetch(`/api/mail-services-v3/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("Template deleted", "success");
        await fetchTemplates();
      }
    } catch (error) {
      showToast("Error", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 custom-scrollbar scroll-smooth border-b border-[var(--border-default)]">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
            activeTab === "settings"
              ? "bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] border-[var(--border-accent)] shadow-xs"
              : "bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-accent)] hover:text-[var(--fg-accent)]"
          }`}
        >
          <Settings2 size={15} className={activeTab === "settings" ? "text-[var(--fg-on-emphasis)]" : "text-[var(--text-muted)]"} />
          <span>{t("emailSettings")}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("templates");
            setSelectedTemplate(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
            activeTab === "templates"
              ? "bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] border-[var(--border-accent)] shadow-xs"
              : "bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-accent)] hover:text-[var(--fg-accent)]"
          }`}
        >
          <FileText size={15} className={activeTab === "templates" ? "text-[var(--fg-on-emphasis)]" : "text-[var(--text-muted)]"} />
          <span>{t("emailTemplates")}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("feedback_logs");
            setSelectedTemplate(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
            activeTab === "feedback_logs"
              ? "bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] border-[var(--border-accent)] shadow-xs"
              : "bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-accent)] hover:text-[var(--fg-accent)]"
          }`}
        >
          <Mail size={15} className={activeTab === "feedback_logs" ? "text-[var(--fg-on-emphasis)]" : "text-[var(--text-muted)]"} />
          <span>{dir === "rtl" ? "تقارير تقييمات المساعد والبريد الوارد" : "AI Feedback & Incoming Notices"}</span>
          {feedbackStats?.total > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "feedback_logs" 
                ? "bg-white/20 text-white" 
                : "bg-[var(--surface-subtle)] text-[var(--fg-accent)]"
            }`}>
              {feedbackStats.total}
            </span>
          )}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs transition-theme">
              <div className="flex items-center justify-between gap-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] border border-[var(--border-default)]">
                    <Server size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("smtpSettings")}</h2>
                    <p className="text-sm text-[var(--text-muted)]">{t("smtpDesc")}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-[var(--radius-xs)] text-xs font-bold flex items-center gap-1.5 border ${
                      settings.status === "active"
                        ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/25"
                        : "bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border-[var(--fg-warning)]/25"
                    }`}
                  >
                    {settings.status === "active" ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse" />
                        {dir === "rtl"
                          ? "نشط / تم التحقق"
                          : "Active / Verified"}
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--fg-warning)]" />
                        {dir === "rtl" ? "يحتاج تحقق" : "Needs Verification"}
                      </>
                    )}
                  </span>
                  {settings.last_verified_at && (
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {dir === "rtl" ? "آخر تحقق: " : "Last verified: "}
                      {new Date(settings.last_verified_at).toLocaleString(
                        language === "ar" ? "ar-EG" : "en-US",
                      )}
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                <div>
                  <SelectDropdown
                    label={t("mailerType")}
                    value={settings.mailer_type || "smtp"}
                    onChange={(val) =>
                      setSettings({ ...settings, mailer_type: val })
                    }
                    dir={dir}
                    options={[
                      { value: "smtp", label: t("smtp") || "Standard SMTP" },
                      { value: "sendgrid", label: "SendGrid (SMTP/API)" },
                      { value: "resend", label: "Resend Mailer" }
                    ]}
                  />
                </div>

                {settings.mailer_type === "smtp" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                          {t("smtpHost")}
                        </label>
                        <input
                          type="text"
                          value={settings.smtp_host || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtp_host: e.target.value,
                            })
                          }
                          placeholder="smtp.sendgrid.net"
                          className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme text-left placeholder:text-[var(--text-muted)]"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                          {t("smtpPort")}
                        </label>
                        <input
                          type="text"
                          value={settings.smtp_port || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtp_port: e.target.value,
                            })
                          }
                          placeholder="587"
                          className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme text-left placeholder:text-[var(--text-muted)]"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <SelectDropdown
                          label={t("encryption")}
                          value={settings.smtp_encryption || "tls"}
                          onChange={(val) =>
                            setSettings({
                               ...settings,
                               smtp_encryption: val,
                            })
                          }
                          dir={dir}
                          options={[
                            { value: "tls", label: t("tls") },
                            { value: "ssl", label: t("ssl") || "SSL" },
                            { value: "none", label: t("none") }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                          {t("smtpUsername") ||
                            (dir === "rtl"
                              ? "اسم مستخدم SMTP"
                              : "SMTP Username")}
                        </label>
                        <input
                          type="text"
                          value={settings.smtp_username || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtp_username: e.target.value,
                            })
                          }
                          placeholder="apikey"
                          className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme text-left placeholder:text-[var(--text-muted)]"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                        {t("smtpPassword") ||
                          (dir === "rtl" ? "كلمة سر SMTP" : "SMTP Password")}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={settings.smtp_password || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtp_password: e.target.value,
                            })
                          }
                          placeholder="••••••••••••••••"
                          className="w-full px-4 py-3 pe-12 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme text-left placeholder:text-[var(--text-muted)]"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 px-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          tabIndex={-1}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-default)]">
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                      {t("senderName")}
                    </label>
                    <input
                      type="text"
                      value={settings.sender_name || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sender_name: e.target.value,
                        })
                      }
                      placeholder={
                        dir === "rtl" ? "اسم المنصة" : "Platform Name"
                      }
                      className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme placeholder:text-[var(--text-muted)]"
                      dir={dir}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                      {t("senderEmail")}
                    </label>
                    <input
                      type="email"
                      value={settings.sender_email || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sender_email: e.target.value,
                        })
                      }
                      placeholder="noreply@example.com"
                      className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme text-left placeholder:text-[var(--text-muted)]"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="flex-1 bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] py-3.5 rounded-[var(--radius-sm)] font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                  >
                    {isSavingSettings ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {t("saveSettings")}
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-6 py-3.5 rounded-[var(--radius-sm)] font-bold transition-all border border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] hover:bg-[var(--surface-card)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isTestingConnection ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <RefreshCw size={18} />
                    )}
                    {t("testConnection")}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-[var(--fg-accent)]" size={20} />
                  {t("securityProtocol")}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  {t("securityProtocolDesc")}
                </p>
                <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--status-warning-subtle)] border border-[var(--fg-warning)]/25 text-[var(--fg-warning)] text-sm flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{t("spamWarning")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && !selectedTemplate && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("emailTemplates")}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportDefaults}
                  disabled={isImportingDefaults}
                  className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--fg-accent)] transition-all font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Download size={15} />
                  {dir === "rtl"
                    ? "جلب القوالب الافتراضية"
                    : "Fetch Default Templates"}
                </button>
                <button
                  onClick={() =>
                    setSelectedTemplate({
                      isNew: true,
                      type: "custom",
                      name: "",
                      subject_en: "",
                      subject_ar: "",
                      body_en: "",
                      body_ar: "",
                    })
                  }
                  className="flex items-center gap-2 bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] px-4 py-2 rounded-[var(--radius-sm)] transition-all font-bold text-xs shadow-xs cursor-pointer hover:opacity-90"
                >
                  <Plus size={15} />
                  {t("createNewTemplate")}
                </button>
              </div>
            </div>

            {isLoadingTemplates ? (
              <div className="flex justify-center py-12">
                <RefreshCw
                  className="animate-spin text-[var(--fg-accent)]"
                  size={32}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template, index) => (
                  <div
                    key={template.id || template.name || index}
                    className="group p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-accent)] transition-theme hover:-translate-y-0.5 hover:shadow-sm cursor-pointer relative shadow-xs"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    {template.type === "custom" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="absolute top-4 right-4 p-2 rounded-[var(--radius-xs)] bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-80"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`p-3 rounded-[var(--radius-sm)] ${template.type === "system" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400" : "bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]"}`}
                      >
                        <Mail size={22} />
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-[var(--radius-xs)] text-xs font-bold border ${template.type === "system" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25" : "bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)] border-[var(--border-accent)]/25"}`}
                      >
                        {template.type === "system"
                          ? t("systemTemplates")
                          : t("customTemplates")}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-1">
                      {template.type === "system"
                        ? t(template.name)
                        : template.name}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6 line-clamp-1">
                      {dir === "rtl"
                        ? template.subject_ar
                        : template.subject_en}
                    </p>

                    <div className="flex justify-between items-center pt-4 border-t border-[var(--border-default)]">
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(template.updated_at).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-bold text-[var(--fg-accent)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {t("editTemplate")}{" "}
                        <ArrowRight
                          size={16}
                          className={dir === "rtl" ? "rotate-180" : ""}
                        />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && selectedTemplate && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2.5 rounded-[var(--radius-sm)] transition-all flex items-center justify-center bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--fg-accent)] border border-[var(--border-default)] hover:border-[var(--border-accent)] shadow-xs cursor-pointer"
              >
                {dir === "rtl" ? (
                  <ArrowRight size={20} />
                ) : (
                  <ArrowLeft size={20} />
                )}
              </button>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {selectedTemplate.isNew
                  ? t("createNewTemplate")
                  : selectedTemplate.type === "system"
                    ? t(selectedTemplate.name)
                    : selectedTemplate.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                      {t("templateName")}
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.name || ""}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          name: e.target.value,
                        })
                      }
                      disabled={selectedTemplate.type === "system"}
                      className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                        {t("emailSubject")} (EN)
                      </label>
                      <input
                        type="text"
                        value={selectedTemplate.subject_en || ""}
                        onChange={(e) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            subject_en: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme placeholder:text-[var(--text-muted)]"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                        {t("emailSubject")} (AR)
                      </label>
                      <input
                        type="text"
                        value={selectedTemplate.subject_ar || ""}
                        onChange={(e) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            subject_ar: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme placeholder:text-[var(--text-muted)]"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                      {t("emailBody")} (EN - HTML/Text)
                    </label>
                    <textarea
                      rows={8}
                      value={selectedTemplate.body_en || ""}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          body_en: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme font-mono text-sm"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                      {t("emailBody")} (AR - HTML/Text)
                    </label>
                    <textarea
                      rows={8}
                      value={selectedTemplate.body_ar || ""}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          body_ar: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme font-mono text-sm"
                      dir="rtl"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={isSavingTemplate}
                      className="flex-1 bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] py-3.5 rounded-[var(--radius-sm)] font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                    >
                      {isSavingTemplate ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      {t("saveChanges")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Code2 className="text-[var(--fg-accent)]" size={20} />
                    {t("variables")}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    {t("clickToCopy")}
                  </p>

                  <div className="space-y-2">
                    {[
                      "{{userName}}",
                      "{{userEmail}}",
                      "{{actionUrl}}",
                      "{{planName}}",
                      "{{appName}}",
                    ].map((v) => (
                      <button
                        key={v}
                        onClick={() => navigator.clipboard.writeText(v)}
                        className="w-full flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-theme cursor-pointer"
                      >
                        <span className="font-mono text-sm text-[var(--fg-accent)] font-bold">
                          {v}
                        </span>
                        <Copy size={14} className="text-[var(--text-muted)]" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-[var(--border-default)]">
                    <h4 className="font-bold text-[var(--text-primary)] mb-2 text-sm">
                      Professional Footer
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                      The system automatically appends the{" "}
                      {(language === "ar"
                        ? siteSettings.siteNameAr
                        : siteSettings.siteName) || t("appName")}{" "}
                      signature, support email, and website link to all outgoing
                      emails.
                    </p>
                    <div className="p-4 rounded-[var(--radius-sm)] text-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] font-mono space-y-1">
                      <p>--</p>
                      <p className="font-bold text-[var(--fg-accent)]">
                        {(language === "ar"
                          ? siteSettings.siteNameAr
                          : siteSettings.siteName) || t("appName")}{" "}
                        Team
                      </p>
                      <p>Support: support@example.com</p>
                      <p>example.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "feedback_logs" && (
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                  <span className="text-xs font-bold">{dir === "rtl" ? "إجمالي التقييمات والبريد" : "Total Feedback Notices"}</span>
                  <Mail size={16} className="text-[var(--fg-accent)]" />
                </div>
                <div className="text-2xl font-black text-[var(--text-primary)] font-mono">
                  {feedbackStats.total || 0}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {dir === "rtl" ? "مرسلة بريدياً ولوحة التحكم" : "Logged & Dispatched"}
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-md)] border border-[var(--fg-success)]/20 bg-[var(--status-success-subtle)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--fg-success)] dark:text-[var(--fg-success)] mb-2">
                  <span className="text-xs font-bold">{dir === "rtl" ? "الإشادات والتقييمات الإيجابية" : "Positive Praises & Likes"}</span>
                  <ThumbsUp size={16} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[var(--fg-success)] dark:text-[var(--fg-success)] font-mono">
                    {feedbackStats.likes_count || 0}
                  </span>
                  <span className="text-xs font-bold text-[var(--fg-warning)] flex items-center gap-0.5">
                    <Star size={12} className="fill-amber-500" />
                    {Number(feedbackStats.avg_rating || 5).toFixed(1)}/5
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {dir === "rtl" ? "عززت قدرات النموذج في الذاكرة" : "Reinforced model capabilities"}
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-md)] border border-[var(--fg-danger)]/20 bg-[var(--status-danger-subtle)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--fg-danger)] dark:text-[var(--fg-danger)] mb-2">
                  <span className="text-xs font-bold">{dir === "rtl" ? "بلاغات التصحيح وتعلّم الأخطاء" : "Dislikes & Model Corrections"}</span>
                  <ThumbsDown size={16} />
                </div>
                <div className="text-2xl font-black text-[var(--fg-danger)] dark:text-[var(--fg-danger)] font-mono">
                  {feedbackStats.dislikes_count || 0}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {dir === "rtl" ? "تم تزويد المساعد بها لتفادي الخطأ" : "Trained assistant on mistakes"}
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                  <span className="text-xs font-bold">{dir === "rtl" ? "بريد الإدارة المستلم" : "Admin Receiver Mailbox"}</span>
                  <Send size={16} className="text-[var(--fg-accent)]" />
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono truncate" title={settings.sender_email || "admin@perplexta.com"}>
                  {settings.sender_email || "admin@perplexta.com"}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {settings.status === "active" ? (dir === "rtl" ? "مزود البريد متصل ونشط" : "SMTP Active") : (dir === "rtl" ? "يحتاج تفعيل مزود البريد" : "SMTP Pending")}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchFeedbackLogs()}
                    placeholder={dir === "rtl" ? "بحث في التقييمات، البريد، أو الملاحظات..." : "Search feedback, email, or comments..."}
                    className={`w-full py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent transition-theme ${dir === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchFeedbackLogs}
                  className="px-3 py-2 rounded-[var(--radius-md)] text-xs font-bold bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw size={13} className={isLoadingFeedback ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">{dir === "rtl" ? "تحديث" : "Refresh"}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {[
                  { key: 'all', labelAr: 'الكل', labelEn: 'All', count: feedbackStats.total },
                  { key: 'like', labelAr: '🌟 إشادات وتقييمات', labelEn: '🌟 Praises & Likes', count: feedbackStats.likes_count },
                  { key: 'dislike', labelAr: '⚠️ تصحيحات وأخطاء', labelEn: '⚠️ Corrections', count: feedbackStats.dislikes_count }
                ].map((flt) => (
                  <button
                    key={flt.key}
                    type="button"
                    onClick={() => setFeedbackFilter(flt.key as any)}
                    className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      feedbackFilter === flt.key
                        ? "bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] border-[var(--border-accent)]"
                        : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span>{dir === "rtl" ? flt.labelAr : flt.labelEn}</span>
                    {flt.count !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                        {flt.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Logs List */}
            {isLoadingFeedback ? (
              <div className="p-12 text-center border border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--surface-card)]">
                <RefreshCw size={24} className="animate-spin mx-auto text-[var(--fg-accent)] mb-3" />
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {dir === "rtl" ? "جاري تحميل سجلات التقييمات والبريد..." : "Loading feedback notices..."}
                </p>
              </div>
            ) : feedbackLogs.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--surface-card)]">
                <Mail size={32} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                  {dir === "rtl" ? "لا توجد تقارير تقييمات حتى الآن" : "No Feedback Notices Yet"}
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  {dir === "rtl"
                    ? "عند قيام المستخدمين بالضغط على إعجاب أو عدم إعجاب وإرسال تقييماتهم، ستصل إشعارات البريد التلقائية وتظهر تفاصيلها هنا فوراً."
                    : "When users like or dislike AI responses and provide feedback, incoming email notices and model training logs will appear here automatically."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackLogs.map((item: any) => {
                  const isLike = item.feedback_type === 'like';
                  const tagsArr = Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : []);

                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] shadow-xs transition-theme space-y-3.5 ${
                        isLike ? 'border-[var(--fg-success)]/25 hover:border-[var(--fg-success)]/40' : 'border-[var(--fg-danger)]/25 hover:border-[var(--fg-danger)]/40'
                      }`}
                    >
                      {/* Item Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 border ${
                              isLike
                                ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/20'
                                : 'bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] border-[var(--fg-danger)]/20'
                            }`}
                          >
                            {isLike ? <ThumbsUp size={17} /> : <ThumbsDown size={17} />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text-primary)]">
                                {item.user_name || "مستخدم"}
                              </span>
                              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                ({item.user_email || "بدون بريد"})
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {new Date(item.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isLike ? (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/25 text-[var(--fg-success)] dark:text-[var(--fg-success)] text-xs font-bold font-mono">
                              <Star size={13} className="fill-amber-400 text-[var(--fg-warning)]" />
                              <span>{item.rating || 5} / 5</span>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-[var(--status-danger-subtle)] border border-[var(--fg-danger)]/25 text-[var(--fg-danger)] dark:text-[var(--fg-danger)] text-xs font-bold">
                              {item.reason || (dir === 'rtl' ? 'بلاغ عدم إعجاب' : 'Dislike Report')}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={async () => {
                              const isConfirmed = await confirm({
                                title: dir === "rtl" ? "حذف سجل التقييم" : "Delete Feedback Log",
                                description: dir === "rtl" ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure you want to delete this log?",
                                variant: "danger"
                              });
                              if (!isConfirmed) return;
                              try {
                                await fetch(`/api/mail-services-v3/feedback-logs/${item.id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                showToast(dir === 'rtl' ? 'تم حذف السجل' : 'Log deleted', 'success');
                                fetchFeedbackLogs();
                              } catch (e) {
                                showToast('Error', 'error');
                              }
                            }}
                            className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--fg-danger)] hover:bg-[var(--status-danger-subtle)] transition-colors cursor-pointer"
                            title={dir === 'rtl' ? 'حذف السجل' : 'Delete Log'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content / Comment */}
                      {item.comment && (
                        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] leading-relaxed">
                          <span className="font-bold text-[var(--text-secondary)] block mb-1">
                            {isLike ? (dir === 'rtl' ? '💬 ملاحظة وإشادة المستخدم:' : '💬 User praise / comment:') : (dir === 'rtl' ? '🎯 توجيه التصحيح والتعليم:' : '🎯 Correction & Guidance:')}
                          </span>
                          "{item.comment}"
                        </div>
                      )}

                      {/* Tags */}
                      {tagsArr.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tagsArr.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-shape-sm text-[11px] font-medium bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--fg-success)]/20"
                            >
                              ✓ {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Snippets for Prompt & Response if available */}
                      {(item.user_prompt || item.assistant_response) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {item.user_prompt && (
                            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px]">
                              <span className="font-bold text-[var(--text-muted)] block mb-0.5">
                                {dir === 'rtl' ? 'سؤال المستخدم:' : 'User Query:'}
                              </span>
                              <p className="text-[var(--text-secondary)] line-clamp-2">
                                {item.user_prompt}
                              </p>
                            </div>
                          )}
                          {item.assistant_response && (
                            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px]">
                              <span className="font-bold text-[var(--text-muted)] block mb-0.5">
                                {dir === 'rtl' ? 'رد المساعد الذكي:' : 'Assistant Response:'}
                              </span>
                              <p className="text-[var(--text-secondary)] line-clamp-2">
                                {item.assistant_response}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[var(--text-muted)]">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[var(--fg-success)] dark:text-[var(--fg-success)] font-semibold">
                            <Brain size={12} />
                            {isLike ? (dir === 'rtl' ? 'تم تثبيت القدرات في الذاكرة' : 'Capabilities Reinforced') : (dir === 'rtl' ? 'تم تزويد المساعد بالتصحيح' : 'Model Learned Correction')}
                          </span>

                          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <Mail size={12} className="text-accent" />
                            {dir === 'rtl' ? 'تم إرسال بريد للإدارة:' : 'Admin Email Dispatched:'}{' '}
                            <span className="font-mono text-[var(--text-primary)]">{item.email_recipient || settings.sender_email || 'admin@perplexta.com'}</span>
                          </span>
                        </div>

                        {item.chat_title && (
                          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-xs">
                            {dir === 'rtl' ? 'المحادثة: ' : 'Chat: '}{item.chat_title}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
