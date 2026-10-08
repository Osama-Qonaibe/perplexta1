import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { getAuthHeaders, getTimeAgo } from "../../utils/adminUtils";
import {
  BellRing,
  Activity,
  History as HistoryIcon,
  Megaphone,
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
  ImageIcon,
  Video,
  Mic,
  Volume2,
  GraduationCap,
  Code2,
  Music,
  Trash2,
  X,
  UserPlus,
  FastForward,
  Bell,
  Mail,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { MassBroadcastViewProps } from "./adminTypes";
import { toast as globalToast, useConfirm } from '@/design-system';


export const MassBroadcastView = ({
  theme,
  t,
  dir,
  language,
}: {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
  language: string;
}) => {
  const { token } = useAppContext();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    broadcast_type: "both",
    target_group: "all",
    title_en: "",
    title_ar: "",
    content_en: "",
    content_ar: "",
  });

  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);

  const fetchTargetCount = async (group: string) => {
    setIsCounting(true);
    try {
      const res = await fetch(`/api/admin/users/count?group=${group}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTargetCount(data.count);
      }
    } catch (e) {
      console.error("Error counting users:", e);
    } finally {
      setIsCounting(false);
    }
  };

  useEffect(() => {
    if (showForm && token) {
      fetchTargetCount(form.target_group);
    }
  }, [form.target_group, showForm, token]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (type === "success") {
      globalToast.success(message, dir === "rtl" ? "تم بنجاح" : "Success");
    } else {
      globalToast.error(message, dir === "rtl" ? "حدث خطأ" : "Error");
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch("/api/admin/broadcasts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBroadcasts(await res.json());
    } catch (e) {
      console.error("Error fetching broadcasts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBroadcasts();
    const handleAdd = () => setShowForm((prev) => !prev);
    window.addEventListener("admin-add-broadcast", handleAdd);
    return () => window.removeEventListener("admin-add-broadcast", handleAdd);
  }, [token]);

  const handleSend = async () => {
    if (
      !form.title_en ||
      !form.title_ar ||
      !form.content_en ||
      !form.content_ar
    ) {
      showToast(t("allFieldsRequired") || "All fields are required", "error");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/broadcasts/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        const successMsg =
          t("broadcastSuccess") || "Broadcast sent to {count} users";
        showToast(successMsg.replace("{count}", data.sent_count), "success");
        setForm({
          broadcast_type: "both",
          target_group: "all",
          title_en: "",
          title_ar: "",
          content_en: "",
          content_ar: "",
        });
        setShowForm(false);
        fetchBroadcasts();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to send broadcast", "error");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      showToast("Connection Error", "error");
    } finally {
      setIsSending(false);
    }
  };

  const totalBroadcasts = broadcasts.length;
  const totalSent = broadcasts.reduce(
    (acc, curr) => acc + (curr.sent_count || 0),
    0,
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          className="p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm group transition-theme hover:border-[var(--border-accent)]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--fg-accent)] group-hover: transition-theme">
              <Send size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                {t("totalBroadcasts") ||
                  (language === "ar" ? "إجمالي الحملات" : "Total Campaigns")}
              </p>
              <p className="text-2xl font-black mt-1 text-[var(--text-primary)]">{totalBroadcasts}</p>
            </div>
          </div>
        </div>
        <div
          className="p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm group transition-theme hover:border-[var(--border-accent)]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--fg-accent)] group-hover: transition-theme">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                {t("totalReached") ||
                  (language === "ar" ? "إجمالي الوصول" : "Total Reached")}
              </p>
              <p className="text-2xl font-black mt-1 text-[var(--text-primary)]">
                {totalSent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div
          className="p-5 rounded-shape-md border border-[var(--border-accent)] bg-[var(--surface-subtle)] shadow-sm group transition-theme"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-shape-sm bg-[var(--surface-card)] text-[var(--fg-accent)]">
              <Megaphone size={24} className="animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--fg-accent)] uppercase tracking-widest">
                {t("activeStatus") ||
                  (language === "ar" ? "حالة المحرك" : "Engine Status")}
              </p>
              <p className="text-2xl font-black mt-1 text-[var(--fg-accent)]">READY</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 md:p-8 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    {t("broadcastType")}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        id: "email",
                        label: t("broadcastEmail"),
                        icon: <Mail size={18} />,
                      },
                      {
                        id: "notification",
                        label: t("broadcastNotification"),
                        icon: <BellRing size={18} />,
                      },
                      {
                        id: "both",
                        label: t("broadcastBoth"),
                        icon: <Send size={18} />,
                      },
                    ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        setForm({ ...form, broadcast_type: type.id })
                      }
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-shape-sm border transition-theme ${
                        form.broadcast_type === type.id
                          ? "bg-[var(--bg-accent-emphasis)] border-[var(--border-accent)] text-[var(--fg-accent)] font-bold"
                          : "border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)]"
                      }`}
                    >
                        {type.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    {t("targetGroup")}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        id: "all",
                        label: t("allUsers"),
                        icon: <Users size={18} />,
                      },
                      {
                        id: "pro_only",
                        label: t("proOnly"),
                        icon: <Zap size={18} />,
                      },
                      {
                        id: "free_only",
                        label: t("freeOnly"),
                        icon: <Activity size={18} />,
                      },
                    ].map((group) => (
                      <button
                        key={group.id}
                        onClick={() =>
                          setForm({ ...form, target_group: group.id })
                        }
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-shape-sm border transition-theme ${
                          form.target_group === group.id
                            ? "bg-[var(--bg-accent-emphasis)] border-[var(--border-accent)] text-[var(--fg-accent)] font-bold"
                            : "border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)]"
                        }`}
                      >
                        {group.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                          {group.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {targetCount !== null && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-[10px] font-bold text-[var(--fg-accent)] uppercase flex items-center gap-2"
                    >
                      <Users size={12} />
                      {isCounting ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : language === "ar" ? (
                        `سيتم استهداف ${targetCount} مستخدم حالياً`
                      ) : (
                        `Targeting ${targetCount} users currently`
                      )}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        {t("titleEn")}
                      </label>
                      <input
                        type="text"
                        value={form.title_en || ""}
                        onChange={(e) =>
                          setForm({ ...form, title_en: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        {t("titleAr")}
                      </label>
                      <input
                        type="text"
                        value={form.title_ar || ""}
                        onChange={(e) =>
                          setForm({ ...form, title_ar: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    {t("contentEn")} (Markdown/HTML Support)
                  </label>
                  <textarea
                    rows={6}
                    value={form.content_en || ""}
                    onChange={(e) =>
                      setForm({ ...form, content_en: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme text-sm font-sans"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    {t("contentAr")} (Markdown/HTML Support)
                  </label>
                  <textarea
                    rows={6}
                    value={form.content_ar || ""}
                    onChange={(e) =>
                      setForm({ ...form, content_ar: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-theme text-sm font-sans"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border-default)] flex justify-end">
              <button
                onClick={handleSend}
                disabled={isSending}
                className="w-full md:w-auto bg-[var(--fg-accent)] hover:opacity-90 text-[var(--surface-page)] px-10 py-4 rounded-shape-sm font-bold transition-theme flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw size={22} className="animate-spin" />
                ) : (
                  <Send size={22} />
                )}
                {t("sendNow")}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
              <HistoryIcon className="text-[var(--fg-accent)]" size={24} />
              {t("broadcastHistory")}
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw
                  size={32}
                  className="text-[var(--fg-accent)] animate-spin"
                />
                <p className="text-[var(--text-muted)]">{t("loadingRecords")}</p>
              </div>
            ) : broadcasts.length === 0 ? (
              <div
                className="p-12 rounded-shape-md border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col items-center justify-center text-center"
              >
                <Send
                  className="text-[var(--text-muted)] mb-4"
                  size={48}
                />
                <p className="text-[var(--text-muted)] font-medium">{t("noBroadcasts")}</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-[var(--fg-accent)] font-bold hover:underline"
                >
                  {t("launchFirstBroadcast")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-6 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] transition-theme hover:border-[var(--border-accent)] shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-shape-sm bg-[var(--surface-subtle)]"
                        >
                          {b.broadcast_type === "email" ? (
                            <Mail size={18} className="text-[var(--fg-accent)]" />
                          ) : b.broadcast_type === "notification" ? (
                            <BellRing size={18} className="text-[var(--fg-accent)]" />
                          ) : (
                            <Send size={18} className="text-[var(--fg-accent)]" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--fg-accent)] uppercase tracking-widest">
                            {b.broadcast_type}
                          </p>
                          <p
                            className="text-sm font-medium text-[var(--text-muted)]"
                          >
                            {new Date(b.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                      >
                        {b.target_group}
                      </div>
                    </div>

                    <h4 className="font-bold text-lg mb-2 line-clamp-1 text-[var(--text-primary)]">
                      {dir === "rtl" ? b.title_ar : b.title_en}
                    </h4>
                    <p
                      className="text-sm line-clamp-2 mb-4 text-[var(--text-secondary)]"
                    >
                      {dir === "rtl" ? b.content_ar : b.content_en}
                    </p>

                    <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                        <Users size={14} />
                        <span>
                          {b.sent_count} {t("sentCount")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--fg-accent)] text-xs font-bold">
                        <CheckCircle size={14} />
                        <span className="uppercase tracking-widest">Sent</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
