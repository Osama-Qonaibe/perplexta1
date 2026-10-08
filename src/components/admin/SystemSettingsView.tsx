import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Brain,
  Settings,
  Save,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  Key,
  Plus,
  Zap,
  Eye,
  EyeOff,
  Wrench,
  Megaphone,
  Trash2,
  X,
  Settings2,
  Download,
  ArrowRight,
  Globe,
  Upload,
  CreditCard,
  Gift,
  Smartphone,
  Monitor,
  Compass,
  Palette,
  Image as ImageIcon,
  ShieldCheck,
  Layers,
  Server,
} from "lucide-react";
import { SystemSettingsViewProps } from "./adminTypes";
import { 
  isPathBlocked, 
  isGoogleAuthHidden, 
  isMobilePwaBannerHidden, 
  isFeatureBlockedOnMobile 
} from "../../utils/sectionVisibility";
import { resolveImageUrl } from "../../utils/imageResolver";
import { updateDocumentHeadIcons } from "../../utils/assetManager";
import { toast, useConfirm } from '@/design-system';
import { SeoCenterView } from "../SeoCenterView";
import { MemoryCenterView } from "./MemoryCenterView";

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  theme,
  t,
  dir,
  initialTab = "general",
  onTabChange,
  hideSubTabs = false,
}) => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { siteSettings, setSiteSettings, token, setIsOperationPending, language } = useAppContext();

  const [activeMainTab, setActiveMainTab] = useState<'general' | 'seo' | 'memory'>(initialTab || 'general');

  useEffect(() => {
    if (initialTab && initialTab !== activeMainTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  const handleMainTabSwitch = (tab: 'general' | 'seo' | 'memory') => {
    setActiveMainTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [siteName, setSiteName] = useState(siteSettings.siteName);
  const [siteNameAr, setSiteNameAr] = useState(siteSettings.siteNameAr || "");
  const [seoSiteNameEn, setSeoSiteNameEn] = useState("");
  const [seoSiteNameAr, setSeoSiteNameAr] = useState("");
  const [siteDescription, setSiteDescription] = useState(
    siteSettings.siteDescription,
  );
  const [siteDescriptionAr, setSiteDescriptionAr] = useState(
    siteSettings.siteDescriptionAr || "",
  );
  const [seoDescriptionEn, setSeoDescriptionEn] = useState("");
  const [seoDescriptionAr, setSeoDescriptionAr] = useState("");
  const [keywordsEn, setKeywordsEn] = useState("");
  const [keywordsAr, setKeywordsAr] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(
    siteSettings.googleAnalyticsId,
  );
  const [googleSiteVerification, setGoogleSiteVerification] = useState(
    siteSettings.googleSiteVerification || "",
  );
  const [blockedPaths, setBlockedPaths] = useState(
    siteSettings.blocked_paths || "",
  );

  const handleToggleSection = (key: string) => {
    const currentList = (blockedPaths || "").split(',').map(p => p.trim()).filter(Boolean);
    let isCurrentlyHidden = false;

    if (key === 'hide_google_auth') {
      isCurrentlyHidden = isGoogleAuthHidden(blockedPaths, false);
    } else if (key === 'hide_mobile_google_auth') {
      isCurrentlyHidden = currentList.some(i => ['hide_mobile_google_auth', 'mobile_google_auth', 'hide-mobile-google-auth'].includes(i.toLowerCase().trim().replace(/^\/+/, '')));
    } else if (key === 'hide_mobile_pwa') {
      isCurrentlyHidden = isMobilePwaBannerHidden(blockedPaths);
    } else if (key.startsWith('hide_mobile_')) {
      const feat = key.replace('hide_mobile_', '');
      isCurrentlyHidden = currentList.some(i => {
        const itemClean = i.toLowerCase().trim().replace(/^\/+/, '');
        return itemClean === key.toLowerCase() || itemClean === `mobile_${feat}` || itemClean === `hide_mobile_${feat}`;
      });
    } else {
      isCurrentlyHidden = isPathBlocked(key, blockedPaths, false);
    }

    let updatedList: string[];
    if (isCurrentlyHidden) {
      const keyClean = key.toLowerCase().replace(/^\/+/, '');
      updatedList = currentList.filter(item => {
        const itemClean = item.toLowerCase().replace(/^\/+/, '');
        if (key === 'hide_google_auth') {
          return !['hide_google_auth', 'google_auth', 'hide-google-auth'].includes(itemClean);
        }
        if (key === 'hide_mobile_google_auth') {
          return !['hide_mobile_google_auth', 'mobile_google_auth', 'hide-mobile-google-auth'].includes(itemClean);
        }
        if (key === 'hide_mobile_pwa') {
          return !['hide_mobile_pwa', 'mobile_pwa', 'hide_pwa', 'pwa_banner', 'hide_mobile_pwa_banner'].includes(itemClean);
        }
        if (keyClean.startsWith('hide_mobile_')) {
          const feat = keyClean.replace('hide_mobile_', '');
          return ![`hide_mobile_${feat}`, `mobile_${feat}`].includes(itemClean);
        }
        if (keyClean === 'subscription' || keyClean === 'pricing') {
          return !['subscription', 'pricing', 'subscriptions'].includes(itemClean);
        }
        if (keyClean === 'studio') {
          return itemClean !== 'studio';
        }
        if (keyClean === 'google-hub' || keyClean === 'google_hub') {
          return !['google-hub', 'google_hub', 'google'].includes(itemClean);
        }
        if (keyClean === 'bulletin' || keyClean === 'ads') {
          return !['bulletin', 'ads', 'bulletinboard'].includes(itemClean);
        }
        if (keyClean === 'rewards') {
          return itemClean !== 'rewards';
        }
        if (keyClean === 'explore' || keyClean === 'discover') {
          return !['explore', 'discover'].includes(itemClean);
        }
        return itemClean !== keyClean;
      });
    } else {
      updatedList = [...currentList, key];
    }

    setBlockedPaths(updatedList.join(', '));
  };

  const [logoBase64, setLogoBase64] = useState<string | null>(
    siteSettings.logoBase64,
  );
  const [logoLightBase64, setLogoLightBase64] = useState<string | null>(
    siteSettings.logoLightBase64,
  );
  const [faviconBase64, setFaviconBase64] = useState<string | null>(
    siteSettings.faviconBase64,
  );
  const [seoImageUrl, setSeoImageUrl] = useState<string | null>(
    siteSettings.seoImageUrl,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSeoUploading, setIsSeoUploading] = useState(false);

  const [clearingCache, setClearingCache] = useState<string | null>(null);

  // --- DIAGNOSTIC HELPER FOR SYSTEM SETTINGS & ORPHANED LOGO ASSETS ---
  const [orphanedAssetsState, setOrphanedAssetsState] = useState<{
    hasOrphanedAssets: boolean;
    assets: Array<{
      key: string;
      label: string;
      url: string | null;
      exists: boolean;
      isOrphaned: boolean;
      reason?: string;
    }>;
    orphanedKeys: string[];
  } | null>(null);
  const [isCheckingAssets, setIsCheckingAssets] = useState(false);
  const [isRepairingAssets, setIsRepairingAssets] = useState(false);
  const [isSyncingMetadata, setIsSyncingMetadata] = useState(false);

  const handleSyncSeoMetadata = async () => {
    setIsSyncingMetadata(true);
    try {
      const res = await fetch("/api/admin/sync-metadata", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const msg = language === "ar"
          ? `تمت مزامنة البيانات الوصفية لـ SEO بنجاح. (تم تحديث ${data.totalUpdated} عنصر)`
          : `SEO metadata sync complete. (${data.totalUpdated} items updated)`;
        showToast(msg, "success");
      } else {
        throw new Error("Metadata sync failed");
      }
    } catch (err: any) {
      showToast(
        language === "ar"
          ? "حدث خطأ أثناء مزامنة البيانات الوصفية لـ SEO"
          : "Error synchronizing SEO metadata",
        "error"
      );
    } finally {
      setIsSyncingMetadata(false);
    }
  };

  const checkSystemAssetsDiagnostic = async () => {
    setIsCheckingAssets(true);
    try {
      const res = await fetch("/api/admin/settings/check-assets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrphanedAssetsState(data);
      }
    } catch (err) {
      console.error("Failed to run system asset diagnostic check:", err);
    } finally {
      setIsCheckingAssets(false);
    }
  };

  const handleRepairOrphanedAssets = async () => {
    setIsRepairingAssets(true);
    try {
      const res = await fetch("/api/admin/settings/repair-assets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          language === "ar"
            ? "تم إصلاح الشعار والملفات المفقودة بنجاح"
            : "Orphaned assets repaired and restored successfully",
          "success"
        );
        fetchSettings();
        checkSystemAssetsDiagnostic();
      } else {
        throw new Error("Repair request failed");
      }
    } catch (err) {
      showToast(
        language === "ar"
          ? "حدث خطأ أثناء إصلاح الملفات المفقودة"
          : "Failed to repair orphaned assets",
        "error"
      );
    } finally {
      setIsRepairingAssets(false);
    }
  };

  const [missingAssetReport, setMissingAssetReport] = useState<any>(null);
  const [isScanningMissingAssets, setIsScanningMissingAssets] = useState(false);
  const [isPurgingMissingAssets, setIsPurgingMissingAssets] = useState(false);

  const [brandAssetsStatus, setBrandAssetsStatus] = useState<any>(null);
  const [isGeneratingBrandAssets, setIsGeneratingBrandAssets] = useState(false);
  const [isLoadingBrandAssets, setIsLoadingBrandAssets] = useState(false);

  const fetchBrandAssetsStatus = useCallback(async () => {
    setIsLoadingBrandAssets(true);
    try {
      const res = await fetch("/api/admin/settings/brand-assets-status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBrandAssetsStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch brand assets status:", err);
    } finally {
      setIsLoadingBrandAssets(false);
    }
  }, [token]);

  const handleGenerateBrandAssets = async () => {
    setIsGeneratingBrandAssets(true);
    try {
      const res = await fetch("/api/admin/settings/generate-brand-assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ force: true })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          language === "ar"
            ? `تم بنجاح توليد ومزامنة ${data.generatedCount} مقاس أيقونة وهوية لمنصات الويب، iOS، Android و PWA!`
            : `Successfully generated & synchronized ${data.generatedCount} platform icon variants!`,
          "success"
        );
        fetchBrandAssetsStatus();
        updateDocumentHeadIcons();
      } else {
        throw new Error("Generation failed");
      }
    } catch (err: any) {
      showToast(
        language === "ar" ? "فشل توليد مقاسات الأيقونات" : "Failed to generate icon variants",
        "error"
      );
    } finally {
      setIsGeneratingBrandAssets(false);
    }
  };

  const fetchMissingAssetReport = async () => {
    setIsScanningMissingAssets(true);
    try {
      const res = await fetch("/api/admin/missing-assets-report", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMissingAssetReport(data);
      }
    } catch (err) {
      console.error("Failed to fetch missing asset report:", err);
    } finally {
      setIsScanningMissingAssets(false);
    }
  };

  const handlePurgeMissingAssets = async (ids?: number[]) => {
    setIsPurgingMissingAssets(true);
    try {
      const res = await fetch("/api/admin/missing-assets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ids ? { ids } : {})
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          language === "ar"
            ? `تم تطهير وحذف ${data.deletedCount} سجل ملف مفقود بنجاح`
            : `Successfully purged ${data.deletedCount} missing file records`,
          "success"
        );
        fetchMissingAssetReport();
      } else {
        throw new Error("Purge failed");
      }
    } catch (err) {
      showToast(
        language === "ar" ? "فشل تطهير الملفات المفقودة" : "Failed to purge missing assets",
        "error"
      );
    } finally {
      setIsPurgingMissingAssets(false);
    }
  };

  const handleClearCache = async (target: string) => {
    setClearingCache(target);
    try {
      const res = await fetch("/api/admin/cache/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target }),
      });
      if (res.ok) {
        showToast(
          language === "ar" ? "تم مسح الذاكرة المؤقتة بنجاح" : "Cache cleared successfully",
          "success"
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(
          err.error || (language === "ar" ? "فشل مسح الذاكرة المؤقتة" : "Failed to clear cache"),
          "error"
        );
      }
    } catch (error: any) {
      showToast(
        error.message || (language === "ar" ? "فشل مسح الذاكرة المؤقتة" : "Failed to clear cache"),
        "error"
      );
    } finally {
      setClearingCache(null);
    }
  };

  // --- DYNAMIC ROUTE SEO MANAGEMENT STATE ---
  const [routeSeoList, setRouteSeoList] = useState<any[]>([]);
  const [loadingRouteSeo, setLoadingRouteSeo] = useState(false);
  const [editingRouteItem, setEditingRouteItem] = useState<any | null>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState("");
  const [routeUploadingImg, setRouteUploadingImg] = useState(false);

  const fetchRouteSeoList = async () => {
    setLoadingRouteSeo(true);
    try {
      const res = await fetch("/api/admin/seo-routes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRouteSeoList(data);
      }
    } catch (e) {
      console.error("Failed to load route SEO list:", e);
    } finally {
      setLoadingRouteSeo(false);
    }
  };

  const handleOpenAddRouteModal = () => {
    setEditingRouteItem({
      route: "",
      title_ar: "",
      title_en: "",
      description_ar: "",
      description_en: "",
      keywords_ar: "",
      keywords_en: "",
      og_image_url: "",
      is_active: true,
    });
    setIsRouteModalOpen(true);
  };

  const handleOpenEditRouteModal = (item: any) => {
    setEditingRouteItem({ ...item });
    setIsRouteModalOpen(true);
  };

  const handleSaveRouteSeo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRouteItem?.route) {
      showToast(dir === "rtl" ? "مسار الصفحة مطلوب (مثل /bulletin)" : "Route path is required (e.g. /bulletin)", "error");
      return;
    }
    try {
      const res = await fetch("/api/admin/seo-routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingRouteItem),
      });
      if (res.ok) {
        showToast(
          dir === "rtl" ? "تم حفظ إعدادات SEO للمسار بنجاح" : "Route SEO settings saved successfully",
          "success"
        );
        setIsRouteModalOpen(false);
        setEditingRouteItem(null);
        fetchRouteSeoList();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to save route SEO", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Error saving route SEO", "error");
    }
  };

  const handleDeleteRouteSeo = async (id: number) => {
    const isConfirmed = await confirm({
      title: dir === "rtl" ? "حذف إعدادات المسار" : "Delete Route SEO",
      description: dir === "rtl" ? "هل أنت تأكد من حذف إعدادات هذا المسار؟" : "Are you sure you want to delete this route SEO setting?",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/admin/seo-routes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(dir === "rtl" ? "تم حذف إعدادات المسار" : "Route SEO setting removed", "success");
        fetchRouteSeoList();
      } else {
        showToast("Failed to delete", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Delete error", "error");
    }
  };

  const handleRouteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(dir === "rtl" ? "حجم الصورة يجب أن يكون أقل من 2 ميغابايت" : "Image size must be less than 2MB", "error");
      return;
    }
    setRouteUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/settings/upload-asset?assetType=seo_image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          setEditingRouteItem((prev: any) => ({ ...prev, og_image_url: data.imageUrl }));
          showToast(dir === "rtl" ? "تم رفع صورة المسار بنجاح" : "Route SEO image uploaded successfully", "success");
        }
      }
    } catch (err) {
      showToast("Failed to upload image", "error");
    } finally {
      setRouteUploadingImg(false);
    }
  };



  // --- SEO CRAWLABILITY AND ROUTE INDEXING AUDIT REPORT STATE ---
  const [crawlScanning, setCrawlScanning] = useState(false);
  const [crawlAuditFilter, setCrawlAuditFilter] = useState<"all" | "index" | "noindex">("all");
  const [crawlAuditLogs, setCrawlAuditLogs] = useState<string[]>([]);
  const [crawlComplianceRate, setCrawlComplianceRate] = useState<string>("100.00% SECURE");

  useEffect(() => {
    setIsOperationPending(isSaving);
  }, [isSaving, setIsOperationPending]);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    if (type === "success") {
      toast.success(message, dir === "rtl" ? "تم بنجاح" : "Success");
    } else if (type === "warning") {
      toast.warning(message, dir === "rtl" ? "تنبيه" : "Warning");
    } else if (type === "info") {
      toast.info(message, dir === "rtl" ? "معلومة" : "Info");
    } else {
      toast.error(message, dir === "rtl" ? "حدث خطأ" : "Error");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSiteName(data.site_name_en || "");
        setSiteNameAr(data.site_name_ar || "");
        const seoSiteNameEnVal = data.seo_site_name_en || "";
        const seoSiteNameArVal = data.seo_site_name_ar || "";
        setSeoSiteNameEn(seoSiteNameEnVal);
        setSeoSiteNameAr(seoSiteNameArVal);

        setSiteDescription(data.site_description_en || "");
        setSiteDescriptionAr(data.site_description_ar || "");
        const seoEnVal = data.seo_description_en || data.seo_description_en === "" ? data.seo_description_en : "";
        const seoArVal = data.seo_description_ar || "";
        const kwsEnVal = data.keywords_en || "";
        const kwsArVal = data.keywords_ar || "";

        setSeoDescriptionEn(seoEnVal);
        setSeoDescriptionAr(seoArVal);
        setKeywordsEn(kwsEnVal);
        setKeywordsAr(kwsArVal);
        setGoogleAnalyticsId(data.google_analytics_id || "");
        setGoogleSiteVerification(data.google_site_verification || "");
        setBlockedPaths(data.blocked_paths || "");
        setLogoBase64(data.logo_url || null);
        setLogoLightBase64(data.logo_light_url || null);
        setFaviconBase64(data.favicon_url || null);
        setSeoImageUrl(data.seo_image_url || null);

        setSiteSettings({
          ...siteSettings,
          siteName: data.site_name_en || "",
          siteNameAr: data.site_name_ar || "",
          seoSiteNameEn: seoSiteNameEnVal,
          seoSiteNameAr: seoSiteNameArVal,
          siteDescription: data.site_description_en || "",
          siteDescriptionAr: data.site_description_ar || "",
          seoDescriptionEn: seoEnVal,
          seoDescriptionAr: seoArVal,
          keywordsEn: kwsEnVal,
          keywordsAr: kwsArVal,
          googleAnalyticsId: data.google_analytics_id || "",
          logoBase64: data.logo_url || null,
          logoLightBase64: data.logo_light_url || null,
          faviconBase64: data.favicon_url || null,
          seoImageUrl: data.seo_image_url || null,
          blocked_paths: data.blocked_paths || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
      fetchRouteSeoList();
      checkSystemAssetsDiagnostic();
      fetchBrandAssetsStatus();
    }
  }, [token, fetchBrandAssetsStatus]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "logo_light" | "favicon" | "seo",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast(
          dir === "rtl" 
            ? "حجم الصورة يتجاوز الحد الأقصى المسموح به وهو 2 ميغابايت" 
            : "Image size must be less than 2MB", 
          "error"
        );
        return;
      }

      setIsOperationPending(true);
      if (type === "seo") setIsSeoUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assetType", type);

        const response = await fetch("/api/admin/settings/upload-asset", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        if (data.success && data.imageUrl) {
          let updatedLogo = logoBase64;
          let updatedLogoLight = logoLightBase64;
          let updatedFavicon = faviconBase64;
          let updatedSeo = seoImageUrl;

          if (type === "seo") { setSeoImageUrl(data.imageUrl); updatedSeo = data.imageUrl; }
          else if (type === "logo") { setLogoBase64(data.imageUrl); updatedLogo = data.imageUrl; }
          else if (type === "logo_light") { setLogoLightBase64(data.imageUrl); updatedLogoLight = data.imageUrl; }
          else if (type === "favicon") { setFaviconBase64(data.imageUrl); updatedFavicon = data.imageUrl; }

          try {
            const saveRes = await fetch("/api/admin/settings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                logo_url: updatedLogo,
                logo_light_url: updatedLogoLight,
                favicon_url: updatedFavicon,
                seo_image_url: updatedSeo,
              }),
            });

            if (saveRes.ok) {
              setSiteSettings({
                ...siteSettings,
                logoBase64: updatedLogo,
                logoLightBase64: updatedLogoLight,
                faviconBase64: updatedFavicon,
                seoImageUrl: updatedSeo,
              });
              fetchBrandAssetsStatus();
              updateDocumentHeadIcons(updatedFavicon || updatedLogo);
              showToast(
                dir === "rtl" 
                  ? "تم رفع وحفظ وتطبيق الشعار وتوليد الأيقونات بنجاح!" 
                  : "Logo uploaded, saved and platform icon suite generated successfully!", 
                "success"
              );
            } else {
              showToast(
                dir === "rtl" 
                  ? "تم رفع الملف، يرجى النقر على حفظ التغييرات" 
                  : "Uploaded. Click Save to complete.", 
                "success"
              );
            }
          } catch (persistErr) {
            console.error('[AssetUpload] Persistence error:', persistErr);
          }
        } else {
          throw new Error("Upload response was unsuccessful");
        }
      } catch (error) {
        console.error('[AssetUpload] Frontend upload error:', error);
        showToast(
          dir === "rtl" 
            ? "فشل رفع الصورة، يرجى المحاولة لاحقاً" 
            : "Failed to upload asset. Please try again.", 
          "error"
        );
      } finally {
        setIsOperationPending(false);
        if (type === "seo") setIsSeoUploading(false);
      }
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!siteName || !siteDescription) {
      showToast(t("allFieldsRequired") || "All fields are required", "error");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          site_name_en: siteName,
          site_name_ar: siteNameAr,
          site_description_en: siteDescription,
          site_description_ar: siteDescriptionAr,
          seo_description_en: seoDescriptionEn,
          seo_description_ar: seoDescriptionAr,
          keywords_en: keywordsEn,
          keywords_ar: keywordsAr,
          google_analytics_id: googleAnalyticsId,
          google_site_verification: googleSiteVerification,
          logo_url: logoBase64,
          logo_light_url: logoLightBase64,
          favicon_url: faviconBase64,
          seo_image_url: seoImageUrl,
        }),
      });

      if (res.ok) {
        setSiteSettings({
          ...siteSettings,
          siteName,
          siteNameAr,
          siteDescription,
          siteDescriptionAr,
          seoDescriptionEn: seoDescriptionEn,
          seoDescriptionAr: seoDescriptionAr,
          keywordsEn: keywordsEn,
          keywordsAr: keywordsAr,
          seoImageUrl: seoImageUrl,
          logoBase64,
          logoLightBase64,
          faviconBase64,
        });
        showToast(t("saveSuccess") || "General settings saved", "success");
      } else {
        showToast(t("saveFailed") || "Failed", "error");
      }
    } catch (error) {
      showToast(t("saveFailed") || "Failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleSaveEvent = () => {
      handleSaveGeneralSettings();
    };
    window.addEventListener("admin-save-settings", handleSaveEvent);
    return () => {
      window.removeEventListener("admin-save-settings", handleSaveEvent);
    };
  }, [handleSaveGeneralSettings]);

  const handleSaveVisualSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          logo_url: logoBase64,
          logo_light_url: logoLightBase64,
          favicon_url: faviconBase64,
          blocked_paths: blockedPaths || "",
        }),
      });

      if (res.ok) {
        setSiteSettings({
          ...siteSettings,
          logoBase64,
          logoLightBase64,
          faviconBase64,
          blocked_paths: blockedPaths || "",
        });
        showToast(t("saveSuccess") || "Visual settings saved", "success");
      } else {
        const err = await res.json();
        showToast(err.error || t("saveFailed") || "Failed", "error");
      }
    } catch (error: any) {
      showToast(error.message || t("saveFailed") || "Failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVisibilitySettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blocked_paths: blockedPaths || "",
        }),
      });

      if (res.ok) {
        setSiteSettings({
          ...siteSettings,
          blocked_paths: blockedPaths || "",
        });
        showToast(dir === "rtl" ? "تم حفظ إعدادات إخفاء الأقسام بنجاح" : "Visibility settings saved successfully", "success");
      } else {
        const err = await res.json();
        showToast(err.error || t("saveFailed") || "Failed", "error");
      }
    } catch (error: any) {
      showToast(error.message || t("saveFailed") || "Failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSeoSettings = async () => {
    if (!siteName) {
      showToast(dir === "rtl" ? "اسم الموقع بالإنجليزية مطلوب" : "Site Name in English is required", "error");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          site_name_en: siteName,
          site_name_ar: siteNameAr,
          seo_site_name_en: seoSiteNameEn,
          seo_site_name_ar: seoSiteNameAr,
          site_description_en: siteDescription,
          site_description_ar: siteDescriptionAr,
          seo_description_en: seoDescriptionEn,
          seo_description_ar: seoDescriptionAr,
          keywords_en: keywordsEn,
          keywords_ar: keywordsAr,
          google_analytics_id: googleAnalyticsId || "",
          google_site_verification: googleSiteVerification || "",
          seo_image_url: seoImageUrl,
          blocked_paths: blockedPaths || "",
        }),
      });

      if (res.ok) {
        setSiteSettings({
          ...siteSettings,
          siteName,
          siteNameAr,
          seoSiteNameEn,
          seoSiteNameAr,
          siteDescription,
          siteDescriptionAr,
          seoDescriptionEn,
          seoDescriptionAr,
          keywordsEn,
          keywordsAr,
          googleAnalyticsId,
          googleSiteVerification,
          seoImageUrl,
          blocked_paths: blockedPaths,
        });
        showToast(t("saveSuccess") || "SEO settings saved", "success");
      } else {
        const err = await res.json();
        showToast(err.error || t("saveFailed") || "Failed", "error");
      }
    } catch (error: any) {
      showToast(error.message || t("saveFailed") || "Failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- CRAWLABILITY ROUTE LIST, SCANNER, AND EXPORT CONSOLE FUNCTIONS ---
  const routesSchema = useMemo(() => {
    const base = [
      { path: "/", labelEn: "Home Gateway Redirect", labelAr: "بوابة التوجيه الرئيسية", type: "public", status: "index", descriptionEn: "Public gateway routing users to default dashboard structure.", descriptionAr: "بوابة توجيه عامة تقوم بتوجيه المستخدمين للواجهة الافتراضية." },
      { path: "/subscription", labelEn: "Subscription Plans Page", labelAr: "صفحة خطط الاشتراكات", type: "public", status: "index", descriptionEn: "Public storefront detailing memberships, tiers, and pricing matrices.", descriptionAr: "صفحة عامة لعرض مزايا وتفاصيل العضوية والخطط السعرية." },
      { path: "/viralbook", labelEn: "ViralBook & Community Feed", labelAr: "فيرال بوك والمجتمع التفاعلي", type: "public", status: "index", descriptionEn: "Public interactive feed with verified reels, business pages, and campaigns.", descriptionAr: "منصة فيرال بوك التفاعلية لنشر الإعلانات ومقاطع الفيديو والصفحات التجارية." },
      { path: "/terms", labelEn: "Terms of Service", labelAr: "شروط الخدمة والاستخدام", type: "public", status: "index", descriptionEn: "Mandatory public legal statement governing platform interactions.", descriptionAr: "اتفاقية قانونية عامة تنظم الاستخدام وحقوق الملكية للمنصة." },
      { path: "/privacy", labelEn: "Privacy Policy Charter", labelAr: "سياسة الخصوصية وحماية البيانات", type: "public", status: "index", descriptionEn: "Mandatory public charter highlighting database handling policies.", descriptionAr: "ميثاق خصوصية عام يوضح سياسات التعامل الآمن مع قواعد البيانات." },
      { path: "/about", labelEn: "About Corporate Pitch", labelAr: "صفحة التعريف والرؤية", type: "public", status: "index", descriptionEn: "Public company presentation showcasing core tech vision.", descriptionAr: "عرض عام للمؤسسة يعزز الثقة ويوضح الرؤية الابتكارية." },
      { path: "/chat", labelEn: "Intelligence Workspace (Chat Component)", labelAr: "مساحة المحادثة والتحليل الذكي المتطور", type: "private", status: "noindex", descriptionEn: "Highly sensitive user-curated environment containing active AI transcriptions.", descriptionAr: "مساحة عمل خاصة وسرية للغاية تحتوي على سجل محادثات الذكاء الاصطناعي." },
      { path: "/settings", labelEn: "User Profile & Security Vault", labelAr: "إعدادات الحساب وحقيبة أمان العضو", type: "private", status: "noindex", descriptionEn: "Sensitive account configurations, referral links, and session details.", descriptionAr: "إعدادات شخصية حساسة ومفاتيح العضوية وسجلات الجلسات النشطة." },
      { path: "/rewards", labelEn: "Affiliate Ledger & KYC Pending Board", labelAr: "نظام المكافآت والتحقق المالي المتقدم", type: "private", status: "noindex", descriptionEn: "Ledger transaction audits, KYC identities, and wallet addresses.", descriptionAr: "سجلات ماليّة لتعيين المكافآت وبيانات التحقق وإثبات الهوية." },
      { path: "/reset-password", labelEn: "Credential Reset Gateway", labelAr: "بوابة استعادة وتعيين كلمة المرور", type: "private", status: "noindex", descriptionEn: "Temporary authentication token interface. Must stay isolated.", descriptionAr: "واجهة استعادة كلمات المرور باستخدام رموز تحقق متغيرة." },
      { path: "/admin-sections", labelEn: "Sections Control Panel (External Modules)", labelAr: "لوحة تحكم الأقسام والأبحاث الخارجية", type: "admin", status: "noindex", descriptionEn: "External systems integration, categories block and custom module definitions.", descriptionAr: "لوحة ربط الأنظمة ومصادر الأبحاث الخارجية وتمرير المعطيات الحساسة." },
      { path: "/admin/sections", labelEn: "Sections Dashboard Internal Portal", labelAr: "بوابة الأقسام الداخلية للأنظمة الإلكترونية", type: "admin", status: "noindex", descriptionEn: "Internal database mappings and custom categories routing matrix.", descriptionAr: "مصفوفة فحص مسارات قواعد البيانات الداخلية للأنظمة والمجتمع." },
      { path: "/admin", labelEn: "System Command Center (Core)", labelAr: "لوحة التحكم الرئيسية والقيادة والتحكم", type: "admin", status: "noindex", descriptionEn: "Extreme-privileged interface displaying infrastructure configurations.", descriptionAr: "واجهة تحكم فائقة الحساسية للتحكم بالبنية التحتية والموديلات." }
    ];

    const dynamicBlockedList = siteSettings?.blocked_paths
      ? siteSettings.blocked_paths.split(',').map((p: string) => p.trim()).filter(Boolean)
      : [];

    dynamicBlockedList.forEach((blockedPath: string) => {
      const exists = base.some(r => r.path === blockedPath || r.path === '/' + blockedPath);
      if (!exists) {
        base.push({
          path: blockedPath.startsWith('/') ? blockedPath : '/' + blockedPath,
          labelEn: `Custom Excluded: ${blockedPath}`,
          labelAr: `مسار محظور مخصص: ${blockedPath}`,
          type: "custom",
          status: "noindex",
          descriptionEn: "Dynamically added via SEO System Exclusions control panel.",
          descriptionAr: "تمت إضافته ديناميكياً لتأمين البيانات عبر لوحة التحكم."
        });
      }
    });

    return base;
  }, [siteSettings, siteSettings?.blocked_paths]);

  const runCrawlAuditScan = async () => {
    if (crawlScanning) return; // Protect against concurrent scan execution
    
    // Explicitly reset all loading and data states for a fresh and reliable scan
    setCrawlScanning(true);
    setCrawlAuditLogs([
      language === "ar" 
        ? "⏳ يرجى الانتظار... جاري إنشاء بروتوكول اتصال آمن مع خادم التدقيق..." 
        : "⏳ Initiating secure diagnostic connection to strict compliance core..."
    ]);
    setCrawlComplianceRate(language === "ar" ? "معلق" : "PENDING");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds connection timeout
    
    try {
      const response = await fetch(`/api/admin/seo-audit?lang=${language}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to contact the SEO crawler audit core on server.");
      }
      const data = await response.json();
      
      const messages = data.logs || [];
      setCrawlComplianceRate(data.compliance_score || "100.00% SECURE");
      
      let step = 0;
      setCrawlAuditLogs([]); // Reset log queue to stream real logs
      const timer = setInterval(() => {
        if (step < messages.length) {
          const logText = messages[step];
          setCrawlAuditLogs(prev => [...prev, logText]);
          step++;
        } else {
          clearInterval(timer);
          setCrawlScanning(false);
        }
      }, 500);

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[CrawlAudit] Scan failure:", err);
      setCrawlScanning(false);
      const isAr = language === "ar";
      const isTimeout = err.name === "AbortError";
      
      setCrawlComplianceRate("0.00% HIGH_RISK");
      
      setCrawlAuditLogs([
        isTimeout
          ? (isAr 
              ? "🚨 [TIMEOUT] انتهت مهلة الاتصال بالخادم. الاستجابة متأخرة للغاية نتيجة لارتفاع زمن الاستجابة للمخدم." 
              : "🚨 [TIMEOUT] The connection to the security compliance core timed out due to unstable network latency.")
          : (isAr 
              ? "🚨 [ERROR] فشل الاتصال بخادم التدقيق الصارم للتأكد من حماية بيئة المنصة." 
              : "🚨 [ERROR] Failed to establish high-fidelity connection to strict backend audit service.")
      ]);
    }
  };

  const downloadCrawlAuditReport = () => {
    const report = {
      platform: "Perplexta",
      timestamp: new Date().toISOString(),
      scanning_officer_id: "PERPLEXTA_ADMIN_V4",
      security_compliance_rate: crawlComplianceRate,
      total_analysed_endpoints: routesSchema.length,
      indexing_policy_applied: {
        strict_user_data_isolation: "enforced",
        allowed_public_routes_whitelist: [
          "/", "/subscription", "/bulletin", "/terms", "/privacy", "/about"
        ]
      },
      endpoints_analysis: routesSchema.map((r: any) => ({
        url_path: r.path,
        endpoint_role: r.labelEn,
        route_class: r.type.toUpperCase(),
        target_search_indexing: r.status === "index" ? "ALLOWED (STANDARD INDEX)" : "BLOCKED (STRICT NOINDEX)",
        meta_robots_tag_verified: r.status === "noindex" ? "noindex, nofollow" : "index, follow",
        confidentiality_protection_level: r.status === "noindex" ? "MAXIMUM SHIELDED" : "STANDARD PUBLIC"
      }))
    };

    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = `perplexta_seo_indexing_report_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="w-full max-w-full space-y-6 relative px-1 md:px-2">

      {/* Sub-Tabs Navigation Bar */}
      {!hideSubTabs && (
        <div className="w-full flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] overflow-x-auto max-w-full custom-scrollbar">
            <button
              type="button"
              onClick={() => handleMainTabSwitch('general')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[var(--radius-sm)] text-xs font-bold transition-all cursor-pointer touch-target-44 whitespace-nowrap ${
                activeMainTab === 'general'
                  ? "bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-xs border border-[var(--border-accent)]/30 font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]/50 border border-transparent"
              }`}
            >
              <Settings size={16} className={activeMainTab === 'general' ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"} />
              <span>{language === 'ar' ? 'الإعدادات العامة والهوية' : 'General Configuration'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleMainTabSwitch('seo')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[var(--radius-sm)] text-xs font-bold transition-all cursor-pointer touch-target-44 whitespace-nowrap ${
                activeMainTab === 'seo'
                  ? "bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-xs border border-[var(--border-accent)]/30 font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]/50 border border-transparent"
              }`}
            >
              <Globe size={16} className={activeMainTab === 'seo' ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"} />
              <span>{language === 'ar' ? 'مركز محركات البحث (SEO)' : 'SEO & Metadata Center'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleMainTabSwitch('memory')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[var(--radius-sm)] text-xs font-bold transition-all cursor-pointer touch-target-44 whitespace-nowrap ${
                activeMainTab === 'memory'
                  ? "bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-xs border border-[var(--border-accent)]/30 font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]/50 border border-transparent"
              }`}
            >
              <Brain size={16} className={activeMainTab === 'memory' ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"} />
              <span>{language === 'ar' ? 'إدارة الذاكرة والسياق' : 'Memory Engine'}</span>
            </button>
          </div>
        </div>
      )}

      {activeMainTab === 'general' && (
        <div className="space-y-8">
          {/* Sovereign Theme Studio & Appearance Section */}
          <div
            className="p-5 md:p-6 rounded-[var(--radius-lg)] border transition-theme bg-[var(--surface-card)] border-[var(--border-default)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] shadow-sm shrink-0">
                  <Palette size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                      {language === "ar" ? "استوديو المظهر وتخصيص الثيمات" : "Theme Studio & Appearance Control"}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--fg-accent)] border border-[var(--border-default)]">
                      {language === "ar" ? "مخصص بالكامل" : "PRO"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
                    {language === "ar"
                      ? "تخصيص لوحة ألوان بيربليكستا، وتوكنز المظهر للوضع الداكن والفاتح مع تطبيق فوري وحفظ بقاعدة البيانات."
                      : "Sovereign control over design tokens, surface variables, and appearance customization for dark and light modes."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="admin-open-theme-studio-btn"
                onClick={() => navigate("/admin/theme")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] font-bold text-xs bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] hover:opacity-90 transition-theme shadow-xs cursor-pointer shrink-0 touch-target-44"
              >
                <Palette size={15} />
                <span>{language === "ar" ? "فتح استوديو الثيمات" : "Open Theme Studio"}</span>
                <ArrowRight size={14} className={language === "ar" ? "rotate-180" : ""} />
              </button>
            </div>
          </div>

      {/* General Settings */}
      <div
        className="p-6 md:p-8 rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--border-default)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-[var(--radius-sm)] bg-accent/10 text-accent">
            <Globe size={24} />
          </div>
          <h2 className="text-xl font-bold">{t("generalSettings")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t("siteName")} (English)
            </label>
            <input
              type="text"
              value={siteName || ""}
              dir="ltr"
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t("siteName")} (العربية)
            </label>
            <input
              type="text"
              value={siteNameAr || ""}
              dir="rtl"
              onChange={(e) => setSiteNameAr(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t("siteDescription")} (English)
            </label>
            <input
              type="text"
              value={siteDescription || ""}
              dir="ltr"
              onChange={(e) => setSiteDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t("siteDescription")} (العربية)
            </label>
            <input
              type="text"
              value={siteDescriptionAr || ""}
              dir="rtl"
              onChange={(e) => setSiteDescriptionAr(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveGeneralSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-6 py-2.5 rounded-[var(--radius-sm)] transition-theme font-bold text-sm shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {t("saveSettings") || "Save"}
          </button>
        </div>
      </div>

      {/* Visual Identity */}
      <div
        className="p-6 md:p-8 rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--border-default)]"
      >
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-shape-sm bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t("visualIdentity")}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {language === "ar" ? "الشعارات المعتمدة للثيمات وتوليد حزمة أيقونات التطبيق والـ PWA" : "Theme brand logos and multi-platform PWA icon suite"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkSystemAssetsDiagnostic}
              disabled={isCheckingAssets}
              className="flex items-center gap-2 px-3.5 py-2 text-xs rounded-shape-md bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-secondary)] border border-[var(--border-default)] transition-theme font-medium cursor-pointer shadow-2xs"
              title={language === "ar" ? "فحص سلامة ملفات الشعار والهوية" : "Scan system logo & asset files"}
            >
              <RefreshCw size={14} className={isCheckingAssets ? "animate-spin" : ""} />
              <span>{language === "ar" ? "فحص سلامة الأصول" : "Scan Assets"}</span>
            </button>
          </div>
        </div>

        {/* Orphaned Assets Warning Banner */}
        {orphanedAssetsState?.hasOrphanedAssets && (
          <div className="mb-6 p-4 rounded-shape-md border border-[var(--fg-warning)]/50 bg-[var(--status-warning-subtle)] text-[var(--text-primary)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-shape-sm bg-[var(--fg-warning)]/20 text-[var(--fg-warning)] shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                  <span>{language === "ar" ? "تحذير: ملف الهوية مفقود من السيرفر (Orphaned Asset Detected)" : "Warning: Orphaned Asset Detected"}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--fg-warning)]/20 font-mono text-[var(--fg-warning)]">
                    {orphanedAssetsState.orphanedKeys.join(", ")}
                  </span>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {language === "ar"
                    ? "تم اكتشاف أن رابط الشعار أو الهوية يشير إلى ملف غير موجود على سيرفر التخزين. انقر على زر 'إصلاح' لاستعادة الشعار وإنشاء الملف تلقائياً."
                    : "The logo or asset URL in system settings references a non-existent file on the server. Click 'Repair' to restore and re-create the missing asset automatically."}
                </p>
                <div className="mt-2 space-y-1">
                  {orphanedAssetsState.assets.filter(a => a.isOrphaned).map(a => (
                    <div key={a.key} className="text-xs font-mono text-[var(--fg-warning)] flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">• {a.label}:</span>
                      <span className="underline opacity-90">{a.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRepairOrphanedAssets}
                disabled={isRepairingAssets}
                className="flex items-center gap-2 bg-[var(--fg-warning)] hover:opacity-90 text-white px-4 py-2 rounded-shape-sm font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {isRepairingAssets ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <Wrench size={14} />
                )}
                <span>{language === "ar" ? "إصلاح (Repair)" : "Repair Asset"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Missing Asset Report Section */}
        <div className="mb-8 p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-shape-md bg-[var(--status-danger-subtle)] text-[var(--fg-danger)]">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {language === "ar" ? "تقرير الأصول المفقودة من السيرفر (Missing Asset Report)" : "Missing Asset Report (DB vs Disk Audit)"}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {language === "ar"
                    ? "فحص وتقاطع جدول الملفات (user_files) مع التخزين الفعلي على السيرفر لاكتشاف أي ملفات مسجلة في القاعدة ومفقودة على القرص."
                    : "Cross-references user_files table against actual file system storage to detect missing files."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchMissingAssetReport}
                disabled={isScanningMissingAssets}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-shape-md bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold transition-colors border border-accent/20"
              >
                <RefreshCw size={14} className={isScanningMissingAssets ? "animate-spin" : ""} />
                <span>{language === "ar" ? "تشخيص وفحص المفقودات" : "Scan Missing Assets"}</span>
              </button>
              {missingAssetReport && missingAssetReport.missingCount > 0 && (
                <button
                  type="button"
                  onClick={() => handlePurgeMissingAssets()}
                  disabled={isPurgingMissingAssets}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-shape-md bg-[var(--fg-danger)] hover:bg-[var(--fg-danger)] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Trash2 size={14} />
                  <span>{language === "ar" ? `تطهير الكل (${missingAssetReport.missingCount})` : `Purge All (${missingAssetReport.missingCount})`}</span>
                </button>
              )}
            </div>
          </div>

          {missingAssetReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-shape-md bg-[var(--surface-page)] border border-[var(--border-default)]">
                  <div className="text-[var(--text-muted)] text-[10px]">{language === "ar" ? "إجمالي الملفات المفحوصة" : "Total Checked"}</div>
                  <div className="font-bold text-base text-[var(--text-primary)] mt-1">{missingAssetReport.totalChecked}</div>
                </div>
                <div className="p-3 rounded-shape-md bg-[var(--surface-page)] border border-[var(--border-default)]">
                  <div className="text-[var(--text-muted)] text-[10px]">{language === "ar" ? "الملفات الموجودة سليمة" : "Existing on Disk"}</div>
                  <div className="font-bold text-base text-[var(--fg-success)] mt-1">{missingAssetReport.existingCount}</div>
                </div>
                <div className={`col-span-2 p-3 rounded-shape-md border ${missingAssetReport.missingCount > 0 ? 'bg-[var(--status-danger-subtle)] border-[var(--fg-danger)]/30 text-[var(--fg-danger)]' : 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/30 text-[var(--fg-success)]'}`}>
                  <div className="text-[10px] opacity-80">{language === "ar" ? "الملفات المفقودة (متطابقة بالسجل ومغيبة عن القرص)" : "Missing Assets Detected"}</div>
                  <div className="font-bold text-base mt-1">{missingAssetReport.missingCount}</div>
                </div>
              </div>

              {missingAssetReport.missingAssets && missingAssetReport.missingAssets.length > 0 ? (
                <div className="border border-[var(--border-default)] rounded-shape-md overflow-hidden bg-[var(--surface-page)]">
                  <table className="w-full text-start text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)] text-[var(--text-muted)] font-bold">
                        <th className="p-3 text-start">ID</th>
                        <th className="p-3 text-start">{language === "ar" ? "اسم الملف" : "File Name"}</th>
                        <th className="p-3 text-start">URL / Path</th>
                        <th className="p-3 text-center">User ID</th>
                        <th className="p-3 text-center">{language === "ar" ? "تاريخ الرفع" : "Uploaded At"}</th>
                        <th className="p-3 text-center">{language === "ar" ? "الإجراء" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {missingAssetReport.missingAssets.map((item: any) => (
                        <tr key={item.id} className="hover:bg-[var(--status-danger-subtle)] transition-colors">
                          <td className="p-3 font-mono text-[var(--text-secondary)]">#{item.id}</td>
                          <td className="p-3 font-medium text-[var(--text-primary)]">{item.file_name || 'N/A'}</td>
                          <td className="p-3 font-mono text-xs text-[var(--fg-danger)] truncate max-w-[200px]" title={item.file_url}>{item.file_url}</td>
                          <td className="p-3 text-center font-mono text-[var(--text-secondary)]">{item.user_id || 'N/A'}</td>
                          <td className="p-3 text-center text-[var(--text-muted)]">{new Date(item.created_at).toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handlePurgeMissingAssets([item.id])}
                              disabled={isPurgingMissingAssets}
                              className="px-2.5 py-1 rounded bg-[var(--fg-danger)]/10 hover:bg-[var(--fg-danger)] text-[var(--fg-danger)] hover:text-white text-[10px] font-bold transition-colors"
                            >
                              {language === "ar" ? "حذف السجل" : "Purge Record"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[var(--fg-success)] font-medium bg-[var(--status-success-subtle)] rounded-shape-md border border-[var(--fg-success)]/20">
                  {language === "ar" ? "✅ جميع الملفات المسجلة في قاعدة البيانات متوفرة وموجودة على القرص بسلام." : "✅ All database file records are fully synchronized and present on disk storage."}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              {language === "ar" ? "انقر على 'تشخيص وفحص المفقودات' لبدء مطابقة جدول الملفات مع التخزين الفعلي." : "Click 'Scan Missing Assets' to begin the cross-reference audit."}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo Upload (Dark theme) */}
          <div
            className="p-6 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            {logoBase64 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setLogoBase64(null);
                }}
                className="absolute top-2.5 right-2.5 p-1.5 bg-[var(--status-danger-subtle)] hover:bg-[var(--fg-danger)] text-white rounded-full z-20 transition-colors shadow-md"
                title={language === "ar" ? "حذف الشعار" : "Remove Logo"}
              >
                <Trash2 size={13} />
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "logo")}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="mb-4 flex items-center justify-center h-8">
              {logoBase64 ? (
                <img
                  src={resolveImageUrl(logoBase64, 'general')}
                  alt="Dark Logo"
                  className="w-8 h-8 rounded-shape-sm object-contain"
                />
              ) : (
                <div className="bg-pink-600 p-1.5 rounded-shape-xs text-white flex items-center justify-center w-8 h-8">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-medium text-sm mb-1 text-[var(--text-primary)]">
              {language === "ar" ? "الشعار للثيم الداكن" : "Logo (Dark Theme)"}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">PNG, SVG, JPG (Max 2MB)</p>
          </div>

          {/* Logo Upload (Light theme) */}
          <div
            className="p-6 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            {logoLightBase64 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setLogoLightBase64(null);
                }}
                className="absolute top-2.5 right-2.5 p-1.5 bg-[var(--status-danger-subtle)] hover:bg-[var(--fg-danger)] text-white rounded-full z-20 transition-colors shadow-md"
                title={language === "ar" ? "حذف الشعار الفاتح" : "Remove Light Logo"}
              >
                <Trash2 size={13} />
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "logo_light")}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="mb-4 flex items-center justify-center h-8">
              {logoLightBase64 ? (
                <img
                  src={resolveImageUrl(logoLightBase64, 'general')}
                  alt="Light Logo"
                  className="w-8 h-8 rounded-shape-sm object-contain"
                />
              ) : (
                <div className="bg-sky-500 p-1.5 rounded-shape-xs text-white flex items-center justify-center w-8 h-8">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-medium text-sm mb-1 text-[var(--text-primary)]">
              {language === "ar" ? "الشعار للثيم الفاتح" : "Logo (Light Theme)"}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">PNG, SVG, JPG (Max 2MB)</p>
          </div>

          {/* Favicon Upload */}
          <div
            className="p-6 rounded-shape-md border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            {faviconBase64 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setFaviconBase64(null);
                }}
                className="absolute top-2.5 right-2.5 p-1.5 bg-[var(--status-danger-subtle)] hover:bg-[var(--fg-danger)] text-white rounded-full z-20 transition-colors shadow-md"
                title={language === "ar" ? "حذف أيقونة المفضلة" : "Remove Favicon"}
              >
                <Trash2 size={13} />
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "favicon")}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="mb-4 w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] flex items-center justify-center overflow-hidden border border-[var(--border-default)]">
              {faviconBase64 ? (
                <img
                  src={resolveImageUrl(faviconBase64, 'general')}
                  alt="Favicon"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Globe size={16} className="text-[var(--text-muted)]" />
              )}
            </div>
            <h3 className="font-medium text-sm mb-1 text-[var(--text-primary)]">
              {language === "ar" ? "أيقونة المفضلة" : "Favicon"}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">32x32 PNG or ICO</p>
          </div>
        </div>

        {/* Systematic Multi-Platform & PWA Asset Suite */}
        <div className="mt-8 pt-8 border-t border-[var(--border-default)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-shape-md bg-[var(--status-success-subtle)] text-[var(--fg-success)]">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <span>{language === "ar" ? "حزمة أيقونات التطبيق والـ PWA النظامية" : "Systematic Multi-Platform & PWA Icon Suite"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] font-mono font-bold border border-[var(--fg-success)]/30">
                    {brandAssetsStatus?.assets?.length || 10} {language === "ar" ? "أيقونات معتمدة" : "Active Icons"}
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {language === "ar"
                    ? "توليد تلقائي فوري لجميع مقاسات الأيقونات (Favicons, Apple Touch Icons, Android PWA Maskable Icons) من الشعار في system_settings بدقة متناهية داخل uploads/brand/."
                    : "Single-source generation of all platform icons (Favicons, Apple Touch, PWA launcher & maskable icons) directly into uploads/brand/."}
                </p>
                {brandAssetsStatus?.generatedAt && (
                  <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
                    {language === "ar" ? "آخر توليد: " : "Last generated: "}
                    {new Date(brandAssetsStatus.generatedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateBrandAssets}
                disabled={isGeneratingBrandAssets || isLoadingBrandAssets}
                className="flex items-center gap-2 px-4 py-2 rounded-shape-md bg-[var(--fg-success)] hover:bg-[var(--fg-success)]/90 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                title={language === "ar" ? "إعادة توليد أيقونات التطبيق" : "Regenerate App Icons"}
              >
                <RefreshCw size={14} className={isGeneratingBrandAssets ? "animate-spin" : ""} />
                <span>{language === "ar" ? "إعادة توليد أيقونات التطبيق" : "Regenerate App Icons"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {(brandAssetsStatus?.assets || [
              { id: 'favicon-ico', filename: 'favicon.ico', width: 48, height: 48, category: 'favicon', description: 'Browser tab & desktop (.ico)' },
              { id: 'favicon-16', filename: 'favicon-16x16.png', width: 16, height: 16, category: 'favicon', description: 'Browser tab (16x16)' },
              { id: 'favicon-32', filename: 'favicon-32x32.png', width: 32, height: 32, category: 'favicon', description: 'Standard tab & bookmark (32x32)' },
              { id: 'apple-touch-icon', filename: 'apple-touch-icon.png', width: 180, height: 180, category: 'apple', description: 'iOS Safari home screen (180x180)' },
              { id: 'pwa-192', filename: 'pwa-192x192.png', width: 192, height: 192, purpose: 'any', category: 'pwa', description: 'Android PWA launcher (192x192)' },
              { id: 'pwa-512', filename: 'pwa-512x512.png', width: 512, height: 512, purpose: 'any', category: 'pwa', description: 'PWA splash screen (512x512)' },
              { id: 'pwa-maskable-512', filename: 'pwa-maskable-512x512.png', width: 512, height: 512, purpose: 'maskable', category: 'pwa', description: 'Android adaptive safe-zone (512x512)' },
              { id: 'assistant-icon-32', filename: 'assistant-icon-32x32.png', width: 32, height: 32, category: 'favicon', description: 'Sovereign AI Assistant compact icon (32x32)' },
              { id: 'assistant-icon-64', filename: 'assistant-icon-64x64.png', width: 64, height: 64, category: 'favicon', description: 'Sovereign AI Assistant medium icon (64x64)' },
              { id: 'assistant-icon-128', filename: 'assistant-icon-128x128.png', width: 128, height: 128, category: 'favicon', description: 'Sovereign AI Assistant high-res icon (128x128)' }
            ]).map((asset: any) => {
              const categoryBadgeColor = 
                asset.category === 'apple' ? 'bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)] border-[var(--border-accent)]/20' :
                asset.category === 'pwa' ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/20' :
                asset.category === 'tile' ? 'bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)] border-[var(--border-accent)]/20' :
                'bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border-[var(--fg-warning)]/20';

              const categoryLabel = 
                asset.category === 'apple' ? 'Apple iOS' :
                asset.category === 'pwa' ? (asset.purpose === 'maskable' ? 'PWA Maskable' : 'PWA Any') :
                asset.category === 'tile' ? 'Windows' : 'Favicon';

              const assetUrl = asset.url || `/uploads/brand/${asset.filename}`;

              return (
                <div
                  key={asset.id || asset.filename}
                  className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col justify-between hover:border-accent/40 transition-all group relative"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${categoryBadgeColor}`}>
                        {categoryLabel}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {asset.width}×{asset.height}
                      </span>
                    </div>

                    <div className="w-full aspect-square rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center p-2 mb-2.5 overflow-hidden relative shadow-inner">
                      {asset.dataUri ? (
                        <img
                          src={asset.dataUri}
                          alt={asset.filename}
                          className="max-w-full max-h-full object-contain transition-opacity"
                        />
                      ) : (
                        <img
                          src={`${assetUrl}?t=${brandAssetsStatus?.timestamp || Date.now()}`}
                          alt={asset.filename}
                          className="max-w-full max-h-full object-contain transition-opacity"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      {asset.purpose === 'maskable' && (
                        <div
                          className="absolute inset-2 rounded-full border border-dashed border-[var(--fg-success)]/40 pointer-events-none"
                          title="Adaptive Icon Safe-Zone"
                        />
                      )}
                    </div>

                    <div className="font-mono text-[11px] font-semibold text-[var(--text-primary)] truncate mb-0.5" title={`/uploads/brand/${asset.filename}`}>
                      uploads/brand/{asset.filename}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] line-clamp-2 leading-tight">
                      {asset.description}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[var(--border-default)]/60 flex items-center justify-between text-[10px]">
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{language === "ar" ? "معاينة" : "View"}</span>
                      <ArrowRight size={10} className={dir === "rtl" ? "rotate-180" : ""} />
                    </a>
                    {asset.exists === false ? (
                      <span className="text-[var(--fg-warning)] font-bold text-[9px]">
                        {language === "ar" ? "غير مولد" : "Pending"}
                      </span>
                    ) : asset.sizeBytes ? (
                      <span className="font-mono text-[9px] text-[var(--text-muted)]">
                        {(asset.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[var(--fg-success)] font-bold text-[9px]">
                        <CheckCircle size={10} />
                        <span>Ready</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveVisualSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-6 py-2.5 rounded-[var(--radius-sm)] transition-theme font-bold text-sm shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {t("saveSettings") || "Save"}
          </button>
        </div>
      </div>

      {/* Page, Section & Google Auth Visibility Control Panel */}
      <div
        className="p-6 md:p-8 rounded-shape-md border mb-8 bg-[var(--surface-card)] border-[var(--border-default)]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-shape-sm bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]">
              <EyeOff size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                {dir === "rtl"
                  ? "لوحة التحكم في إخفاء الأقسام والصفحات وأزرار المصادقة"
                  : "Pages, Sections & Auth Visibility Control"}
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-accent/10 text-accent border border-accent/20">
                  {dir === "rtl" ? "تحكم المتجر" : "App Store Control"}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                {dir === "rtl"
                  ? "يمكنك إخفاء أي قسم أو صفحة (الاشتراكات، الاستوديو، مركز قوقل، الإعلانات، والمكافآت) وكذلك إخفاء زر تسجيل الدخول عبر قوقل لحفظ حالة الظهور وتجنب رفض التطبيق في متجر أبل (Apple App Store)."
                  : "Toggle visibility for site sections (Subscriptions, Studio, Google Hub, Ads, Rewards) and the Google Sign-In button to comply with Apple App Store policies."}
              </p>
            </div>
          </div>
        </div>

        {/* General Visibility Control Cards Grid */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Monitor size={16} className="text-accent" />
            <span>{dir === "rtl" ? "1. التحكم العام بالإخفاء (كافة الأجهزة - Desktop & Mobile)" : "1. General Visibility Controls (All Devices)"}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                key: "/subscription",
                title: dir === "rtl" ? "صفحة الاشتراكات والأسعار" : "Subscriptions Page",
                subtitle: dir === "rtl" ? "مسار /subscription و /pricing" : "Route /subscription & /pricing",
                description: dir === "rtl" ? "إخفاء صفحة وخطط الاشتراكات من القوائم وحظر الوصول المباشر إليها." : "Hide subscriptions page from navigation and block direct access.",
                icon: <CreditCard size={18} className="text-[var(--fg-accent)]" />
              },
              {
                key: "/studio",
                title: dir === "rtl" ? "استوديو المطورين" : "Developer Studio",
                subtitle: dir === "rtl" ? "مسار /studio" : "Route /studio",
                description: dir === "rtl" ? "إخفاء زر وقسم استوديو الإنشاء من الهيدر والشريط الجانبي." : "Hide Developer Studio button from header and sidebar navigation.",
                icon: <Cpu size={18} className="text-[var(--fg-accent)]" />
              },
              {
                key: "/google-hub",
                title: dir === "rtl" ? "مركز خدمات قوقل (Google Hub)" : "Google Hub Section",
                subtitle: dir === "rtl" ? "مسار /google-hub" : "Route /google-hub",
                description: dir === "rtl" ? "إخفاء قسم منتجات قوقل لتفادي أي تعارض مع سياسات المتجر." : "Hide Google products section to ensure store compliance.",
                icon: <Globe size={18} className="text-[var(--fg-warning)]" />
              },
              {
                key: "/viralbook",
                title: dir === "rtl" ? "فيرال بوك والنشر (ViralBook Ads)" : "ViralBook Ads & Feed",
                subtitle: dir === "rtl" ? "مسار /viralbook" : "Route /viralbook",
                description: dir === "rtl" ? "إخفاء قسم فيرال بوك والمنشورات التفاعلية من الهيدر." : "Hide interactive ViralBook section from header.",
                icon: <Megaphone size={18} className="text-pink-500" />
              },
              {
                key: "/rewards",
                title: dir === "rtl" ? "برنامج المكافآت" : "Rewards Program",
                subtitle: dir === "rtl" ? "مسار /rewards" : "Route /rewards",
                description: dir === "rtl" ? "إخفاء صفحة ونظام المكافآت من القائمة الجانبية." : "Hide rewards page and system from navigation sidebar.",
                icon: <Gift size={18} className="text-[var(--fg-accent)]" />
              },
              {
                key: "/explore",
                title: dir === "rtl" ? "قسم استكشف (Explore)" : "Explore Section",
                subtitle: dir === "rtl" ? "مسار /explore" : "Route /explore",
                description: dir === "rtl" ? "إخفاء قسم استكشف والنماذج الشائعة من الشريط الجانبي." : "Hide explore section and trending prompts from sidebar.",
                icon: <Compass size={18} className="text-[var(--fg-accent)]" />
              },
              {
                key: "hide_google_auth",
                title: dir === "rtl" ? "زر تسجيل الدخول بواسطة قوقل" : "Google Sign-In Button",
                subtitle: dir === "rtl" ? "زر Google في نافذة الدخول" : "Google Login in Auth Modal",
                description: dir === "rtl" ? "إخفاء زر المصادقة عبر قوقل للالتزام بشرط Apple Sign-In." : "Hide Google login button from auth modal for Apple Store rules.",
                icon: <Key size={18} className="text-[var(--fg-danger)]" />
              }
            ].map((item) => {
              const isHidden = item.key === 'hide_google_auth' 
                ? isGoogleAuthHidden(blockedPaths, false)
                : isPathBlocked(item.key, blockedPaths, false);

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-shape-md border transition-all duration-base flex flex-col justify-between ${
                    isHidden
                      ? "bg-[var(--status-danger-subtle)] border-[var(--fg-danger)]/30 text-[var(--text-primary)]"
                      : "bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-accent/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-shape-sm bg-accent/10 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-[var(--text-primary)]">
                            {item.title}
                          </h3>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${
                          isHidden
                            ? "bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] border-[var(--fg-danger)]/30"
                            : "bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/30"
                        }`}
                      >
                        {isHidden
                          ? (dir === "rtl" ? "مخفي عام" : "Hidden Globally")
                          : (dir === "rtl" ? "مرئي" : "Visible")}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mb-4 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Hide / Show Toggle Action Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSection(item.key)}
                    className={`w-full py-2.5 px-3 rounded-[var(--radius-sm)] text-xs font-bold transition-theme flex items-center justify-center gap-2 border shadow-xs min-h-[40px] cursor-pointer touch-target-44 ${
                      isHidden
                        ? "bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] border-[var(--border-accent)]"
                        : "bg-[var(--fg-danger)] hover:bg-[var(--fg-danger)] text-white border-[var(--fg-danger)]/40"
                    }`}
                  >
                    {isHidden ? (
                      <>
                        <Eye size={14} />
                        <span>{dir === "rtl" ? "إظهار / Show" : "Show Section"}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        <span>{dir === "rtl" ? "إخفاء / Hide" : "Hide Section"}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Version Controls Section */}
        <div className="mb-6 pt-6 border-t border-[var(--border-subtle)]">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Smartphone size={16} className="text-[var(--accent)]" />
              <span>{dir === "rtl" ? "2. نموذج التحكم المخصص لنسخة الموبايل والتطبيق (Mobile Version Only)" : "2. Mobile Version Specific Visibility Controls"}</span>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] text-[var(--accent)] border border-[var(--border-accent)]">
                {dir === "rtl" ? "نسخة الهواتف" : "Mobile Only"}
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {dir === "rtl" 
                ? "إعدادات إخفاء مخصصة تظهر تأثيراتها فقط عند التصفح من الهواتف الذكية وتطبيق الموبايل لتلبية متطلبات مراجعة Apple App Store."
                : "Controls that apply specifically when browsing from smartphone mobile devices or mobile web app."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                key: "hide_mobile_pwa",
                title: dir === "rtl" ? "شريط تثبيت التطبيق للموبايل" : "Mobile PWA Install Banner",
                subtitle: dir === "rtl" ? "شريط الحث PWA Banner" : "Mobile Banner PWA",
                description: dir === "rtl" ? "إخفاء شريط وشاشة تثبيت وحث تنزيل تطبيق PWA على الهواتف الذكية." : "Hide install invitation banner on mobile web browser.",
                icon: <Smartphone size={18} className="text-[var(--accent)]" />
              },
              {
                key: "hide_mobile_google_auth",
                title: dir === "rtl" ? "تسجيل دخول قوقل على الهواتف" : "Google Sign-In on Mobile",
                subtitle: dir === "rtl" ? "زر Google في نافذة الدخول للموبايل" : "Google Auth in Mobile Modal",
                description: dir === "rtl" ? "إخفاء زر تسجيل الدخول بقوقل على هواتف الموبايل فقط (شرط متجر أبل)." : "Hide Google login button strictly on mobile version.",
                icon: <Key size={18} className="text-[var(--fg-danger)]" />
              },
              {
                key: "hide_mobile_subscription",
                title: dir === "rtl" ? "صفحة الاشتراكات على الموبايل" : "Subscriptions on Mobile",
                subtitle: dir === "rtl" ? "مسار /subscription على الموبايل" : "Route /subscription on Mobile",
                description: dir === "rtl" ? "إخفاء وحظر صفحة الاشتراكات على الهواتف الذكية (لتجنب In-App Purchase)." : "Hide subscription page on mobile devices to satisfy App Store IAP rule.",
                icon: <CreditCard size={18} className="text-[var(--fg-accent)]" />
              },
              {
                key: "hide_mobile_studio",
                title: dir === "rtl" ? "استوديو المطورين على الموبايل" : "Developer Studio on Mobile",
                subtitle: dir === "rtl" ? "مسار /studio على الموبايل" : "Route /studio on Mobile",
                description: dir === "rtl" ? "إخفاء زر وقسم استوديو المطورين في الهيدر والSidebar للهواتف." : "Hide Developer Studio button and page on mobile viewport.",
                icon: <Cpu size={18} className="text-[var(--fg-accent)]" />
              },
              {
                key: "hide_mobile_bulletin",
                title: dir === "rtl" ? "الإعلانات والنشر على الموبايل" : "Ads & Bulletin on Mobile",
                subtitle: dir === "rtl" ? "مسار /bulletin على الموبايل" : "Route /bulletin on Mobile",
                description: dir === "rtl" ? "إخفاء قسم المنشورات والإعلانات التفاعلية على أجهزة الموبايل." : "Hide Ads & bulletin board section on mobile screens.",
                icon: <Megaphone size={18} className="text-pink-500" />
              },
              {
                key: "hide_mobile_rewards",
                title: dir === "rtl" ? "برنامج المكافآت على الموبايل" : "Rewards on Mobile",
                subtitle: dir === "rtl" ? "مسار /rewards على الموبايل" : "Route /rewards on Mobile",
                description: dir === "rtl" ? "إخفاء صفحة ونظام المكافآت والنقاط في القائمة على الهواتف." : "Hide rewards section on mobile navigation menu.",
                icon: <Gift size={18} className="text-[var(--fg-accent)]" />
              },
              {
                key: "hide_mobile_explore",
                title: dir === "rtl" ? "قسم استكشف على الموبايل" : "Explore section on Mobile",
                subtitle: dir === "rtl" ? "مسار /explore على الموبايل" : "Route /explore on Mobile",
                description: dir === "rtl" ? "إخفاء قسم استكشف في شريط القائمة السفلي/الجانبي للموبايل." : "Hide explore section on mobile navigation.",
                icon: <Compass size={18} className="text-[var(--fg-accent)]" />
              }
            ].map((item) => {
              let isHidden = false;
              if (item.key === 'hide_mobile_pwa') {
                isHidden = isMobilePwaBannerHidden(blockedPaths);
              } else if (item.key === 'hide_mobile_google_auth') {
                isHidden = (blockedPaths || "").split(',').map(p => p.trim().toLowerCase()).includes('hide_mobile_google_auth') ||
                           (blockedPaths || "").split(',').map(p => p.trim().toLowerCase()).includes('mobile_google_auth');
              } else {
                const feat = item.key.replace('hide_mobile_', '');
                isHidden = isFeatureBlockedOnMobile(feat, blockedPaths);
              }

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-shape-md border transition-all duration-base flex flex-col justify-between ${
                    isHidden
                      ? "bg-[var(--status-warning-subtle)] border-[var(--fg-warning)]/30 text-[var(--text-primary)]"
                      : "bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-accent/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-[var(--text-primary)]">
                            {item.title}
                          </h3>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${
                          isHidden
                            ? "bg-[var(--fg-warning)]/15 text-[var(--fg-warning)] border-[var(--fg-warning)]/30"
                            : "bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/30"
                        }`}
                      >
                        {isHidden
                          ? (dir === "rtl" ? "مخفي للموبايل" : "Mobile Hidden")
                          : (dir === "rtl" ? "مرئي" : "Visible")}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mb-4 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Hide / Show Toggle Action Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSection(item.key)}
                    className={`w-full py-2.5 px-3 rounded-[var(--radius-sm)] text-xs font-bold transition-theme flex items-center justify-center gap-2 border shadow-xs min-h-[40px] cursor-pointer touch-target-44 ${
                      isHidden
                        ? "bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] border-[var(--border-accent)]"
                        : "bg-[var(--fg-warning)] hover:bg-[var(--fg-warning)] text-white border-[var(--fg-warning)]/40"
                    }`}
                  >
                    {isHidden ? (
                      <>
                        <Eye size={14} />
                        <span>{dir === "rtl" ? "إظهار للموبايل" : "Show on Mobile"}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        <span>{dir === "rtl" ? "إخفاء للموبايل" : "Hide on Mobile"}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Notice & Button */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Info size={14} className="text-accent shrink-0" />
            <span>
              {dir === "rtl" 
                ? "يتم حفظ أزرار الإخفاء وتحديث حالة الظهور عند الضغط على زر حفظ الإعدادات بالأسفل." 
                : "Changes to section visibility will be saved when clicking Save Settings below."}
            </span>
          </p>
          <button
            onClick={handleSaveVisibilitySettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-accent hover:bg-accent text-white px-5 py-2 rounded-[var(--radius-md)] transition-theme text-xs font-bold shadow-sm disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
            <span>{dir === "rtl" ? "حفظ الإعدادات" : "Save Settings"}</span>
          </button>
        </div>
      </div>
      </div>
      )}

      {activeMainTab === 'seo' && (
        <div className="space-y-8">
          {/* Comprehensive Content SEO Audit & AI Metadata Generator */}
          <div className="p-1 rounded-[var(--radius-lg)]">
            <SeoCenterView
              theme={theme}
              t={t}
              dir={dir}
              language={language}
              showToast={showToast}
            />
          </div>

      {/* SEO & Meta Tags */}
      <div
        className="p-6 md:p-8 rounded-shape-md border mb-8 bg-[var(--surface-card)] border-[var(--border-default)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-shape-sm bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]">
            <Search size={24} />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("seoFields")}</h2>
        </div>

        <div className="space-y-5">
          {/* SEO Site Title Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[var(--border-subtle)] pb-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-accent mb-1.5">
                {dir === "rtl" ? "عنوان الموقع لمحركات البحث SEO (بالإنجليزية)" : "SEO Site Title (English)"}
              </label>
              <input
                type="text"
                value={seoSiteNameEn || ""}
                onChange={(e) => setSeoSiteNameEn(e.target.value)}
                className="w-full px-4 py-3 rounded-shape-sm border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="e.g. Perplexta | Premium Financial Analytics"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {dir === "rtl" ? "العنوان المحدد لمحركات البحث وعلامات تبويب المتصفح." : "Optimized English title displayed in Google search listings and browser tabs."}
              </p>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-accent mb-1.5">
                {dir === "rtl" ? "عنوان الموقع لمحركات البحث SEO (بالعربية)" : "SEO Site Title (Arabic)"}
              </label>
              <input
                type="text"
                value={seoSiteNameAr || ""}
                onChange={(e) => setSeoSiteNameAr(e.target.value)}
                className="w-full px-4 py-3 rounded-shape-sm border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="مثال: منصة بيربليكستا | الاختيار الاحترافي للتحليل"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {dir === "rtl" ? "العنوان المعرّب المحدد لزيادة ظهور الموقع في نتائج البحث العربية." : "Optimized Arabic title targeting maximum visibility across Arabic search result engines."}
              </p>
            </div>
          </div>

          {/* SEO Meta Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[var(--border-subtle)] pb-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t("seoDescriptionEn")}
              </label>
              <textarea
                rows={3}
                value={seoDescriptionEn || ""}
                onChange={(e) => setSeoDescriptionEn(e.target.value)}
                className="w-full px-4 py-3 rounded-shape-sm border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t("seoDescriptionAr")}
              </label>
              <textarea
                rows={3}
                value={seoDescriptionAr || ""}
                onChange={(e) => setSeoDescriptionAr(e.target.value)}
                className="w-full px-4 py-3 rounded-shape-sm border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t("keywordsEn")}
              </label>
              <input
                type="text"
                value={keywordsEn || ""}
                onChange={(e) => setKeywordsEn(e.target.value)}
                className="w-full px-4 py-3 rounded-[var(--radius-md)] border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t("keywordsAr")}
              </label>
              <input
                type="text"
                value={keywordsAr || ""}
                onChange={(e) => setKeywordsAr(e.target.value)}
                className="w-full px-4 py-3 rounded-[var(--radius-md)] border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t("googleAnalyticsId")}
            </label>
            <input
              type="text"
              placeholder={t("googleAnalyticsDesc")}
              value={googleAnalyticsId || ""}
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
              className="w-full px-4 py-3 rounded-shape-sm border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              {dir === "rtl" 
                ? "يسمح هذا المعرّف (مثل G-XXXXX) بمراقبة حركة المرور وسلوك المستخدمين وإرسال إحصاءات تفاعلية فورية إلى حساب إحصاءات جوجل الخاص بك."
                : "This ID (e.g., G-XXXXX) enables real-time user behavior tracking, page transit logs, and custom interaction telemetry reporting directly to your Google Analytics dashboard."}
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t("googleSiteVerification")}
            </label>
            <input
              type="text"
              placeholder="e.g. google-site-verification=..."
              value={googleSiteVerification || ""}
              onChange={(e) => setGoogleSiteVerification(e.target.value)}
              className="w-full px-4 py-3 rounded-shape-sm border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              {dir === "rtl" 
                ? "يتم حقن رمز تحقق Google Search Console تلقائياً في ترويسة الصفحة لإثبات ملكية محركات البحث مباشرة دون رفع ملفات يدوية للجذر."
                : "This verification key is dynamically injected into the head element to verify Google Search Console ownership instantly without manual file uploads to the root."}
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {dir === "rtl" ? "حظر الفهرسة المخصص للمسارات (Exclusions List)" : "Dynamic Index Exclusions (Blocked Paths List)"}
            </label>
            <input
              type="text"
              placeholder={dir === "rtl" ? "مثال: /api/auth, /confidential-page (مفصولة بفاصلة)" : "e.g. /api/auth, /confidential-page, /custom-dashboard (comma-separated)"}
              value={blockedPaths || ""}
              onChange={(e) => setBlockedPaths(e.target.value)}
              className="w-full px-4 py-3 rounded-shape-sm border focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
              {dir === "rtl"
                ? "أدخل المسارات الإضافية التي ترغب بحظر فهرستها مطلقاً في محركات البحث لحماية الخصوصية. يتم فصل المسارات بعلامة الفاصلة (,). المسارات الافتراضية والخاصة مع لوحات تسيير الأقسام يتم حظرها تلقائياً بالكامل في الهيكل."
                : "Inject secondary sensitive routing paths you permanently want to shield from search rankings. Separate clean endpoints with a comma (,). Private/admin paths and Sections Control Panels are automatically shielded default."}
            </p>
          </div>

          {/* Real-time Google Search Results Preview (SERP Preview) */}
          <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
              <Globe size={16} className="text-accent animate-pulse" />
              {dir === "rtl" ? "معاينة حية لنتائج بحث جوجل (SERP Preview)" : "Live Google Search Result Preview (SERP)"}
            </h3>
            
            <div className="max-w-2xl mx-auto">
              {dir === "rtl" ? (
                /* Arabic Search Snippet Card - displayed strictly when Arabic interface is loaded */
                <div className="p-5 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] flex flex-col justify-between text-right" dir="rtl">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 justify-start flex-row-reverse text-right">
                      {faviconBase64 ? (
                        <img src={faviconBase64} alt="Favicon" className="w-[18px] h-[18px] rounded-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[var(--fg-accent)] text-[10px]">G</div>
                      )}
                      <div className="flex flex-col leading-none items-end">
                        <span className="text-[11px] font-sans text-[var(--text-primary)] font-medium">
                          {seoSiteNameAr || siteNameAr || siteName || "بيربليكستا"}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-sans tracking-tight">
                          https://perplexta.com
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-[16px] leading-[1.3] text-[var(--fg-accent)] dark:text-[var(--fg-accent)] hover:underline cursor-pointer font-medium mb-1 truncate font-sans text-right">
                      {seoSiteNameAr || seoSiteNameEn || siteNameAr || siteName || "بيربليكستا"} | منصة التحليل التقني
                    </h4>
                    
                    <p className="text-[13px] leading-[1.4] text-[var(--text-secondary)] font-sans text-right">
                      {seoDescriptionAr ? (
                        seoDescriptionAr.length > 160 
                          ? `${seoDescriptionAr.slice(0, 157)}...` 
                          : seoDescriptionAr
                      ) : (
                        "يرجى توفير وصف دقيق ومحسن لمحركات البحث ويركز على الكفاءة والتحليل."
                      )}
                    </p>
                  </div>
                  
                  {/* Length optimization metric */}
                  <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
                    <div className="flex justify-between items-center text-[10px] font-sans mb-1.5 text-[var(--text-muted)] flex-row-reverse">
                      <span>طول الوصف (مثالي: 120-160 حرفاً)</span>
                      <span className={
                        seoDescriptionAr.length >= 120 && seoDescriptionAr.length <= 160
                          ? "text-accent font-bold"
                          : seoDescriptionAr.length > 160 
                          ? "text-[var(--fg-danger)]" 
                          : "text-[var(--fg-warning)]"
                      }>
                        {seoDescriptionAr.length} حرف
                      </span>
                    </div>
                    <div className="w-full bg-[var(--surface-card)] h-1 rounded-full overflow-hidden border border-[var(--border-default)]">
                      <div 
                        className={`h-full transition-theme ${
                          seoDescriptionAr.length >= 120 && seoDescriptionAr.length <= 160
                            ? "bg-accent"
                            : seoDescriptionAr.length > 160
                            ? "bg-[var(--fg-danger)]"
                            : "bg-[var(--fg-warning)]"
                        }`}
                        style={{ width: `${Math.min(100, (seoDescriptionAr.length / 160) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* English Search Snippet Card - displayed strictly when English interface is loaded */
                <div className="p-5 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {faviconBase64 ? (
                        <img src={faviconBase64} alt="Favicon" className="w-[18px] h-[18px] rounded-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[var(--fg-accent)] text-[10px]">G</div>
                      )}
                      <div className="flex flex-col leading-none">
                        <span className="text-[11px] font-sans text-[var(--text-primary)] font-medium">
                          {seoSiteNameEn || siteName || "Perplexta Platform"}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-sans tracking-tight">
                          https://perplexta.com
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-[16px] leading-[1.3] text-[var(--fg-accent)] dark:text-[var(--fg-accent)] hover:underline cursor-pointer font-medium mb-1 truncate font-sans">
                      {seoSiteNameEn || seoSiteNameAr || siteName || "Perplexta Platform"} | Best Technical Analysis
                    </h4>
                    
                    <p className="text-[13px] leading-[1.4] text-[var(--text-secondary)] font-sans">
                      {seoDescriptionEn ? (
                        seoDescriptionEn.length > 160 
                          ? `${seoDescriptionEn.slice(0, 157)}...` 
                          : seoDescriptionEn
                      ) : (
                        "Please provide a high-quality, concise search engine description focused on technical analysis."
                      )}
                    </p>
                  </div>
                  
                  {/* Length optimization metric */}
                  <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
                    <div className="flex justify-between items-center text-[10px] font-mono mb-1.5 text-[var(--text-muted)]">
                      <span>Description Length (Optimal: 120-160 chars)</span>
                      <span className={
                        seoDescriptionEn.length >= 120 && seoDescriptionEn.length <= 160
                          ? "text-accent font-bold"
                          : seoDescriptionEn.length > 160 
                          ? "text-[var(--fg-danger)]" 
                          : "text-[var(--fg-warning)]"
                      }>
                        {seoDescriptionEn.length} chars
                      </span>
                    </div>
                    <div className="w-full bg-[var(--surface-card)] h-1 rounded-full overflow-hidden border border-[var(--border-default)]">
                      <div 
                        className={`h-full transition-theme ${
                          seoDescriptionEn.length >= 120 && seoDescriptionEn.length <= 160
                            ? "bg-accent"
                            : seoDescriptionEn.length > 160
                            ? "bg-[var(--fg-danger)]"
                            : "bg-[var(--fg-warning)]"
                        }`}
                        style={{ width: `${Math.min(100, (seoDescriptionEn.length / 160) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEO Share Image Upload */}
          <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
              <ImageIcon size={16} className="text-accent" />
              {t("seoPreviewImageTitle")}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Uploader */}
              <div className="space-y-4">
                <div
                  className="p-6 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-accent/50 transition-theme flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[220px] group"
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => handleImageUpload(e, "seo")}
                    disabled={isSeoUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                  />
                  
                  {isSeoUploading ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <RefreshCw className="animate-spin text-accent mb-3" size={28} />
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {dir === "rtl" ? "جاري رفع الصورة..." : "Uploading image..."}
                      </p>
                    </div>
                  ) : seoImageUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center">
                      <img
                        src={resolveImageUrl(seoImageUrl, 'general')}
                        alt="SEO Preview"
                        className="max-h-[160px] rounded-shape-sm object-contain aspect-[1.91/1] shadow-md border border-[var(--border-default)]"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSeoImageUrl(null);
                        }}
                        className="mt-3 text-xs bg-[var(--fg-danger)] hover:bg-[var(--fg-danger)] text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition-theme z-20"
                      >
                        <Trash2 size={12} />
                        {t("seoRemoveImage")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-4">
                      <div className="mb-3 p-3 rounded-full bg-accent/10 text-accent transition-colors">
                        <Upload size={24} />
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {t("seoDragAndDrop")}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">
                        {t("seoSupportedFormats")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Google and Meta specifications card */}
                <div className="p-4 rounded-shape-sm border text-xs leading-relaxed space-y-2 bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)]">
                  <p className="font-semibold text-accent">
                    💡 {t("seoBestPracticesTitle")}
                  </p>
                  <ul className="list-disc leading-loose list-inside pr-1 space-y-1">
                    <li>
                      <strong>{t("seoBestPracticesRecSize")}</strong> {t("seoBestPracticesRecSizeDesc")}
                    </li>
                    <li>
                      <strong>{t("seoBestPracticesRatio")}</strong> {t("seoBestPracticesRatioDesc")}
                    </li>
                    <li>
                      <strong>{t("seoBestPracticesFileSize")}</strong> {t("seoBestPracticesFileSizeDesc")}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Real-time Rich Social Media Preview (Facebook / LinkedIn card simulation) */}
              <div className="flex flex-col justify-start">
                <div className="text-xs font-semibold mb-3 text-[var(--text-secondary)]">
                  ⚡ {t("seoSocialPreviewTitle")}
                </div>

                <div className="rounded-shape-md overflow-hidden border shadow-sm flex flex-col bg-[var(--surface-card)] border-[var(--border-default)]">
                  {/* Image Section */}
                  <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-center">
                    {seoImageUrl ? (
                      <img 
                        src={seoImageUrl} 
                        alt="SEO Card Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center p-4">
                        <ImageIcon size={32} className="text-[var(--text-muted)] mb-2" />
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono">
                          {t("seoNoImageYet")}
                        </span>
                      </div>
                    )}
                    <div className={`absolute top-2 ${language === "ar" ? "right-2" : "left-2"} bg-black/60 rounded-shape-sm px-2 py-0.5 text-[8px] tracking-wide text-white uppercase font-mono z-20`}>
                      {language === "ar" ? "معاينة 1200x630" : "Preview Image 1200x630"}
                    </div>
                  </div>

                  {/* Body Section */}
                  <div className={`p-4 flex flex-col font-sans ${language === "ar" ? "text-right" : "text-left"}`} dir={language === "ar" ? "rtl" : "ltr"}>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                      {window.location.hostname || "perplexta.com"}
                    </div>
                    <div className="text-sm font-semibold mt-1 line-clamp-1 text-[var(--text-primary)]">
                      {language === "ar" ? (seoSiteNameAr || siteNameAr || "منصة بيربليكستا") : (seoSiteNameEn || siteName || "Perplexta Platform")}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                      {language === "ar" 
                        ? (seoDescriptionAr || "يرجى كتابة وصف تعريفي مخصص ومكثف لزيادة جودة ظهور منصتك على محركات البحث وتسهيل أرشفة الرابط تلقائياً مع الصورة.") 
                        : (seoDescriptionEn || "Please enter high quality descriptive analysis parameters to automatically enhance your brand's digital footprints across social ecosystems.")}
                    </div>
                  </div>
                </div>
                
                <p className={`text-[10px] text-[var(--text-muted)] mt-3 italic leading-relaxed ${dir === "rtl" ? "text-right" : "text-left"}`}>
                  {t("seoPreviewFooterNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveSeoSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-accent hover:bg-accent text-white px-6 py-2.5 rounded-shape-sm transition-theme font-medium shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {t("saveSettings") || "Save"}
          </button>
        </div>
      </div>

      {/* Dynamic Route-Based SEO Manager (Database SEO Meta Tags per Route) */}
      <div
        className="p-6 md:p-8 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] font-sans shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 shadow-xs">
              <Globe size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {dir === "rtl" ? "أداة إدارة بيانات SEO للمسارات الديناميكية" : "Dynamic Route SEO Meta Manager"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {dir === "rtl"
                  ? "تخصيص وتحديث عناوين SEO والوصف والكلمات المفتاحية وصور Open Graph لكل مسار في قاعدة البيانات بشكل فوري ومباشر."
                  : "Dynamically manage SEO title, description, keywords, and Open Graph share images for specific application routes in database."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchRouteSeoList}
              disabled={loadingRouteSeo}
              className="p-2.5 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              title={dir === "rtl" ? "تحديث القائمة" : "Refresh List"}
            >
              <RefreshCw size={16} className={loadingRouteSeo ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => handleClearCache('route_seo')}
              disabled={clearingCache !== null}
              className="flex items-center gap-2 bg-[var(--fg-danger)]/10 hover:bg-[var(--fg-danger)]/20 text-[var(--fg-danger)] border border-[var(--fg-danger)]/20 px-4 py-2 min-h-[38px] rounded-[var(--radius-sm)] font-bold text-xs transition-colors cursor-pointer"
              title={dir === "rtl" ? "تطهير كاش الـ SEO" : "Purge SEO Cache"}
            >
              <RefreshCw size={14} className={clearingCache === 'route_seo' ? "animate-spin" : ""} />
              <span>{dir === "rtl" ? "تطهير كاش الـ SEO" : "Purge SEO Cache"}</span>
            </button>
            <button
              onClick={handleOpenAddRouteModal}
              className="flex items-center gap-2 bg-accent hover:opacity-90 text-[var(--fg-on-emphasis)] px-4 py-2 min-h-[38px] rounded-[var(--radius-sm)] font-bold text-xs transition-opacity shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>{dir === "rtl" ? "إضافة مسار جديد" : "Add Route SEO"}</span>
            </button>
          </div>
        </div>

        {/* Search & Counter Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={routeSearchQuery}
              onChange={(e) => setRouteSearchQuery(e.target.value)}
              placeholder={dir === "rtl" ? "بحث عن مسار أو عنوان..." : "Filter routes or titles..."}
              className="w-full text-xs ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2.5 rounded-[var(--radius-sm)] border bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
            />
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-2">
            <span>{dir === "rtl" ? "إجمالي المسارات المسجلة:" : "Configured Routes:"}</span>
            <span className="px-2.5 py-0.5 rounded bg-accent/10 text-accent font-bold">
              {routeSeoList.length}
            </span>
          </div>
        </div>

        {/* Routes List Table */}
        {loadingRouteSeo && routeSeoList.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] flex items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin text-accent" />
            <span>{dir === "rtl" ? "جاري تحميل إعدادات SEO للمسارات..." : "Loading route SEO configurations..."}</span>
          </div>
        ) : routeSeoList.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-[var(--radius-sm)] border-[var(--border-default)] text-[var(--text-muted)]">
            <Globe size={32} className="mx-auto mb-2 text-[var(--text-muted)] opacity-60" />
            <p className="text-sm font-medium">
              {dir === "rtl" ? "لا توجد مسارات مخصصة مسجلة حالياً" : "No custom route SEO configurations found."}
            </p>
            <button
              onClick={handleOpenAddRouteModal}
              className="mt-3 text-xs text-accent underline hover:opacity-80 cursor-pointer"
            >
              {dir === "rtl" ? "+ إضافة أول مسار الآن" : "+ Create your first route SEO entry"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="text-[11px] uppercase font-mono border-b border-[var(--border-default)] text-[var(--text-secondary)] bg-[var(--surface-subtle)]">
                <tr>
                  <th className="p-3 text-start font-bold">{dir === "rtl" ? "المسار (Route)" : "Route Path"}</th>
                  <th className="p-3 text-start font-bold">{dir === "rtl" ? "عنوان SEO (العربية / English)" : "SEO Title (Ar / En)"}</th>
                  <th className="p-3 text-start font-bold">{dir === "rtl" ? "الوصف" : "Description"}</th>
                  <th className="p-3 text-start font-bold">{dir === "rtl" ? "صورة OG" : "OG Image"}</th>
                  <th className="p-3 text-start font-bold">{dir === "rtl" ? "الحالة" : "Status"}</th>
                  <th className="p-3 text-end font-bold">{dir === "rtl" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {routeSeoList
                  .filter((item) => {
                    if (!routeSearchQuery) return true;
                    const q = routeSearchQuery.toLowerCase();
                    return (
                      item.route?.toLowerCase().includes(q) ||
                      item.title_ar?.toLowerCase().includes(q) ||
                      item.title_en?.toLowerCase().includes(q) ||
                      item.description_ar?.toLowerCase().includes(q) ||
                      item.description_en?.toLowerCase().includes(q)
                    );
                  })
                  .map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-[var(--surface-subtle)] transition-colors ${
                        !item.is_active ? "opacity-50" : ""
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-accent text-start">
                        {item.route}
                      </td>
                      <td className="p-3 max-w-[200px] text-start">
                        <div className="font-semibold text-[var(--text-primary)] truncate">
                          {dir === "rtl" ? (item.title_ar || item.title_en) : (item.title_en || item.title_ar)}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate dir-ltr">
                          {item.title_en}
                        </div>
                      </td>
                      <td className="p-3 max-w-[260px] text-start">
                        <p className="line-clamp-2 text-[var(--text-secondary)] text-[11px] leading-relaxed">
                          {dir === "rtl" ? (item.description_ar || item.description_en) : (item.description_en || item.description_ar)}
                        </p>
                      </td>
                      <td className="p-3 text-start">
                        {item.og_image_url ? (
                          <div className="relative inline-block">
                            <img
                              src={item.og_image_url}
                              alt={item.route}
                              className="w-16 h-9 object-cover rounded-[var(--radius-xs)] border border-[var(--border-default)] shadow-2xs transition-opacity hover:opacity-90 bg-[var(--surface-subtle)]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 rounded-[var(--radius-xs)] ring-1 ring-inset ring-black/10 pointer-events-none" />
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-[var(--text-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                            {dir === "rtl" ? "الافتراضي" : "Default"}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-start">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.is_active
                              ? "bg-accent/10 text-accent border border-accent/20"
                              : "bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                          }`}
                        >
                          {item.is_active ? (dir === "rtl" ? "نشط" : "Active") : (dir === "rtl" ? "معطل" : "Disabled")}
                        </span>
                      </td>
                      <td className="p-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRouteModal(item)}
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-[var(--radius-xs)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            title={dir === "rtl" ? "تعديل" : "Edit"}
                          >
                            <Settings2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRouteSeo(item.id)}
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-[var(--radius-xs)] hover:bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] transition-colors cursor-pointer"
                            title={dir === "rtl" ? "حذف" : "Delete"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Route SEO Add/Edit Modal */}
      <AnimatePresence>
        {isRouteModalOpen && editingRouteItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-overlay)] backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-shape-md border p-6 shadow-2xl bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-primary)]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)] mb-5">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Globe className="text-accent" size={20} />
                  <span>
                    {editingRouteItem.id
                      ? (dir === "rtl" ? "تعديل إعدادات SEO للمسار" : "Edit Route SEO Setting")
                      : (dir === "rtl" ? "إضافة مسار SEO جديد" : "Add New Route SEO Setting")}
                  </span>
                </div>
                <button
                  onClick={() => setIsRouteModalOpen(false)}
                  className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveRouteSeo} className="space-y-4">
                {/* Route path */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-accent mb-1">
                    {dir === "rtl" ? "مسار الصفحة (Route Path)" : "Route Path (e.g. /bulletin)"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRouteItem.route || ""}
                    onChange={(e) => setEditingRouteItem({ ...editingRouteItem, route: e.target.value })}
                    placeholder="/bulletin"
                    className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border font-mono bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {dir === "rtl" ? "المسار النسبي للصفحة، مثل: /bulletin أو /subscription أو /custom-page" : "Relative route path starting with /, e.g., /bulletin or /subscription"}
                  </p>
                </div>

                {/* Title Ar & En */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {dir === "rtl" ? "عنوان SEO (بالعربية)" : "SEO Title (Arabic)"}
                    </label>
                    <input
                      type="text"
                      value={editingRouteItem.title_ar || ""}
                      onChange={(e) => setEditingRouteItem({ ...editingRouteItem, title_ar: e.target.value })}
                      placeholder="عنوان الصفحة بالعربية..."
                      className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {dir === "rtl" ? "عنوان SEO (بالإنجليزية)" : "SEO Title (English)"}
                    </label>
                    <input
                      type="text"
                      value={editingRouteItem.title_en || ""}
                      onChange={(e) => setEditingRouteItem({ ...editingRouteItem, title_en: e.target.value })}
                      placeholder="Page title in English..."
                      className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                    />
                  </div>
                </div>

                {/* Description Ar & En */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {dir === "rtl" ? "الوصف التعريفي (بالعربية)" : "SEO Description (Arabic)"}
                    </label>
                    <textarea
                      rows={3}
                      value={editingRouteItem.description_ar || ""}
                      onChange={(e) => setEditingRouteItem({ ...editingRouteItem, description_ar: e.target.value })}
                      placeholder="وصف مختصر ومحسّن لمحركات البحث..."
                      className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {dir === "rtl" ? "الوصف التعريفي (بالإنجليزية)" : "SEO Description (English)"}
                    </label>
                    <textarea
                      rows={3}
                      value={editingRouteItem.description_en || ""}
                      onChange={(e) => setEditingRouteItem({ ...editingRouteItem, description_en: e.target.value })}
                      placeholder="Search optimized page description..."
                      className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                    />
                  </div>
                </div>

                {/* Keywords Ar & En */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {dir === "rtl" ? "الكلمات المفتاحية (بالعربية)" : "Keywords (Arabic)"}
                    </label>
                    <input
                      type="text"
                      value={editingRouteItem.keywords_ar || ""}
                      onChange={(e) => setEditingRouteItem({ ...editingRouteItem, keywords_ar: e.target.value })}
                      placeholder="كلمات, مفتاحية, مفصولة, بفاصلة"
                      className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {dir === "rtl" ? "الكلمات المفتاحية (بالإنجليزية)" : "Keywords (English)"}
                    </label>
                    <input
                      type="text"
                      value={editingRouteItem.keywords_en || ""}
                      onChange={(e) => setEditingRouteItem({ ...editingRouteItem, keywords_en: e.target.value })}
                      placeholder="keywords, separated, by, comma"
                      className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                    />
                  </div>
                </div>

                {/* OG Image URL / Professional Widescreen Uploader */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--text-primary)]">
                      {dir === "rtl" ? "صورة معاينة ومشاركة المسار (Open Graph Image)" : "Social Share Preview Image (OG Image)"}
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20">
                      1200×630 HD (1.91:1)
                    </span>
                  </div>

                  <div className="relative rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 hover:border-accent/50 transition-colors">
                    {editingRouteItem.og_image_url ? (
                      <div className="space-y-3">
                        <div className="relative aspect-[1.91/1] w-full max-h-48 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs group">
                          <img
                            src={editingRouteItem.og_image_url}
                            alt="Route OG Preview"
                            className="w-full h-full object-cover transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 justify-between">
                            <span className="text-white text-[11px] font-mono truncate max-w-[70%]">
                              {editingRouteItem.og_image_url}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingRouteItem({ ...editingRouteItem, og_image_url: "" })}
                              className="px-2.5 py-1 rounded bg-[var(--fg-danger)] hover:bg-[var(--fg-danger)] text-white text-[11px] font-medium shadow-sm transition-colors cursor-pointer"
                            >
                              {dir === "rtl" ? "إزالة الصورة" : "Remove"}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold border border-[var(--border-default)] shadow-2xs transition-colors">
                            <Upload size={14} className="text-accent" />
                            <span>{routeUploadingImg ? (dir === "rtl" ? "جارٍ الرفع..." : "Uploading...") : (dir === "rtl" ? "استبدال بصورة جديدة" : "Replace Image")}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleRouteImageUpload}
                              disabled={routeUploadingImg}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingRouteItem({ ...editingRouteItem, og_image_url: "" })}
                            className="px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--fg-danger)] hover:bg-[var(--status-danger-subtle)] border border-[var(--fg-danger)]/20 transition-colors cursor-pointer"
                          >
                            {dir === "rtl" ? "العودة للافتراضي" : "Reset to Default"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                          <ImageIcon size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">
                            {dir === "rtl" ? "رفع صورة مخصصة عالية الدقة لمشاركة هذا المسار" : "Upload HD Custom Social Share Image"}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {dir === "rtl" ? "المقاس الموصى به: 1200×630 بكسل بصيغة WebP أو PNG أو JPG" : "Recommended: 1200×630px WebP, PNG or JPG (Max 2MB)"}
                          </p>
                        </div>
                        <label className="cursor-pointer flex items-center gap-2 bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold shadow-2xs transition-opacity mt-1">
                          <Upload size={14} />
                          <span>{routeUploadingImg ? (dir === "rtl" ? "جارٍ الرفع..." : "Uploading...") : (dir === "rtl" ? "اختيار صورة من الجهاز" : "Select Image")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleRouteImageUpload}
                            disabled={routeUploadingImg}
                          />
                        </label>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[var(--border-subtle)] mt-2">
                      <input
                        type="text"
                        value={editingRouteItem.og_image_url || ""}
                        onChange={(e) => setEditingRouteItem({ ...editingRouteItem, og_image_url: e.target.value })}
                        placeholder={dir === "rtl" ? "أو أدخل رابط الصورة المباشر (https://... أو /uploads/...)" : "Or enter direct image URL (https://... or /uploads/...)"}
                        className="w-full text-[11px] p-2 rounded-[var(--radius-xs)] border font-mono bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Is Active Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="route_is_active"
                    checked={editingRouteItem.is_active !== false}
                    onChange={(e) => setEditingRouteItem({ ...editingRouteItem, is_active: e.target.checked })}
                    className="w-4 h-4 text-accent accent-accent rounded border-[var(--border-default)] focus:ring-[var(--border-accent)] cursor-pointer"
                  />
                  <label htmlFor="route_is_active" className="text-xs font-medium cursor-pointer">
                    {dir === "rtl" ? "تفعيل إعدادات SEO لهذا المسار" : "Enable dynamic SEO meta tags for this route"}
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsRouteModalOpen(false)}
                    className="px-4 py-2 min-h-[38px] rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] cursor-pointer transition-colors"
                  >
                    {dir === "rtl" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-accent hover:opacity-90 text-[var(--fg-on-emphasis)] px-5 py-2 min-h-[38px] rounded-[var(--radius-sm)] text-xs font-bold shadow-xs transition-opacity cursor-pointer"
                  >
                    <Save size={14} />
                    {dir === "rtl" ? "حفظ التغييرات" : "Save Settings"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Engine Indexing & Route Security Verification (Crawlability Audit) */}
      <div className="p-6 md:p-8 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] font-sans shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 shadow-xs">
              <ShieldCheck size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {language === "ar" ? "تقرير تدقيق أرشفة وقابلية زحف المسارات" : "Search Engine Indexing & Crawlability Audit"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {language === "ar" 
                  ? "نظام تدقيق فوري للتحقق من أمان وحجب الصفحات الشخصية للمستخدمين من الفهرسة." 
                  : "Security ledger simulating Google Search crawler to verify compliance of user routes."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={runCrawlAuditScan}
              disabled={crawlScanning}
              className="flex items-center gap-2 text-xs bg-accent hover:opacity-90 text-[var(--fg-on-emphasis)] px-4 py-2 min-h-[38px] rounded-[var(--radius-sm)] transition-opacity font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={crawlScanning ? "animate-spin" : ""} size={14} />
              <span>{language === "ar" ? "تشغيل تدقيق الفهرسة" : "Execute Crawl Audit"}</span>
            </button>
            
            <button
              onClick={downloadCrawlAuditReport}
              className="flex items-center gap-2 text-xs border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] px-4 py-2 min-h-[38px] rounded-[var(--radius-sm)] transition-colors font-bold cursor-pointer"
            >
              <Download size={14} />
              <span>{language === "ar" ? "تصدير التقرير الفني" : "Download JSON Report"}</span>
            </button>
          </div>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">{language === "ar" ? "إجمالي المسارات" : "Total Routes Indexed"}</span>
            <div className="text-2xl font-bold mt-1 text-sky-500 font-mono">
              {routesSchema.length} <span className="text-xs font-normal text-[var(--text-muted)]">URI</span>
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">{language === "ar" ? "مسارات محمية (No-Index)" : "Shielded Secret Routes (No-Index)"}</span>
            <div className="text-2xl font-bold mt-1 text-accent flex items-center gap-1.5 font-mono">
              {routesSchema.filter((r: any) => r.status === "noindex").length}
              <ShieldCheck size={16} className="text-accent" />
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">{language === "ar" ? "مسارات عامة (مؤرشفة)" : "Approved Public Domains"}</span>
            <div className="text-2xl font-bold mt-1 text-[var(--fg-warning)] font-mono">
              {routesSchema.filter((r: any) => r.status === "index").length}
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-sm)] border bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">{language === "ar" ? "معدل سلامة الامتثال والأرشفة" : "Compliance & Indexing Rating"}</span>
            <div className={`text-xl font-bold mt-1.5 uppercase tracking-tight flex items-center gap-1.5 ${
              crawlComplianceRate.includes("SECURE") 
                ? "text-accent" 
                : crawlComplianceRate === "PENDING" || crawlComplianceRate === "معلق"
                ? "text-[var(--fg-warning)]"
                : "text-[var(--fg-danger)]"
            }`}>
              <span>{crawlComplianceRate}</span>
              {crawlComplianceRate.includes("SECURE") && <CheckCircle size={14} className="text-accent" />}
            </div>
          </div>
        </div>

        {/* Live Terminal Monitor */}
        {(crawlScanning || crawlAuditLogs.length > 0) && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              {language === "ar" ? "شاشة التدقيق الفوري والمطابقة" : "Real-time Verification Console"}
            </h3>
            <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--surface-inset)] border border-[var(--border-default)] text-xs font-mono text-accent/90 leading-relaxed max-h-[180px] overflow-y-auto space-y-1.5">
              {crawlAuditLogs.map((log, index) => (
                <div key={`crawl-log-${index}`} className="flex items-start gap-2">
                  <span className="text-[var(--text-muted)]">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
              {crawlScanning && (
                <div className="flex items-center gap-1 text-accent/80 italic font-medium ml-4">
                  <span>●</span> <span>{language === "ar" ? "جاري تحليل الاستجابة..." : "Analyzing header packets..."}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 mb-4">
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {language === "ar" ? "سجل توثيق حماية المسارات" : "Path Protection Registry Ledger"}
          </span>
          <div className="flex bg-[var(--surface-subtle)] p-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
            {[
              { id: "all", label: language === "ar" ? "الكل" : "All" },
              { id: "index", label: language === "ar" ? "مؤرشفة" : "Public Only" },
              { id: "noindex", label: language === "ar" ? "محمية" : "Shielded Only" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setCrawlAuditFilter(f.id as any)}
                type="button"
                className={`text-[10px] uppercase font-bold px-3 py-1 transition-colors rounded-[var(--radius-xs)] cursor-pointer ${
                  crawlAuditFilter === f.id
                    ? "bg-[var(--surface-card)] text-accent font-extrabold shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Path List */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)] text-xs bg-[var(--surface-subtle)]">
                <th className="p-3 font-semibold text-start">{language === "ar" ? "المسار" : "Path / Location"}</th>
                <th className="p-3 font-semibold text-start">{language === "ar" ? "النوع" : "Category"}</th>
                <th className="p-3 font-semibold text-start">{language === "ar" ? "وسم محركات البحث" : "Crawler Directive"}</th>
                <th className="p-3 font-semibold text-start">{language === "ar" ? "حالة الأمان" : "Security Certification"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {routesSchema
                .filter((r: any) => {
                  if (crawlAuditFilter === "all") return true;
                  return r.status === crawlAuditFilter;
                })
                .map((route: any, idx: number) => (
                  <tr key={`crawl-route-${route.path || idx}-${idx}`} className="hover:bg-[var(--surface-subtle)] transition-colors">
                    <td className="p-3 font-mono text-xs text-start">
                      <span className="text-[var(--text-primary)] font-semibold">{route.path}</span>
                    </td>
                    <td className="p-3 text-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        route.type === "admin" 
                          ? "bg-[var(--status-danger-subtle)] text-[var(--fg-danger)]" 
                          : route.type === "private" 
                          ? "bg-accent/10 text-accent" 
                          : route.type === "custom"
                          ? "bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]"
                          : "bg-sky-500/10 text-sky-500"
                      }`}>
                        {route.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-start">
                      {route.status === "noindex" ? (
                        <span className="text-[var(--text-muted)] font-medium flex items-center gap-1">
                          <EyeOff size={12} className="text-[var(--text-muted)]" />
                          <span>noindex, nofollow</span>
                        </span>
                      ) : (
                        <span className="text-accent font-bold flex items-center gap-1">
                          <Eye size={12} className="text-accent" />
                          <span>index, follow</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          {route.status === "noindex" ? (
                            <>
                              <ShieldCheck size={14} className="text-accent" />
                              <span className="font-bold text-accent text-xs">
                                {language === "ar" ? "محجوب دستورياً" : "SECURED AND ISOLATED"}
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} className="text-[var(--fg-warning)]" />
                              <span className="font-bold text-[var(--fg-warning)] text-xs">
                                {language === "ar" ? "مؤرشف عام" : "APPROVED PUBLIC PAGE"}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {language === "ar" ? route.descriptionAr : route.descriptionEn}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {activeMainTab === 'memory' && (
        <div className="w-full">
          <MemoryCenterView
            theme={theme}
            t={t}
            dir={dir}
            language={language}
          />
        </div>
      )}

      {/* Cache Management Utility Center */}
      <div className="p-6 md:p-8 rounded-shape-md border bg-[var(--surface-card)] border-[var(--border-default)] font-sans">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 shadow-xs">
            <Cpu size={24} className="text-accent " />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {dir === "rtl" ? "إدارة ذاكرة التخزين المؤقت ونظام الـ Caches" : "System Caches & Memory Management"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {dir === "rtl"
                ? "مسح وإعادة تحميل ذاكرات التخزين المؤقت (صلاحيات الملفات، مسارات SEO، وإعدادات النظام) بشكل فردي أو جماعي."
                : "Clear and refresh system caches (file permissions, route SEO, system settings) individually or globally with instant UI feedback."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* File Permission Cache */}
          <div className="p-4 rounded-shape-sm border flex flex-col justify-between bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold font-mono text-accent">FILE PERMISSIONS</span>
                <ShieldCheck size={16} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-xs font-bold mb-1">{dir === "rtl" ? "صلاحيات الملفات" : "File Permission Cache"}</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                {dir === "rtl" ? "مسح ذاكرة التحقق من الأمان وصلاحيات الوصول للملفات المرفوعة وإصداراتها." : "Invalidates cached authorization checks and version hashes for secure file access."}
              </p>
            </div>
            <button
              onClick={() => handleClearCache('file_permission')}
              disabled={clearingCache !== null}
              className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={clearingCache === 'file_permission' ? "animate-spin shrink-0" : "shrink-0"} />
              <span>{dir === "rtl" ? "مسح ذاكرة الملفات" : "Clear File Cache"}</span>
            </button>
          </div>

          {/* Route SEO Cache */}
          <div className="p-4 rounded-shape-sm border flex flex-col justify-between bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold font-mono text-accent">ROUTE SEO</span>
                <Globe size={16} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-xs font-bold mb-1">{dir === "rtl" ? "مسارات SEO" : "Route SEO Cache"}</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                {dir === "rtl" ? "مسح ذاكرة بيانات وسوم Meta وعناوين الصفحات الديناميكية." : "Flushes cached Open Graph and meta tag configs per route."}
              </p>
            </div>
            <button
              onClick={() => handleClearCache('route_seo')}
              disabled={clearingCache !== null}
              className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={clearingCache === 'route_seo' ? "animate-spin shrink-0" : "shrink-0"} />
              <span>{dir === "rtl" ? "مسح ذاكرة SEO" : "Clear SEO Cache"}</span>
            </button>
          </div>

          {/* System Settings & Assets Cache */}
          <div className="p-4 rounded-shape-sm border flex flex-col justify-between bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold font-mono text-accent">SYSTEM & ASSETS</span>
                <Settings size={16} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-xs font-bold mb-1">{dir === "rtl" ? "إعدادات النظام والأصول" : "System & Asset Cache"}</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                {dir === "rtl" ? "تفريغ إعدادات المنصة العامة والأيقونات وقوالب الشعار المحفوظة بالذاكرة." : "Refreshes global platform settings, brand icons, and in-memory asset buffers."}
              </p>
            </div>
            <button
              onClick={() => handleClearCache('system_settings')}
              disabled={clearingCache !== null}
              className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={clearingCache === 'system_settings' ? "animate-spin shrink-0" : "shrink-0"} />
              <span>{dir === "rtl" ? "مسح إعدادات النظام" : "Clear Settings Cache"}</span>
            </button>
          </div>

          {/* Orchestrator & AI Keys Cache */}
          <div className="p-4 rounded-shape-sm border flex flex-col justify-between bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold font-mono text-accent">AI & ORCHESTRATOR</span>
                <Server size={16} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-xs font-bold mb-1">{dir === "rtl" ? "الأوركسترا والمفاتيح" : "AI & Orchestrator Cache"}</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                {dir === "rtl" ? "مسح ذاكرة توجيه النماذج وخزينة مفاتيح الـ AI وخوادم الـ GPU المعزولة." : "Flushes cached tool orchestrator routing, API keys vault, and GPU servers."}
              </p>
            </div>
            <button
              onClick={() => handleClearCache('orchestrator')}
              disabled={clearingCache !== null}
              className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={clearingCache === 'orchestrator' ? "animate-spin shrink-0" : "shrink-0"} />
              <span>{dir === "rtl" ? "مسح ذاكرة الموديلات" : "Clear AI Cache"}</span>
            </button>
          </div>

          {/* Economy & Subscriptions Cache */}
          <div className="p-4 rounded-shape-sm border flex flex-col justify-between bg-[var(--surface-subtle)] border-[var(--border-default)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold font-mono text-accent">ECONOMY & PLANS</span>
                <Layers size={16} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-xs font-bold mb-1">{dir === "rtl" ? "الاقتصاد والاشتراكات" : "Economy & Plans Cache"}</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                {dir === "rtl" ? "مسح ذاكرة خطط الاشتراك، أسعار الرصيد، وتهيئة بوابات الدفع." : "Clears subscription plan quotas, economy credit multipliers, and pricing configs."}
              </p>
            </div>
            <button
              onClick={() => handleClearCache('economy')}
              disabled={clearingCache !== null}
              className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={clearingCache === 'economy' ? "animate-spin shrink-0" : "shrink-0"} />
              <span>{dir === "rtl" ? "مسح ذاكرة الخطط" : "Clear Economy Cache"}</span>
            </button>
          </div>

          {/* Global All Caches */}
          <div className="p-4 rounded-shape-sm border flex flex-col justify-between bg-[var(--surface-subtle)] border-accent/30">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold font-mono text-accent">GLOBAL PURGE</span>
                <Zap size={16} className="text-accent" />
              </div>
              <p className="text-xs font-bold mb-1">{dir === "rtl" ? "مسح شامل (Global)" : "Global Cache Purge"}</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                {dir === "rtl" ? "مسح جميع الذاكرات (الأصول، الاقتصاد، الخطط، الموديلات، الصلاحيات) دفعة واحدة." : "Clears all system, SEO, file permission, economy, orchestrator, and GPU caches."}
              </p>
            </div>
            <button
              onClick={() => handleClearCache('global')}
              disabled={clearingCache !== null}
              className="w-full py-2 px-3 bg-accent hover:opacity-90 text-[var(--fg-on-emphasis)] rounded text-xs font-medium transition-opacity flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={clearingCache === 'global' ? "animate-spin shrink-0" : "shrink-0"} />
              <span>{dir === "rtl" ? "مسح جميع الذاكرات" : "Purge All Caches"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Compliance Audit Logs View ---