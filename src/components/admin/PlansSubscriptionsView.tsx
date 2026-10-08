import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { ALL_TOOLS } from "../../constants";
import { getAuthHeaders, getTimeAgo } from "../../utils/adminUtils";
import {
  Terminal,
  Settings2,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  X,
  CheckCircle,
  Save,
  Star,
  Award,
  Sparkles,
  Zap,
  Info,
  Sliders,
  DollarSign,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Key,
  Database,
  Users,
  Settings,
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
  Image as ImageIcon,
  Video,
  Mic,
  Volume2,
  GraduationCap,
  Code2,
  Music,
} from "lucide-react";
import { PlansSubscriptionsViewProps } from "./adminTypes";
import { toast as globalToast, useConfirm } from '@/design-system';

export const PlansSubscriptionsView = ({
  theme,
  t,
  dir,
}: {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
}) => {
  const confirm = useConfirm();
  const { plans, setPlans, token, language, setIsOperationPending } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [planFilter, setPlanFilter] = useState<string>("all");

  useEffect(() => {
    setIsOperationPending(isSaving);
  }, [isSaving, setIsOperationPending]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (type === "success") {
      globalToast.success(message, dir === "rtl" ? "تم بنجاح" : "Success");
    } else {
      globalToast.error(message, dir === "rtl" ? "حدث خطأ" : "Error");
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const formattedPlans = data.map((p: any) => ({
          id: p.id.toString(),
          nameEn: p.name_en,
          nameAr: p.name_ar,
          descEn: p.desc_en,
          descAr: p.desc_ar,
          badge: p.badge,
          discount: p.discount,
          isActive: p.is_active,
          isVisible: p.is_visible,
          hideTools: Boolean(p.hide_tools === true || p.hide_tools === 'true'),
          monthlyPrice: parseFloat(p.monthly_price || 0),
          annualPrice: parseFloat(p.annual_price || 0),
          isMonthlyEnabled: p.is_monthly_enabled !== false,
          isAnnualEnabled: p.is_annual_enabled !== false,
          isDailyEnabled: Boolean(p.is_daily_enabled),
          dailyPrice: parseFloat(p.daily_price || 0),
          dailyDays: parseInt(p.daily_days || 7, 10),
          dailyCredits: parseInt(p.daily_credits || 0, 10),
          monthlyCredits: parseInt(p.monthly_credits || 0, 10),
          annualCredits: parseInt(p.annual_credits || 0, 10),
          color: p.color,
          planType: p.plan_type || "user",
          features:
            typeof p.features === "string"
              ? JSON.parse(p.features)
              : Array.isArray(p.features)
                ? p.features
                : [],
          limits:
            typeof p.limits === "string"
              ? JSON.parse(p.limits)
              : typeof p.limits === "object" && p.limits !== null
                ? p.limits
                : {},
        }));
        setPlans(formattedPlans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  useEffect(() => {
    if (token) fetchPlans();
    const handleAdd = () => handleOpenModal();
    window.addEventListener("admin-add-plan", handleAdd);
    return () => window.removeEventListener("admin-add-plan", handleAdd);
  }, [token]);

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      // Initialize limits with defaults for all tools
      const limits: Record<string, any> = {};
      ALL_TOOLS.forEach((toolId) => {
        limits[toolId] = { daily: 0, monthly: 0, isHidden: false };
      });

      const savedLimits = { ...plan.limits };

      // Merge saved limits with strict isHidden boolean normalization
      Object.keys(savedLimits).forEach((key) => {
        let val = savedLimits[key];
        if (typeof val === "number") {
          val = { daily: val, monthly: val * 30, isHidden: false };
        } else if (typeof val === "object" && val !== null) {
          val = {
            ...val,
            daily: val.daily !== undefined ? val.daily : 0,
            monthly: val.monthly !== undefined ? val.monthly : 0,
            isHidden: Boolean(val.isHidden === true || val.isHidden === 'true'),
          };
        }
        limits[key] = val;
      });

      // Initialize App Studio Governance limits with resilient defaults
      if (typeof limits.app_studio !== "object" || limits.app_studio === null) {
        limits.app_studio = { 
          daily: 20, 
          monthly: 600, 
          isHidden: false,
          max_projects: 5,
          max_storage_mb: 50,
          max_snapshots: 5
        };
      } else {
        limits.app_studio = {
          ...limits.app_studio,
          max_projects: limits.app_studio.max_projects !== undefined ? limits.app_studio.max_projects : (limits.app_studio.maxProjects !== undefined ? limits.app_studio.maxProjects : 5),
          max_storage_mb: limits.app_studio.max_storage_mb !== undefined ? limits.app_studio.max_storage_mb : (limits.app_studio.maxStorageMb !== undefined ? limits.app_studio.maxStorageMb : 50),
          max_snapshots: limits.app_studio.max_snapshots !== undefined ? limits.app_studio.max_snapshots : (limits.app_studio.maxSnapshots !== undefined ? limits.app_studio.maxSnapshots : 5),
        };
      }

      setEditingPlan({
        ...plan,
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        isVisible: plan.isVisible !== undefined ? plan.isVisible : true,
        hideTools: Boolean(plan.hideTools === true || plan.hideTools === 'true'),
        isMonthlyEnabled: plan.isMonthlyEnabled !== undefined ? plan.isMonthlyEnabled : true,
        isAnnualEnabled: plan.isAnnualEnabled !== undefined ? plan.isAnnualEnabled : true,
        isDailyEnabled: plan.isDailyEnabled !== undefined ? plan.isDailyEnabled : false,
        dailyPrice: plan.dailyPrice !== undefined ? plan.dailyPrice : 0,
        dailyDays: plan.dailyDays !== undefined ? plan.dailyDays : 7,
        dailyCredits: plan.dailyCredits !== undefined ? plan.dailyCredits : Math.round(Number(plan.dailyPrice || 0) * 1000),
        monthlyCredits: plan.monthlyCredits !== undefined ? plan.monthlyCredits : Math.round(Number(plan.monthlyPrice || 0) * 1000),
        annualCredits: plan.annualCredits !== undefined ? plan.annualCredits : (Number(plan.annualPrice || 0) > 0 ? Math.round(Number(plan.annualPrice || 0) * 1000) : Math.round(Number(plan.monthlyPrice || 0) * 12 * 1000)),
        planType: plan.planType || "user",
        limits,
      });
    } else {
      const limits: Record<string, any> = {};
      ALL_TOOLS.forEach((toolId) => {
        limits[toolId] = { daily: 10, monthly: 300, isHidden: false };
      });
      limits.app_studio = { 
        daily: 20, 
        monthly: 600, 
        isHidden: false,
        max_projects: 5,
        max_storage_mb: 50,
        max_snapshots: 5
      };

      setEditingPlan({
        id: "new",
        nameEn: "",
        nameAr: "",
        descEn: "",
        descAr: "",
        badge: "none",
        discount: 0,
        isActive: true,
        isVisible: true,
        hideTools: false,
        monthlyPrice: 0,
        annualPrice: 0,
        isMonthlyEnabled: true,
        isAnnualEnabled: true,
        isDailyEnabled: false,
        dailyPrice: 0,
        dailyDays: 7,
        dailyCredits: 0,
        monthlyCredits: 0,
        annualCredits: 0,
        color: "#334155",
        features: [],
        planType: "user",
        limits,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleToggleHideTools = async (plan: any) => {
    try {
      const newHideTools = !plan.hideTools;
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name_en: plan.nameEn,
          name_ar: plan.nameAr,
          desc_en: plan.descEn,
          desc_ar: plan.descAr,
          badge: plan.badge,
          discount: Number(plan.discount || 0),
          is_active: plan.isActive,
          is_visible: plan.isVisible,
          hide_tools: newHideTools,
          monthly_price: Number(plan.monthlyPrice || 0),
          annual_price: Number(plan.annualPrice || 0),
          is_monthly_enabled: plan.isMonthlyEnabled,
          is_annual_enabled: plan.isAnnualEnabled,
          is_daily_enabled: plan.isDailyEnabled,
          daily_price: Number(plan.dailyPrice || 0),
          daily_days: parseInt(plan.dailyDays || 7, 10),
          daily_credits: Number(plan.dailyCredits || 0),
          monthly_credits: Number(plan.monthlyCredits || 0),
          annual_credits: Number(plan.annualCredits || 0),
          color: plan.color,
          features: plan.features,
          limits: plan.limits,
          plan_type: plan.planType || "user",
        }),
      });

      if (res.ok) {
        await fetchPlans();
        showToast(
          dir === 'rtl'
            ? (newHideTools ? 'تم إخفاء جميع الأدوات في الخطة بنجاح' : 'تم إظهار الأدوات في الخطة بنجاح')
            : (newHideTools ? 'Tools hidden in plan successfully' : 'Tools shown in plan successfully'),
          'success'
        );
      } else {
        showToast(dir === 'rtl' ? 'فشل تحديث حالة إخفاء الأدوات' : 'Failed to update tools visibility', 'error');
      }
    } catch (e) {
      console.error('Error toggling hide tools:', e);
      showToast(dir === 'rtl' ? 'حدث خطأ أثناء التحديث' : 'Error updating tools visibility', 'error');
    }
  };

  const handleSavePlan = async () => {
    // Validation
    if (
      !editingPlan.nameEn ||
      !editingPlan.nameAr ||
      !editingPlan.descEn ||
      !editingPlan.descAr
    ) {
      showToast(t("toastAllFieldsRequired"), "error");
      return;
    }

    // Ensure at least one billing cycle is enabled
    const isMonthlyOn = editingPlan.isMonthlyEnabled !== false;
    const isAnnualOn = editingPlan.isAnnualEnabled !== false;
    const isDailyOn = Boolean(editingPlan.isDailyEnabled);

    if (!isMonthlyOn && !isAnnualOn && !isDailyOn) {
      showToast(
        dir === "rtl" 
          ? "يجب تفعيل خيار فوترة واحد على الأقل (أيام أو شهري أو سنوي)" 
          : "At least one billing cycle must be enabled (Days, Monthly, or Annual)", 
        "error"
      );
      return;
    }

    if (isMonthlyOn && (editingPlan.monthlyPrice === undefined || editingPlan.monthlyPrice < 0)) {
      showToast(dir === "rtl" ? "يرجى تحديد سعر شهري صالح" : "Please specify a valid monthly price", "error");
      return;
    }

    if (isAnnualOn && (editingPlan.annualPrice === undefined || editingPlan.annualPrice < 0)) {
      showToast(dir === "rtl" ? "يرجى تحديد سعر سنوي صالح" : "Please specify a valid annual price", "error");
      return;
    }

    if (isDailyOn && (!editingPlan.dailyDays || editingPlan.dailyDays <= 0)) {
      showToast(dir === "rtl" ? "يرجى تحديد عدد أيام صالح لخطة الأيام" : "Please specify valid days duration", "error");
      return;
    }

    if (editingPlan.features.length === 0) {
      showToast(t("toastFeatureRequired"), "error");
      return;
    }

    // Ensure all features have text
    const incompleteFeature = editingPlan.features.find(
      (f: any) => !f.textEn || !f.textAr,
    );
    if (incompleteFeature) {
      showToast(t("toastFeatureTranslationRequired"), "error");
      return;
    }

    setIsSaving(true);
    try {
      const isNew = editingPlan.id === "new";
      const url = isNew
         ? "/api/admin/plans"
         : `/api/admin/plans/${editingPlan.id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        name_en: editingPlan.nameEn,
        name_ar: editingPlan.nameAr,
        desc_en: editingPlan.descEn,
        desc_ar: editingPlan.descAr,
        badge: editingPlan.badge,
        discount: Number(editingPlan.discount || 0),
        is_active: editingPlan.isActive,
        is_visible: editingPlan.isVisible,
        hide_tools: Boolean(editingPlan.hideTools === true || editingPlan.hideTools === 'true'),
        monthly_price: Number(editingPlan.monthlyPrice || 0),
        annual_price: Number(editingPlan.annualPrice || 0),
        is_monthly_enabled: isMonthlyOn,
        is_annual_enabled: isAnnualOn,
        is_daily_enabled: isDailyOn,
        daily_price: Number(editingPlan.dailyPrice || 0),
        daily_days: parseInt(editingPlan.dailyDays || 7, 10),
        daily_credits: Number(editingPlan.dailyCredits || 0),
        monthly_credits: Number(editingPlan.monthlyCredits || 0),
        annual_credits: Number(editingPlan.annualCredits || 0),
        color: editingPlan.color,
        features: editingPlan.features,
        limits: editingPlan.limits,
        plan_type: editingPlan.planType || "user",
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchPlans();
        showToast(t("toastPlanSaveSuccess"), "success");
        handleCloseModal();
      } else {
        showToast(
          language === "ar" ? "فشل حفظ الخطة" : "Failed to save plan",
          "error",
        );
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      showToast(
        language === "ar" ? "فشل حفظ الخطة" : "Failed to save plan",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    const isConfirmed = await confirm({ title: t("deletePlanConfirm"), description: "", variant: "danger" as const });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        showToast(t("toastPlanDeleteSuccess"), "success");
        fetchPlans();
      } else {
        showToast(t("toastPlanDeleteError"), "error");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      showToast(
        language === "ar" ? "خطأ في الاتصال" : "Connection Error",
        "error",
      );
    }
  };

  const addFeature = () => {
    setEditingPlan({
      ...editingPlan,
      features: [
        ...editingPlan.features,
        { id: Date.now().toString(), textEn: "", textAr: "" },
      ],
    });
  };

  const removeFeature = (id: string) => {
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((f: any) => f.id !== id),
    });
  };

  const updateFeature = (
    id: string,
    field: "textEn" | "textAr",
    value: string,
  ) => {
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.map((f: any) =>
        f.id === id ? { ...f, [field]: value } : f,
      ),
    });
  };

  const updateLimit = (
    field: string,
    subfield: "daily" | "monthly" | "isHidden",
    value: string | boolean,
  ) => {
    const newLimits = { ...editingPlan.limits };
    if (typeof newLimits[field] !== "object" || newLimits[field] === null) {
      newLimits[field] = { daily: 0, monthly: 0 };
    }
    
    let val: any = value;
    if (subfield !== "isHidden") {
      val = value === "unlimited" ? "unlimited" : parseInt(value as string) || 0;
    }
    
    newLimits[field] = { ...newLimits[field], [subfield]: val };
    setEditingPlan({ ...editingPlan, limits: newLimits });
  };

  const updateStudioLimit = (
    field: "max_projects" | "max_storage_mb" | "max_snapshots",
    value: any,
  ) => {
    const newLimits = { ...editingPlan.limits };
    if (typeof newLimits.app_studio !== "object" || newLimits.app_studio === null) {
      newLimits.app_studio = { daily: 20, monthly: 600, isHidden: false };
    }
    const val = value === "unlimited" || value === -1 ? "unlimited" : Math.max(0, parseInt(value as string) || 0);
    newLimits.app_studio = { ...newLimits.app_studio, [field]: val };
    setEditingPlan({ ...editingPlan, limits: newLimits });
  };

  return (
    <div className="w-full max-w-full space-y-6 relative px-1 md:px-2">

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-4">
        <button
          onClick={() => setPlanFilter("all")}
          className={`px-4 py-2 rounded-shape-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            planFilter === "all"
              ? "bg-accent text-[var(--fg-on-emphasis)] shadow-none"
              : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] border border-[var(--border-default)]"
          }`}
        >
          <CreditCard size={14} />
          {dir === "rtl" ? "جميع الخطط" : "All Plans"} ({plans.length})
        </button>
        <button
          onClick={() => setPlanFilter("user")}
          className={`px-4 py-2 rounded-shape-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            planFilter === "user"
              ? "bg-accent text-[var(--fg-on-emphasis)] shadow-none"
              : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] border border-[var(--border-default)]"
          }`}
        >
          <Users size={14} />
          {dir === "rtl" ? "خطط المستخدمين العاديين" : "User Plans"} ({plans.filter(p => (p.planType || "user") === "user").length})
        </button>
        <button
          onClick={() => setPlanFilter("developer")}
          className={`px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            planFilter === "developer"
              ? "bg-[var(--accent)] text-white shadow-none"
              : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] border border-[var(--border-default)]"
          }`}
        >
          <Terminal size={14} />
          {dir === "rtl" ? "خطط المطورين والوكلاء" : "Developer Plans"} ({plans.filter(p => (p.planType || "user") === "developer").length})
        </button>
      </div>

      {/* Grouped Plans View */}
      <div className="space-y-10">
        {/* User Plans Section */}
        {(planFilter === "all" || planFilter === "user") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {dir === "rtl" ? "خطط المستخدمين العاديين" : "Standard User Plans"}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono font-bold">
                      {plans.filter(p => (p.planType || "user") === "user").length}
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {dir === "rtl" ? "خطط الاشتراكات المخصصة للمستخدمين والأفراد للاستخدام اليومي" : "Subscription plans tailored for end users and standard usage"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans
                .filter(p => (p.planType || "user") === "user")
                .map((plan, planIdx) => (
                  <div
                    key={`plan-user-${plan.id || planIdx}-${planIdx}`}
                    className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-accent)]/40 shadow-sm transition-all relative overflow-hidden flex flex-col"
                  >
                    {/* Top Color Accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: plan.color || "#334155" }}
                    ></div>

                    {/* Badge */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-shape-sm flex items-center gap-1.5 uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                        <Users size={12} />
                        {dir === "rtl" ? "مستخدم عام" : "Standard User"}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${plan.isActive ? "bg-accent/10 text-accent" : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"}`}>
                        {plan.isActive ? (dir === "rtl" ? "نشط" : "Active") : (dir === "rtl" ? "متوقف" : "Inactive")}
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-4 mt-1">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: plan.color || "#334155" }}
                          ></span>
                          {dir === "rtl" ? plan.nameAr : plan.nameEn}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {dir === "rtl" ? plan.descAr : plan.descEn}
                        </p>
                        {/* Enabled Billing Cycles Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {plan.isDailyEnabled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border border-[var(--fg-warning)]/20">
                              {dir === "rtl" ? `${plan.dailyDays || 7} أيام ($${plan.dailyPrice || 0})` : `${plan.dailyDays || 7} Days ($${plan.dailyPrice || 0})`}
                            </span>
                          )}
                          {plan.isMonthlyEnabled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20">
                              {dir === "rtl" ? `شهري ($${plan.monthlyPrice})` : `Monthly ($${plan.monthlyPrice})`}
                            </span>
                          )}
                          {plan.isAnnualEnabled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--fg-success)]/20">
                              {dir === "rtl" ? `سنوي ($${plan.annualPrice})` : `Annual ($${plan.annualPrice})`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {plan.isMonthlyEnabled ? (
                          <>
                            <p className="text-2xl font-bold text-accent">
                              ${plan.monthlyPrice}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              / {t("monthly")}
                            </p>
                            <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[var(--bg-accent-subtle)] border border-[var(--border-accent)]/20 text-[10px] font-black text-[var(--fg-accent)] w-fit ml-auto">
                              <Coins size={11} />
                              <span>{Number(plan.monthlyCredits || 0).toLocaleString()} {dir === "rtl" ? "كريديت/شهر" : "cr/mo"}</span>
                            </div>
                          </>
                        ) : plan.isDailyEnabled ? (
                          <>
                            <p className="text-2xl font-bold text-[var(--fg-warning)]">
                              ${plan.dailyPrice || 0}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              / {plan.dailyDays || 7} {dir === "rtl" ? "يوم" : "Days"}
                            </p>
                            <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[var(--status-warning-subtle)] border border-[var(--fg-warning)]/20 text-[10px] font-black text-[var(--fg-warning)] w-fit ml-auto">
                              <Coins size={11} />
                              <span>{Number(plan.dailyCredits || 0).toLocaleString()} {dir === "rtl" ? "كريديت" : "cr"}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-[var(--fg-success)]">
                              ${plan.annualPrice}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              / {t("annual")}
                            </p>
                            <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 text-[10px] font-black text-[var(--fg-success)] w-fit ml-auto">
                              <Coins size={11} />
                              <span>{Number(plan.annualCredits || 0).toLocaleString()} {dir === "rtl" ? "كريديت/سنة" : "cr/yr"}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                      {plan.features.slice(0, 4).map((feature: any, fIdx: number) => (
                        <div
                          key={`feat-u-${plan.id}-${fIdx}`}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <CheckCircle2
                            size={16}
                            className="text-accent shrink-0 mt-0.5"
                          />
                          <span>{dir === "rtl" ? feature.textAr : feature.textEn}</span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <p className="text-xs text-[var(--text-muted)] italic">
                          +{plan.features.length - 4} more features...
                        </p>
                      )}
                    </div>

                    {plan.hideTools ? (
                      <div className="mb-6 pt-3 border-t border-[var(--border-default)]">
                        <div className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--status-warning-subtle)]/70 border border-[var(--fg-warning)]/20 text-[var(--fg-warning)]">
                          <div className="flex items-center gap-1.5">
                            <EyeOff size={13} className="shrink-0" />
                            <span className="text-[11px] font-bold">
                              {dir === "rtl" ? "الأدوات مخفية بالكامل في هذه الخطة" : "Tools are hidden for this plan"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleHideTools(plan)}
                            className="text-[10px] font-black underline hover:opacity-80 cursor-pointer"
                          >
                            {dir === "rtl" ? "إظهار الأدوات" : "Show Tools"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 pt-4 border-t border-[var(--border-default)]">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                              {dir === "rtl" ? "حصص الأدوات والملفات النشطة" : "Active Tool & File Quotas"}
                            </span>
                            {(() => {
                              const hiddenCount = Object.values(plan.limits || {}).filter(
                                (l: any) => typeof l === 'object' && (l?.isHidden === true || l?.isHidden === 'true')
                              ).length;
                              if (hiddenCount > 0) {
                                return (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] font-bold">
                                    {dir === 'rtl' ? `${hiddenCount} مخفية` : `${hiddenCount} hidden`}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleHideTools(plan)}
                            className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--fg-warning)] flex items-center gap-1 transition-colors cursor-pointer"
                            title={dir === 'rtl' ? 'إخفاء جميع الأدوات لهذه الخطة' : 'Hide all tools for this plan'}
                          >
                            <EyeOff size={11} />
                            <span>{dir === 'rtl' ? 'إخفاء شامل' : 'Hide All'}</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                          {Object.entries(plan.limits || {}).map(([key, limitVal]: [string, any], lIdx: number) => {
                            if (limitVal === undefined || limitVal === null) return null;
                            if (typeof limitVal === 'object' && (limitVal?.isHidden === true || limitVal?.isHidden === 'true')) return null;
                            const daily = typeof limitVal === 'object' && limitVal !== null ? limitVal.daily : limitVal;
                            const monthly = typeof limitVal === 'object' && limitVal !== null ? limitVal.monthly : null;
                            const formatLimit = (v: any) => v === "unlimited" ? "∞" : (v || 0);

                            return (
                              <div
                                key={`limit-u-${plan.id}-${key}-${lIdx}`}
                                className="text-[9px] font-bold px-2 py-0.5 rounded border border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center gap-1.5 text-[var(--text-secondary)]"
                              >
                                <span className="text-accent font-extrabold">{t(key)}</span>
                                <span className="font-mono text-[8px]">
                                  {daily !== undefined && daily !== null && (
                                    <>D: <strong className="text-[var(--text-primary)]">{formatLimit(daily)}</strong></>
                                  )}
                                  {monthly !== null && monthly !== 0 && monthly !== undefined && (
                                    <>; M: <strong className="text-accent">{formatLimit(monthly)}</strong></>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleOpenModal(plan)}
                        className="flex-1 py-2.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] transition-theme font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Settings2 size={16} /> {t("edit")}
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="px-4 py-2.5 rounded-shape-sm border border-[var(--fg-danger)]/20 bg-[var(--status-danger-subtle)] hover:bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] transition-theme flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Developer Plans Section */}
        {(planFilter === "all" || planFilter === "developer") && (
          <div className="space-y-4 pt-4 border-t border-[var(--border-default)]">
            <div className="flex items-center justify-between border-b border-[var(--border-accent)]/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 flex items-center justify-center text-[var(--fg-accent)]">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {dir === "rtl" ? "خطط المطورين والوكلاء الذكية" : "Developer & Agent API Plans"}
                    <span className="text-xs px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-mono font-bold">
                      {plans.filter(p => (p.planType || "user") === "developer").length}
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {dir === "rtl" ? "خطط متخصصة للمطورين وبناء الوكلاء والربط البرمجي عالي السعة" : "Dedicated plans for developer API access, AI agents, and custom integrations"}
                  </p>
                </div>
              </div>
            </div>

            {plans.filter(p => (p.planType || "user") === "developer").length === 0 ? (
              <div className="p-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-accent)]/30 bg-[var(--bg-accent-muted)]/50 text-center">
                <Terminal className="mx-auto w-8 h-8 text-[var(--fg-accent)] mb-2 opacity-60" />
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {dir === "rtl" ? "لا توجد خطط مطورين حالياً. يمكنك إضافة خطة جديدة وتعيين نوعها كـ 'مطورين'." : "No developer plans found. Click 'Add Plan' and set type to 'Developer'."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans
                  .filter(p => (p.planType || "user") === "developer")
                  .map((plan, planIdx) => (
                    <div
                      key={`plan-dev-${plan.id || planIdx}-${planIdx}`}
                      className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-accent)]/30 bg-[var(--surface-card)] hover:border-[var(--border-accent)]/60 shadow-sm transition-all relative overflow-hidden flex flex-col"
                    >
                      {/* Top Color Accent */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/60"
                      ></div>

                      {/* Badge */}
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-[var(--radius-xs)] flex items-center gap-1.5 uppercase tracking-wider bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/30">
                          <Terminal size={12} />
                          {dir === "rtl" ? "مطور / API" : "Developer & API"}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-[var(--radius-xs)] font-bold uppercase ${plan.isActive ? "bg-[var(--bg-accent-muted)] text-[var(--fg-accent)]" : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"}`}>
                          {plan.isActive ? (dir === "rtl" ? "نشط" : "Active") : (dir === "rtl" ? "متوقف" : "Inactive")}
                        </span>
                      </div>

                      <div className="flex justify-between items-start mb-4 mt-1">
                        <div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-[var(--radius-full)]"
                              style={{ backgroundColor: plan.color || "#6366f1" }}
                            ></span>
                            {dir === "rtl" ? plan.nameAr : plan.nameEn}
                          </h3>
                          <p className="text-sm text-[var(--text-muted)] mt-1">
                            {dir === "rtl" ? plan.descAr : plan.descEn}
                          </p>
                          {/* Enabled Billing Cycles Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {plan.isDailyEnabled && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border border-[var(--fg-warning)]/20">
                                {dir === "rtl" ? `${plan.dailyDays || 7} أيام ($${plan.dailyPrice || 0})` : `${plan.dailyDays || 7} Days ($${plan.dailyPrice || 0})`}
                              </span>
                            )}
                            {plan.isMonthlyEnabled && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20">
                                {dir === "rtl" ? `شهري ($${plan.monthlyPrice})` : `Monthly ($${plan.monthlyPrice})`}
                              </span>
                            )}
                            {plan.isAnnualEnabled && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--fg-success)]/20">
                                {dir === "rtl" ? `سنوي ($${plan.annualPrice})` : `Annual ($${plan.annualPrice})`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {plan.isMonthlyEnabled ? (
                            <>
                              <p className="text-2xl font-bold text-[var(--fg-accent)]">
                                ${plan.monthlyPrice}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                / {t("monthly")}
                              </p>
                              <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[var(--bg-accent-subtle)] border border-[var(--border-accent)]/20 text-[10px] font-black text-[var(--fg-accent)] w-fit ml-auto">
                                <Coins size={11} />
                                <span>{Number(plan.monthlyCredits || 0).toLocaleString()} {dir === "rtl" ? "كريديت/شهر" : "cr/mo"}</span>
                              </div>
                            </>
                          ) : plan.isDailyEnabled ? (
                            <>
                              <p className="text-2xl font-bold text-[var(--fg-warning)]">
                                ${plan.dailyPrice || 0}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                / {plan.dailyDays || 7} {dir === "rtl" ? "يوم" : "Days"}
                              </p>
                              <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[var(--status-warning-subtle)] border border-[var(--fg-warning)]/20 text-[10px] font-black text-[var(--fg-warning)] w-fit ml-auto">
                                <Coins size={11} />
                                <span>{Number(plan.dailyCredits || 0).toLocaleString()} {dir === "rtl" ? "كريديت" : "cr"}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-[var(--fg-success)]">
                                ${plan.annualPrice}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                / {t("annual")}
                              </p>
                              <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 text-[10px] font-black text-[var(--fg-success)] w-fit ml-auto">
                                <Coins size={11} />
                                <span>{Number(plan.annualCredits || 0).toLocaleString()} {dir === "rtl" ? "كريديت/سنة" : "cr/yr"}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 mb-6">
                        {plan.features.slice(0, 4).map((feature: any, fIdx: number) => (
                          <div
                            key={`feat-d-${plan.id}-${fIdx}`}
                            className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                          >
                            <CheckCircle2
                              size={16}
                              className="text-[var(--fg-accent)] shrink-0 mt-0.5"
                            />
                            <span>{dir === "rtl" ? feature.textAr : feature.textEn}</span>
                          </div>
                        ))}
                        {plan.features.length > 4 && (
                          <p className="text-xs text-[var(--text-muted)] italic">
                            +{plan.features.length - 4} more features...
                          </p>
                        )}
                      </div>

                    {plan.hideTools ? (
                      <div className="mb-6 pt-3 border-t border-[var(--border-accent)]/30">
                        <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)]/70 border border-[var(--border-accent)]/40 text-[var(--fg-accent)]">
                          <div className="flex items-center gap-1.5">
                            <EyeOff size={13} className="shrink-0" />
                            <span className="text-[11px] font-bold">
                              {dir === "rtl" ? "الأدوات مخفية بالكامل في هذه الخطة" : "Tools are hidden for this plan"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleHideTools(plan)}
                            className="text-[10px] font-black underline hover:opacity-80 cursor-pointer"
                          >
                            {dir === "rtl" ? "إظهار الأدوات" : "Show Tools"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 pt-4 border-t border-[var(--border-accent)]/30">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-[var(--fg-accent)]/80 tracking-wider">
                              {dir === "rtl" ? "حصص المطور والوكلاء الذكية" : "Developer & Agent Quotas"}
                            </span>
                            {(() => {
                              const hiddenCount = Object.values(plan.limits || {}).filter(
                                (l: any) => typeof l === 'object' && (l?.isHidden === true || l?.isHidden === 'true')
                              ).length;
                              if (hiddenCount > 0) {
                                return (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-bold border border-[var(--border-accent)]/30">
                                    {dir === 'rtl' ? `${hiddenCount} مخفية` : `${hiddenCount} hidden`}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleHideTools(plan)}
                            className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--fg-accent)] flex items-center gap-1 transition-colors cursor-pointer"
                            title={dir === 'rtl' ? 'إخفاء جميع الأدوات لهذه الخطة' : 'Hide all tools for this plan'}
                          >
                            <EyeOff size={11} />
                            <span>{dir === 'rtl' ? 'إخفاء شامل' : 'Hide All'}</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                          {Object.entries(plan.limits || {}).map(([key, limitVal]: [string, any], lIdx: number) => {
                            if (limitVal === undefined || limitVal === null) return null;
                            if (typeof limitVal === 'object' && (limitVal?.isHidden === true || limitVal?.isHidden === 'true')) return null;
                            const daily = typeof limitVal === 'object' && limitVal !== null ? limitVal.daily : limitVal;
                            const monthly = typeof limitVal === 'object' && limitVal !== null ? limitVal.monthly : null;
                            const formatLimit = (v: any) => v === "unlimited" ? "∞" : (v || 0);

                            return (
                              <div
                                key={`limit-d-${plan.id}-${key}-${lIdx}`}
                                className="text-[9px] font-bold px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-accent)]/30 bg-[var(--bg-accent-muted)]/50 flex items-center gap-1.5 text-[var(--text-secondary)]"
                              >
                                <span className="text-[var(--fg-accent)] font-extrabold">{t(key)}</span>
                                <span className="font-mono text-[8px]">
                                  {daily !== undefined && daily !== null && (
                                    <>D: <strong className="text-[var(--text-primary)]">{formatLimit(daily)}</strong></>
                                  )}
                                  {monthly !== null && monthly !== 0 && monthly !== undefined && (
                                    <>; M: <strong className="text-[var(--fg-accent)]">{formatLimit(monthly)}</strong></>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleOpenModal(plan)}
                          className="flex-1 py-2.5 rounded-[var(--radius-xs)] border border-[var(--border-accent)]/30 bg-[var(--bg-accent-muted)] hover:bg-[var(--bg-accent-muted)]/80 text-[var(--fg-accent)] transition-theme font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Settings2 size={16} /> {t("edit")}
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="px-4 py-2.5 rounded-[var(--radius-xs)] border border-[var(--fg-danger)]/20 bg-[var(--status-danger-subtle)] hover:bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] transition-theme flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen &&
        editingPlan &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div
              className="w-full max-w-4xl mt-[80px] mb-8 overflow-y-auto custom-scrollbar rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl"
            >
              {/* Modal Header */}
              <div
                className="sticky top-0 z-[1100] flex items-center justify-between p-6 border-b border-[var(--border-default)] bg-[var(--surface-card)]/95 backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {editingPlan.nameEn
                      ? dir === "rtl"
                        ? editingPlan.nameAr
                        : editingPlan.nameEn
                      : t("addNewPlan")}
                  </h2>
                  {editingPlan.id !== "new" && (
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--surface-subtle)] px-2 py-0.5 rounded-shape-sm border border-[var(--border-default)]">
                      ID: {editingPlan.id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSavePlan}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-[var(--fg-on-emphasis)] px-5 py-2 rounded-shape-sm transition-theme font-bold text-sm shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    {t("saveSettings") || "Save"}
                  </button>
                  <div className="w-px h-6 bg-[var(--border-default)]" />
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-shape-sm transition-theme text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6 order-2 lg:order-1">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] px-1">
                        {t("badge")}
                      </label>
                      <select
                        value={editingPlan.badge || ""}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            badge: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme appearance-none"
                        dir={dir}
                      >
                        <option value="none">{t("none")}</option>
                        <option value="bestSeller">{t("bestSeller")}</option>
                        <option value="popular">{t("popular")}</option>
                        <option value="newBadge">{t("newBadge")}</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] px-1">
                        {t("discountPercentage")}
                      </label>
                      <input
                        type="number"
                        value={editingPlan.discount}
                        onChange={(e) => {
                          const d = Number(e.target.value);
                          const m = Number(editingPlan.monthlyPrice);
                          const a = m * 12 * (1 - d / 100);
                          setEditingPlan({
                            ...editingPlan,
                            discount: d,
                            annualPrice: Number(a.toFixed(2)),
                          });
                        }}
                        className="w-full h-11 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme text-center"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] px-1">
                        {dir === "rtl" ? "تصنيف الباقة" : "Plan Type"}
                      </label>
                      <select
                        value={editingPlan.planType || "user"}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            planType: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme appearance-none"
                        dir={dir}
                      >
                        <option value="user">
                          {dir === "rtl" ? "مستخدم (عام)" : "User (General)"}
                        </option>
                        <option value="developer">
                          {dir === "rtl" ? "مطورين (وكلاء برمجيات)" : "Developers (API/Agents)"}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-[var(--text-muted)]">
                        {t("planColor")}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingPlan.color || "#334155"}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              color: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-xs font-mono text-[var(--text-muted)] uppercase">
                          {editingPlan.color || "#334155"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={editingPlan.isActive}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-[var(--border-default)] text-accent focus:ring-accent-500 bg-[var(--surface-subtle)]"
                        />
                        <label
                          htmlFor="isActive"
                          className="text-xs font-bold text-accent cursor-pointer uppercase tracking-tighter"
                        >
                          {language === "ar" ? "نشط" : "Active"}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isVisible"
                          checked={editingPlan.isVisible}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              isVisible: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-[var(--border-default)] text-accent focus:ring-accent-500 bg-[var(--surface-subtle)]"
                        />
                        <label
                          htmlFor="isVisible"
                          className="text-xs font-bold text-[var(--text-muted)] cursor-pointer uppercase tracking-tighter"
                        >
                          {language === "ar" ? "مرئي" : "Visible"}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] transition-colors">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={editingPlan.hideTools}
                          onClick={() =>
                            setEditingPlan({
                              ...editingPlan,
                              hideTools: !editingPlan.hideTools,
                            })
                          }
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex items-center p-0.5 ${
                            editingPlan.hideTools
                              ? "bg-[var(--fg-warning)]"
                              : "bg-[var(--border-default)]"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                              editingPlan.hideTools
                                ? dir === "rtl"
                                  ? "-translate-x-4"
                                  : "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span
                          onClick={() =>
                            setEditingPlan({
                              ...editingPlan,
                              hideTools: !editingPlan.hideTools,
                            })
                          }
                          className="text-xs font-bold text-[var(--text-secondary)] cursor-pointer select-none flex items-center gap-1.5"
                        >
                          {editingPlan.hideTools ? (
                            <EyeOff size={13} className="text-[var(--fg-warning)]" />
                          ) : (
                            <Eye size={13} className="text-[var(--text-muted)]" />
                          )}
                          <span>{dir === "rtl" ? "إخفاء الأدوات شامل" : "Hide All Tools"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* App Studio Cloud Governance Card */}
                    <div className="mb-6 p-4 rounded-shape-lg bg-[var(--surface-subtle)] border-2 border-accent/30 shadow-xs relative overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-shape-xs bg-accent/10 text-accent">
                            <Code2 size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[var(--text-primary)]">
                              {dir === "rtl" ? "حوكمة استوديو التطبيقات والمشاريع السحابية" : "App Studio & Cloud Workspaces Governance"}
                            </h4>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {dir === "rtl" ? "تحديد سعة التخزين، عدد المشاريع السحابية والنسخ الاحتياطية المسموحة لهذه الخطة" : "Configure storage limit, cloud projects capacity, and snapshots quota for this plan"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-white shadow-2xs">
                          {dir === "rtl" ? "تحكم السحابة والاستوديو" : "Cloud & Studio Quota"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. Max Cloud Projects */}
                        <div className="p-3 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)]">
                          <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">
                            {dir === "rtl" ? "أقصى مشاريع سحابية" : "Max Cloud Projects"}
                          </label>
                          <div className="relative">
                            <input
                              type={editingPlan.limits?.app_studio?.max_projects === "unlimited" ? "text" : "number"}
                              value={
                                editingPlan.limits?.app_studio?.max_projects === "unlimited"
                                  ? "∞"
                                  : (editingPlan.limits?.app_studio?.max_projects !== undefined ? editingPlan.limits?.app_studio?.max_projects : 5)
                              }
                              readOnly={editingPlan.limits?.app_studio?.max_projects === "unlimited"}
                              onChange={(e) => {
                                updateStudioLimit("max_projects", e.target.value);
                              }}
                              onDoubleClick={() => {
                                const current = editingPlan.limits?.app_studio?.max_projects;
                                updateStudioLimit("max_projects", current === "unlimited" ? 5 : "unlimited");
                              }}
                              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:border-accent"
                              placeholder={dir === "rtl" ? "5 مشاريع" : "5 projects"}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = editingPlan.limits?.app_studio?.max_projects;
                                updateStudioLimit("max_projects", current === "unlimited" ? 5 : "unlimited");
                              }}
                              className="absolute inset-y-0 end-0 px-2 text-[10px] font-bold text-accent hover:opacity-80"
                            >
                              {editingPlan.limits?.app_studio?.max_projects === "unlimited" ? "123" : "∞"}
                            </button>
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] mt-1 block">
                            {dir === "rtl" ? "عدد المشاريع النشطة (∞ = غير محدود)" : "Active projects count (∞ = unlimited)"}
                          </span>
                        </div>

                        {/* 2. Max Storage MB */}
                        <div className="p-3 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)]">
                          <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">
                            {dir === "rtl" ? "سعة التخزين (ميجابايت)" : "Storage Limit (MB)"}
                          </label>
                          <div className="relative">
                            <input
                              type={editingPlan.limits?.app_studio?.max_storage_mb === "unlimited" ? "text" : "number"}
                              value={
                                editingPlan.limits?.app_studio?.max_storage_mb === "unlimited"
                                  ? "∞"
                                  : (editingPlan.limits?.app_studio?.max_storage_mb !== undefined ? editingPlan.limits?.app_studio?.max_storage_mb : 50)
                              }
                              readOnly={editingPlan.limits?.app_studio?.max_storage_mb === "unlimited"}
                              onChange={(e) => {
                                updateStudioLimit("max_storage_mb", e.target.value);
                              }}
                              onDoubleClick={() => {
                                const current = editingPlan.limits?.app_studio?.max_storage_mb;
                                updateStudioLimit("max_storage_mb", current === "unlimited" ? 50 : "unlimited");
                              }}
                              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:border-accent"
                              placeholder="50 MB"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = editingPlan.limits?.app_studio?.max_storage_mb;
                                updateStudioLimit("max_storage_mb", current === "unlimited" ? 50 : "unlimited");
                              }}
                              className="absolute inset-y-0 end-0 px-2 text-[10px] font-bold text-accent hover:opacity-80"
                            >
                              {editingPlan.limits?.app_studio?.max_storage_mb === "unlimited" ? "123" : "∞"}
                            </button>
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] mt-1 block">
                            {dir === "rtl" ? "حجم الكود والملفات (∞ = غير محدود)" : "Code & files size (∞ = unlimited)"}
                          </span>
                        </div>

                        {/* 3. Max Snapshots */}
                        <div className="p-3 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)]">
                          <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">
                            {dir === "rtl" ? "نسخ احتياطية لكل مشروع" : "Snapshots / Project"}
                          </label>
                          <div className="relative">
                            <input
                              type={editingPlan.limits?.app_studio?.max_snapshots === "unlimited" ? "text" : "number"}
                              value={
                                editingPlan.limits?.app_studio?.max_snapshots === "unlimited"
                                  ? "∞"
                                  : (editingPlan.limits?.app_studio?.max_snapshots !== undefined ? editingPlan.limits?.app_studio?.max_snapshots : 5)
                              }
                              readOnly={editingPlan.limits?.app_studio?.max_snapshots === "unlimited"}
                              onChange={(e) => {
                                updateStudioLimit("max_snapshots", e.target.value);
                              }}
                              onDoubleClick={() => {
                                const current = editingPlan.limits?.app_studio?.max_snapshots;
                                updateStudioLimit("max_snapshots", current === "unlimited" ? 5 : "unlimited");
                              }}
                              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:border-accent"
                              placeholder="5 Snapshots"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = editingPlan.limits?.app_studio?.max_snapshots;
                                updateStudioLimit("max_snapshots", current === "unlimited" ? 5 : "unlimited");
                              }}
                              className="absolute inset-y-0 end-0 px-2 text-[10px] font-bold text-accent hover:opacity-80"
                            >
                              {editingPlan.limits?.app_studio?.max_snapshots === "unlimited" ? "123" : "∞"}
                            </button>
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] mt-1 block">
                            {dir === "rtl" ? "تاريخ الإصدارات المسترجعة" : "Version history restore points"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {editingPlan.hideTools && (
                      <div className="mb-3 px-3.5 py-2.5 rounded-shape-md bg-[var(--status-warning-subtle)] border border-[var(--fg-warning)]/30 text-[var(--fg-warning)] text-xs flex items-center gap-2.5">
                        <EyeOff size={16} className="shrink-0" />
                        <span className="font-medium leading-relaxed">
                          {dir === "rtl"
                            ? "تنبيه: تم تفعيل الإخفاء الشامل للأدوات. لن يتم عرض قسم حصص الأدوات للمستخدمين في صفحة الاشتراكات لهذه الخطة."
                            : "Notice: Global tool hiding is active. Tool quotas will not be displayed on the subscription page for this plan."}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                          {t("limits")}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editingPlan.limits };
                              ALL_TOOLS.forEach((tool) => {
                                if (!updated[tool]) updated[tool] = { daily: 0, monthly: 0 };
                                updated[tool] = { ...updated[tool], isHidden: true };
                              });
                              setEditingPlan({ ...editingPlan, limits: updated });
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--fg-warning)] transition-colors cursor-pointer flex items-center gap-1"
                            title={dir === "rtl" ? "إخفاء جميع الأدوات فردياً" : "Hide all tools individually"}
                          >
                            <EyeOff size={11} />
                            <span>{dir === "rtl" ? "إخفاء الكل" : "Hide All"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editingPlan.limits };
                              ALL_TOOLS.forEach((tool) => {
                                if (!updated[tool]) updated[tool] = { daily: 0, monthly: 0 };
                                updated[tool] = { ...updated[tool], isHidden: false };
                              });
                              setEditingPlan({ ...editingPlan, limits: updated });
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent transition-colors cursor-pointer flex items-center gap-1"
                            title={dir === "rtl" ? "إظهار جميع الأدوات فردياً" : "Show all tools individually"}
                          >
                            <Eye size={11} />
                            <span>{dir === "rtl" ? "إظهار الكل" : "Show All"}</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4 text-[10px] font-bold text-accent/80 uppercase tracking-widest bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {t("daily")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {t("monthly")}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-1 mb-1.5">
                      <div className="flex justify-between px-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tighter opacity-60">
                        <span>{t("daily")}</span>
                        <span>{t("monthly")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALL_TOOLS.map((key, tIdx) => {
                        const isUnlimitedDaily =
                          editingPlan.limits[key]?.daily === "unlimited";
                        const isUnlimitedMonthly =
                          editingPlan.limits[key]?.monthly === "unlimited";
                        const isToolHidden = Boolean(editingPlan.limits[key]?.isHidden);

                        return (
                          <div
                            key={`tool-limit-edit-${key}-${tIdx}`}
                            className={`p-3 rounded-shape-md border transition-theme group relative overflow-hidden ${
                              isToolHidden
                                ? "bg-[var(--surface-card)]/50 border-[var(--border-default)]/70 opacity-75"
                                : "bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-accent/40"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2 px-1">
                              <span
                                className={`text-[10px] font-bold truncate transition-theme uppercase tracking-widest ${
                                  isToolHidden
                                    ? "text-[var(--text-muted)] line-through opacity-70"
                                    : "text-[var(--text-muted)] group-hover:text-accent"
                                }`}
                                title={key}
                              >
                                {t(key)}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isToolHidden}
                                  onClick={() => updateLimit(key, "isHidden", !isToolHidden)}
                                  className={`px-2 py-0.5 rounded-shape-xs text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer select-none ${
                                    isToolHidden
                                      ? "bg-[var(--status-warning-subtle)] border-[var(--fg-warning)]/40 text-[var(--fg-warning)]"
                                      : "bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                  }`}
                                  title={dir === "rtl" ? "تبديل إخفاء هذه الأداة في واجهة المستخدم" : "Toggle tool visibility for users"}
                                >
                                  {isToolHidden ? (
                                    <>
                                      <EyeOff size={11} />
                                      <span>{dir === "rtl" ? "مخفية" : "Hidden"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye size={11} />
                                      <span>{dir === "rtl" ? "ظاهرة" : "Visible"}</span>
                                    </>
                                  )}
                                </button>
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isUnlimitedDaily || isUnlimitedMonthly
                                      ? "bg-accent animate-pulse"
                                      : "bg-[var(--border-default)]"
                                  }`}
                                />
                              </div>
                            </div>
                            <div
                              className={
                                key === "storage_mb"
                                  ? "grid grid-cols-1"
                                  : "grid grid-cols-2 gap-2"
                              }
                            >
                              {key !== "storage_mb" && (
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase ml-1 opacity-60">
                                    {t("daily")}
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={
                                        isUnlimitedDaily ? "text" : "number"
                                      }
                                      value={
                                        isUnlimitedDaily
                                          ? "∞"
                                          : editingPlan.limits[key]?.daily || 0
                                      }
                                      readOnly={isUnlimitedDaily}
                                      onChange={(e) =>
                                        updateLimit(
                                          key,
                                          "daily",
                                          e.target.value,
                                        )
                                      }
                                      onDoubleClick={() =>
                                        updateLimit(
                                          key,
                                          "daily",
                                          isUnlimitedDaily ? "0" : "unlimited",
                                        )
                                      }
                                      className={`w-full h-10 px-2 rounded-shape-sm border text-center text-sm font-mono focus:outline-none transition-theme ${
                                        isUnlimitedDaily
                                          ? "bg-accent/10 border-accent/30 text-accent font-bold text-xl"
                                          : "bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)]"
                                      } focus:border-accent/50 cursor-pointer shadow-inner`}
                                      title={
                                        isUnlimitedDaily
                                          ? "Unlimited (Double click to set number)"
                                          : "Usage Limit (Double click for unlimited)"
                                      }
                                      dir="ltr"
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-[var(--text-muted)] uppercase ml-1 opacity-60">
                                  {key === "storage_mb"
                                    ? t("usageLoad") || "Total Capacity"
                                    : t("monthly")}
                                </label>
                                <div className="relative">
                                  <input
                                    type={
                                      isUnlimitedMonthly ? "text" : "number"
                                    }
                                    value={
                                      isUnlimitedMonthly
                                        ? "∞"
                                        : editingPlan.limits[key]?.monthly || 0
                                    }
                                    readOnly={isUnlimitedMonthly}
                                    onChange={(e) =>
                                      updateLimit(
                                        key,
                                        "monthly",
                                        e.target.value,
                                      )
                                    }
                                    onDoubleClick={() =>
                                      updateLimit(
                                        key,
                                        "monthly",
                                        isUnlimitedMonthly ? "0" : "unlimited",
                                      )
                                    }
                                    className={`w-full h-10 px-2 rounded-shape-sm border text-center text-sm font-mono focus:outline-none transition-theme ${
                                      isUnlimitedMonthly
                                        ? "bg-accent/10 border-accent/30 text-accent font-bold text-xl"
                                        : "bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)]"
                                    } focus:border-accent/50 cursor-pointer shadow-inner`}
                                    title={
                                      isUnlimitedMonthly
                                        ? "Unlimited (Double click to set number)"
                                        : "Usage Limit (Double click for unlimited)"
                                    }
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Billing Cycles & Pricing Control Section */}
                  <div className="space-y-4 pt-4 border-t border-[var(--border-default)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-accent" />
                        <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                          {dir === "rtl" ? "خيارات وفترات الفوترة والاشتراك" : "Billing Cycles & Pricing Control"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-card)] px-2 py-0.5 rounded border border-[var(--border-default)]">
                        {dir === "rtl" ? "تحكم صارم في خيارات المشترك" : "Strict Subscriber Options"}
                      </span>
                    </div>

                    {/* Cycle 1: Daily / Custom Days Plan */}
                    <div className={`p-3.5 rounded-shape-md border transition-all ${
                      editingPlan.isDailyEnabled 
                        ? 'bg-[var(--fg-warning)]/5 border-[var(--fg-warning)]/30' 
                        : 'bg-[var(--surface-subtle)] border-[var(--border-default)] opacity-70'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingPlan.isDailyEnabled || false}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                isDailyEnabled: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--fg-warning)] focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Clock size={13} className="text-[var(--fg-warning)]" />
                              {dir === "rtl" ? "تفعيل خطة الأيام / الفترة المحددة (أسبوعي/مؤقت)" : "Enable Custom Days / Fixed Period Plan"}
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {dir === "rtl" ? "خطة محددة بعدد أيام (مثلاً: مجانية أو أسبوعية لـ 7 أيام)" : "Fixed duration plan (e.g. 7-day free trial or 7-day pass)"}
                            </p>
                          </div>
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${editingPlan.isDailyEnabled ? 'bg-[var(--status-warning-subtle)] text-[var(--fg-warning)]' : 'bg-[var(--surface-card)] text-[var(--text-muted)]'}`}>
                          {editingPlan.isDailyEnabled ? (dir === "rtl" ? "مفعل" : "Active") : (dir === "rtl" ? "معطل" : "Disabled")}
                        </span>
                      </div>

                      {editingPlan.isDailyEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--fg-warning)]/20">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1">
                              {dir === "rtl" ? "عدد الأيام (المدة)" : "Number of Days"}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={editingPlan.dailyDays || 7}
                              onChange={(e) =>
                                setEditingPlan({
                                  ...editingPlan,
                                  dailyDays: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="w-full h-10 px-3 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm focus:outline-none focus:border-[var(--fg-warning)]/50"
                              dir="ltr"
                            />
                            <div className="flex gap-1.5 pt-1">
                              {[1, 3, 7, 14, 30].map((d) => (
                                <button
                                  key={`preset-day-${d}`}
                                  type="button"
                                  onClick={() => setEditingPlan({ ...editingPlan, dailyDays: d })}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${
                                    (editingPlan.dailyDays || 7) === d
                                      ? 'bg-[var(--fg-warning)] text-white border-[var(--fg-warning)]/40'
                                      : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--fg-warning)]/40'
                                  }`}
                                >
                                  {d} {dir === "rtl" ? "يوم" : "d"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1">
                                {dir === "rtl" ? "سعر المدة ($ 0 للمجاني)" : "Period Price ($ 0 for free)"}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingPlan.dailyPrice !== undefined ? editingPlan.dailyPrice : 0}
                                  onChange={(e) => {
                                    const p = Math.max(0, Number(e.target.value) || 0);
                                    setEditingPlan({
                                      ...editingPlan,
                                      dailyPrice: p,
                                      dailyCredits: Math.round(p * 1000)
                                    });
                                  }}
                                  className="w-full h-10 pl-8 pr-3 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm focus:outline-none focus:border-[var(--fg-warning)]/50"
                                  dir="ltr"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1 flex items-center justify-between">
                                <span>{dir === "rtl" ? "كريديت الفترة المخصصة" : "Period AI Credits"}</span>
                                <span className="text-[10px] text-[var(--fg-warning)] font-mono">1$ = 1000</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={editingPlan.dailyCredits !== undefined ? editingPlan.dailyCredits : 0}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...editingPlan,
                                      dailyCredits: Math.max(0, parseInt(e.target.value, 10) || 0)
                                    })
                                  }
                                  className="w-full h-10 px-3 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm font-mono focus:outline-none focus:border-[var(--fg-warning)]/50"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cycle 2: Monthly Plan */}
                    <div className={`p-3.5 rounded-shape-md border transition-all ${
                      editingPlan.isMonthlyEnabled !== false 
                        ? 'bg-[var(--fg-accent)]/5 border-[var(--border-accent)]/30' 
                        : 'bg-[var(--surface-subtle)] border-[var(--border-default)] opacity-70'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingPlan.isMonthlyEnabled !== false}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                isMonthlyEnabled: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--fg-accent)] focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Calendar size={13} className="text-[var(--fg-accent)]" />
                              {dir === "rtl" ? "تفعيل الاشتراك الشهري" : "Enable Monthly Billing"}
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {dir === "rtl" ? "يتيح للمستخدمين الاشتراك على أساس شهري متجدد" : "Allows users to subscribe on a monthly recurring basis"}
                            </p>
                          </div>
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${editingPlan.isMonthlyEnabled !== false ? 'bg-[var(--fg-accent)]/20 text-[var(--fg-accent)]' : 'bg-[var(--surface-card)] text-[var(--text-muted)]'}`}>
                          {editingPlan.isMonthlyEnabled !== false ? (dir === "rtl" ? "مفعل" : "Active") : (dir === "rtl" ? "معطل" : "Disabled")}
                        </span>
                      </div>

                      {editingPlan.isMonthlyEnabled !== false && (
                        <div className="pt-2 border-t border-[var(--border-accent)]/20">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1">
                                {dir === "rtl" ? "سعر الاشتراك الشهري ($)" : "Monthly Subscription Price ($)"}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingPlan.monthlyPrice}
                                  onChange={(e) => {
                                    const m = Number(e.target.value);
                                    const d = Number(editingPlan.discount || 0);
                                    const a = m * 12 * (1 - d / 100);
                                    setEditingPlan({
                                      ...editingPlan,
                                      monthlyPrice: m,
                                      annualPrice: Number(a.toFixed(2)),
                                      monthlyCredits: Math.round(m * 1000),
                                      annualCredits: Math.round(a * 1000)
                                    });
                                  }}
                                  className="w-full h-10 pl-8 pr-3 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm focus:outline-none focus:border-[var(--border-accent)]/50"
                                  dir="ltr"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1 flex items-center justify-between">
                                <span>{dir === "rtl" ? "عداد كريديت الشهر" : "Monthly AI Credits"}</span>
                                <span className="text-[10px] text-[var(--fg-accent)] font-mono">1$ = 1000</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={editingPlan.monthlyCredits !== undefined ? editingPlan.monthlyCredits : 0}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...editingPlan,
                                      monthlyCredits: Math.max(0, parseInt(e.target.value, 10) || 0)
                                    })
                                  }
                                  className="w-full h-10 px-3 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm font-mono focus:outline-none focus:border-[var(--border-accent)]/50"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cycle 3: Annual Plan */}
                    <div className={`p-3.5 rounded-shape-md border transition-all ${
                      editingPlan.isAnnualEnabled !== false 
                        ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/30' 
                        : 'bg-[var(--surface-subtle)] border-[var(--border-default)] opacity-70'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingPlan.isAnnualEnabled !== false}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                isAnnualEnabled: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--fg-success)] focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Sparkles size={13} className="text-[var(--fg-success)]" />
                              {dir === "rtl" ? "تفعيل الاشتراك السنوي" : "Enable Annual Billing"}
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {dir === "rtl" ? "يتيح للمستخدمين الاشتراك على أساس سنوي مع خصم اختياري" : "Allows users to subscribe on an annual basis with optional discount"}
                            </p>
                          </div>
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${editingPlan.isAnnualEnabled !== false ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)]' : 'bg-[var(--surface-card)] text-[var(--text-muted)]'}`}>
                          {editingPlan.isAnnualEnabled !== false ? (dir === "rtl" ? "مفعل" : "Active") : (dir === "rtl" ? "معطل" : "Disabled")}
                        </span>
                      </div>

                      {editingPlan.isAnnualEnabled !== false && (
                        <div className="space-y-3 pt-2 border-t border-[var(--fg-success)]/20">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1">
                                {dir === "rtl" ? "سعر الاشتراك السنوي ($)" : "Annual Price ($)"}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingPlan.annualPrice}
                                  onChange={(e) => {
                                    const a = Number(e.target.value);
                                    const m = Number(editingPlan.monthlyPrice);
                                    let d = 0;
                                    if (m > 0) {
                                      d = Math.round((1 - a / (m * 12)) * 100);
                                    }
                                    setEditingPlan({
                                      ...editingPlan,
                                      annualPrice: a,
                                      discount: d,
                                      annualCredits: Math.round(a * 1000)
                                    });
                                  }}
                                  className="w-full h-10 pl-8 pr-3 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm focus:outline-none focus:border-[var(--fg-success)]/50"
                                  dir="ltr"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1">
                                {dir === "rtl" ? "نسبة الخصم (%)" : "Discount (%)"}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editingPlan.discount || 0}
                                  onChange={(e) => {
                                    const d = Number(e.target.value);
                                    const m = Number(editingPlan.monthlyPrice);
                                    const a = m * 12 * (1 - d / 100);
                                    setEditingPlan({
                                      ...editingPlan,
                                      discount: d,
                                      annualPrice: Number(a.toFixed(2)),
                                      annualCredits: Math.round(a * 1000)
                                    });
                                  }}
                                  className="w-full h-10 px-3 pr-8 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm focus:outline-none focus:border-[var(--fg-success)]/50"
                                  dir="ltr"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">
                                  %
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] px-1 flex items-center justify-between">
                                <span>{dir === "rtl" ? "عداد كريديت السنة" : "Annual Credits"}</span>
                                <span className="text-[10px] text-[var(--fg-success)] font-mono">1$ = 1000</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={editingPlan.annualCredits !== undefined ? editingPlan.annualCredits : 0}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...editingPlan,
                                      annualCredits: Math.max(0, parseInt(e.target.value, 10) || 0)
                                    })
                                  }
                                  className="w-full h-10 px-3 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-sm font-mono focus:outline-none focus:border-[var(--fg-success)]/50"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Authorized Session Metadata */}
                  <div className="pt-4 border-t border-[var(--border-default)] text-center">
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                      {dir === "rtl" ? "إجراء مصرح به: تكوين باقة النظام" : "Authorized Action: System Plan Configuration"}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 order-1 lg:order-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] px-1">
                        {t("planNameEn")}
                      </label>
                      <input
                        type="text"
                        value={editingPlan.nameEn}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            nameEn: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] px-1">
                        {t("planNameAr")}
                      </label>
                      <input
                        type="text"
                        value={editingPlan.nameAr}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            nameAr: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] px-1">
                        {t("planDescEn")}
                      </label>
                      <input
                        type="text"
                        value={editingPlan.descEn}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            descEn: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] px-1">
                        {t("planDescAr")}
                      </label>
                      <input
                        type="text"
                        value={editingPlan.descAr}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            descAr: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] px-1">
                      {dir === "rtl" ? "ميزات الباقة (ثنائي اللغة)" : "Plan Features (Bilingual)"}
                    </h3>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto px-1 custom-scrollbar">
                      {editingPlan.features.map((feature: any, index: number) => (
                        <div
                          key={`edit-plan-feat-${index}`}
                          className="p-3 rounded-shape-md border flex flex-col gap-2 relative bg-[var(--surface-subtle)] border-[var(--border-default)]"
                        >
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-accent uppercase tracking-wider">
                              {dir === "rtl" ? `ميزة #${index + 1}` : `Feature #${index + 1}`}
                            </span>
                            <button
                              onClick={() => removeFeature(feature.id)}
                              className="text-[var(--text-muted)] hover:text-[var(--fg-danger)] transition-theme cursor-pointer"
                              title={dir === "rtl" ? "حذف الميزة" : "Remove Feature"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={feature.textEn}
                              placeholder="English text"
                              onChange={(e) =>
                                updateFeature(feature.id, "textEn", e.target.value)
                              }
                              className="h-10 px-3 rounded-shape-sm border text-sm bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme"
                              dir="ltr"
                            />
                            <input
                              type="text"
                              value={feature.textAr}
                              placeholder="النص باللغة العربية"
                              onChange={(e) =>
                                updateFeature(feature.id, "textAr", e.target.value)
                              }
                              className="h-10 px-3 rounded-shape-sm border text-sm bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent/50 transition-theme"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addFeature}
                      className="w-full py-2.5 rounded-shape-md bg-accent hover:bg-accent/90 text-[var(--fg-on-emphasis)] font-bold text-sm transition-theme shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus size={16} /> {t("addFeature")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
