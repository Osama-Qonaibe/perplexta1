import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Lock,
  Wallet,
  Landmark,
  Globe,
  Coins,
  Shield,
  Zap,
  Info,
  Check
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export interface PaymentGatewaysInfrastructureViewProps {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
  showToast?: (message: string, type?: "success" | "error" | "warning" | "info") => void;
}

export const PaymentGatewaysInfrastructureView: React.FC<PaymentGatewaysInfrastructureViewProps> = ({
  theme,
  t,
  dir,
  showToast = () => {},
}) => {
  const { token, language } = useAppContext();
  const isRtl = dir === "rtl" || language === "ar";

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stripe State
  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    isLiveMode: false,
    status: "pending",
    lastVerifiedAt: null as string | null,
    hasSecret: false,
  });
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [isSavingStripe, setIsSavingStripe] = useState(false);
  const [isVerifyingStripe, setIsVerifyingStripe] = useState(false);

  // PayPal State
  const [paypalConfig, setPaypalConfig] = useState({
    clientId: "",
    clientSecret: "",
    mode: "sandbox",
    status: "pending",
    lastVerifiedAt: null as string | null,
    hasSecret: false,
  });
  const [showPaypalSecret, setShowPaypalSecret] = useState(false);
  const [isSavingPaypal, setIsSavingPaypal] = useState(false);
  const [isVerifyingPaypal, setIsVerifyingPaypal] = useState(false);

  // Manual / Crypto & Bank Transfer State
  const [manualConfig, setManualConfig] = useState({
    crypto_address: "",
    crypto_network: "TRC20",
    paypal_email: "",
    bank_name: "",
    bank_account_holder: "",
    bank_iban: "",
    bank_instructions: "",
  });
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Fetch all payment settings
  const fetchGatewaySettings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [systemRes, economyRes] = await Promise.all([
        fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/economy/settings", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (systemRes.ok) {
        const sysData = await systemRes.json();
        setStripeConfig({
          publishableKey: sysData.stripe_publishable_key || "",
          secretKey: "",
          webhookSecret: "",
          isLiveMode: !!sysData.stripe_live_mode,
          status: sysData.stripe_status || "pending",
          lastVerifiedAt: sysData.stripe_last_verified_at || null,
          hasSecret: !!sysData.stripe_secret_key,
        });

        setPaypalConfig({
          clientId: sysData.paypal_client_id || "",
          clientSecret: "",
          mode: sysData.paypal_mode || "sandbox",
          status: sysData.paypal_status || "pending",
          lastVerifiedAt: sysData.paypal_last_verified_at || null,
          hasSecret: !!sysData.paypal_client_secret,
        });
      }

      if (economyRes.ok) {
        const ecoData = await economyRes.json();
        const settings = ecoData.settings || ecoData;
        setManualConfig({
          crypto_address: settings.crypto_address || "",
          crypto_network: settings.crypto_network || "TRC20",
          paypal_email: settings.paypal_email || "",
          bank_name: settings.bank_name || "",
          bank_account_holder: settings.bank_account_holder || "",
          bank_iban: settings.bank_iban || "",
          bank_instructions: settings.bank_instructions || "",
        });
      }
    } catch (err: any) {
      console.error("[PaymentGateways] Error fetching gateway settings:", err);
      showToast(isRtl ? "فشل جلب إعدادات بوابات الدفع" : "Failed to fetch payment gateways config", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGatewaySettings();
    }
  }, [token]);

  // Save Stripe Config
  const handleSaveStripe = async () => {
    setIsSavingStripe(true);
    try {
      const res = await fetch("/api/admin/settings/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          publishableKey: stripeConfig.publishableKey,
          secretKey: stripeConfig.secretKey || undefined,
          webhookSecret: stripeConfig.webhookSecret || undefined,
          isLiveMode: stripeConfig.isLiveMode,
        }),
      });

      if (res.ok) {
        showToast(isRtl ? "تم حفظ إعدادات Stripe بنجاح" : "Stripe settings saved successfully", "success");
        fetchGatewaySettings(true);
      } else {
        const err = await res.json();
        showToast(err.error || (isRtl ? "فشل حفظ إعدادات Stripe" : "Failed to save Stripe settings"), "error");
      }
    } catch (err: any) {
      showToast(err.message || (isRtl ? "خطأ في الاتصال" : "Connection error"), "error");
    } finally {
      setIsSavingStripe(false);
    }
  };

  // Verify Stripe Connection
  const handleVerifyStripe = async () => {
    setIsVerifyingStripe(true);
    try {
      const res = await fetch("/api/admin/settings/stripe/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isRtl ? "🟢 تم التحقق من اتصال Stripe بنجاح!" : "🟢 Stripe connection verified successfully!", "success");
        fetchGatewaySettings(true);
      } else {
        showToast(data.error || (isRtl ? "🔴 فشل التحقق من مفاتيح Stripe" : "🔴 Stripe verification failed"), "error");
      }
    } catch (err: any) {
      showToast(err.message || (isRtl ? "خطأ بالفحص" : "Verification error"), "error");
    } finally {
      setIsVerifyingStripe(false);
    }
  };

  // Save PayPal Config
  const handleSavePaypal = async () => {
    setIsSavingPaypal(true);
    try {
      const res = await fetch("/api/admin/settings/paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: paypalConfig.clientId,
          clientSecret: paypalConfig.clientSecret || undefined,
          mode: paypalConfig.mode,
        }),
      });

      if (res.ok) {
        showToast(isRtl ? "تم حفظ إعدادات PayPal بنجاح" : "PayPal settings saved successfully", "success");
        fetchGatewaySettings(true);
      } else {
        const err = await res.json();
        showToast(err.error || (isRtl ? "فشل حفظ إعدادات PayPal" : "Failed to save PayPal settings"), "error");
      }
    } catch (err: any) {
      showToast(err.message || (isRtl ? "خطأ في الاتصال" : "Connection error"), "error");
    } finally {
      setIsSavingPaypal(false);
    }
  };

  // Verify PayPal Connection
  const handleVerifyPaypal = async () => {
    setIsVerifyingPaypal(true);
    try {
      const res = await fetch("/api/admin/settings/paypal/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isRtl ? "🟢 تم التحقق من حساب PayPal بنجاح!" : "🟢 PayPal verified successfully!", "success");
        fetchGatewaySettings(true);
      } else {
        showToast(data.error || (isRtl ? "🔴 فشل التحقق من PayPal" : "🔴 PayPal verification failed"), "error");
      }
    } catch (err: any) {
      showToast(err.message || (isRtl ? "خطأ بالفحص" : "Verification error"), "error");
    } finally {
      setIsVerifyingPaypal(false);
    }
  };

  // Save Manual (Crypto & Bank) Config
  const handleSaveManual = async () => {
    setIsSavingManual(true);
    try {
      const res = await fetch("/api/admin/economy/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(manualConfig),
      });

      if (res.ok) {
        showToast(isRtl ? "تم حفظ بيانات المحافظ والحوالات بنجاح" : "Manual deposit settings saved successfully", "success");
        fetchGatewaySettings(true);
      } else {
        const err = await res.json();
        showToast(err.error || (isRtl ? "فشل الحفظ" : "Save failed"), "error");
      }
    } catch (err: any) {
      showToast(err.message || (isRtl ? "خطأ في الاتصال" : "Connection error"), "error");
    } finally {
      setIsSavingManual(false);
    }
  };

  const activeGatewaysCount =
    (stripeConfig.status === "verified" || stripeConfig.publishableKey ? 1 : 0) +
    (paypalConfig.status === "verified" || paypalConfig.clientId ? 1 : 0) +
    (manualConfig.crypto_address ? 1 : 0) +
    (manualConfig.bank_iban ? 1 : 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative font-sans">
      {/* Top Diagnostic Status Bar (Orchestrator Style) */}
      <div className="p-5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-4 transition-theme">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] shrink-0 border border-[var(--border-default)] relative">
              <CreditCard size={20} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fg-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--fg-success)]"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {isRtl ? "خزانة بوابات الدفع والتحويلات المشفرة" : "Payment Gateways & Financial Vault"}
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-xs)] text-[11px] font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse"></span>
                  <span>{isRtl ? "تشفير AES-256 محصّن" : "AES-256 Vault Active"}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                  {activeGatewaysCount} / 4 {isRtl ? "بوابات ومحافظ نشطة" : "Active Gateways"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={13} className="text-[var(--fg-accent)] shrink-0" />
                  <span>
                    {isRtl ? "حالة بوابات الدفع المباشر:" : "Direct Gateways Status:"}{" "}
                    <strong className="text-[var(--text-primary)] font-semibold">
                      {stripeConfig.status === "verified" || paypalConfig.status === "verified"
                        ? (isRtl ? "مُفعلة ومفحوصة" : "Verified & Active")
                        : (isRtl ? "بانتظار الفحص والتفعيل" : "Pending Verification")}
                    </strong>
                  </span>
                </div>

                <span className="hidden sm:inline text-[var(--border-default)]">•</span>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                  <span>Stripe • PayPal • Crypto USDT • Bank Wire</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:self-auto self-start">
            <button
              onClick={() => fetchGatewaySettings(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] text-xs font-bold transition-all border border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] hover:bg-[var(--surface-card)] active:scale-95 disabled:opacity-50 shrink-0 shadow-xs cursor-pointer group touch-target-44"
              title={isRtl ? "تحديث وفحص بوابات الدفع" : "Refresh & ping all payment gateways"}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[var(--fg-accent)]" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span>{isRtl ? "تحديث بوابات الدفع" : "Refresh Gateways"}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2">
          <span>
            {isRtl
              ? "تُمثّل هذه الخزانة المكان الوحيد لإدارة مفاتيح Stripe وPayPal والعملات والحوالات المشفرة بـ AES-256."
              : "Single authoritative vault for Stripe, PayPal, USDT Crypto, and Bank Wire credentials with AES-256 encryption."}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
            {isRtl ? "البنية التحتية • بوابة الدفع" : "Infrastructure • Payment Vault"}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw size={40} className="text-[var(--fg-accent)] animate-spin" />
          <p className="text-[var(--text-muted)] font-mono text-sm uppercase tracking-[0.3em]">
            Loading Payment Infrastructure Vault...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stripe Gateway Card */}
          <div className="p-6 rounded-[var(--radius-md)] border transition-theme bg-[var(--surface-card)] border-[var(--border-default)] hover:border-[var(--border-accent)] shadow-xs space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)]">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] leading-tight flex items-center gap-2">
                    Stripe Gateway
                    <span className={`px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-bold border ${
                      stripeConfig.status === "verified"
                        ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/20"
                        : "bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border-[var(--fg-warning)]/20"
                    }`}>
                      {stripeConfig.status === "verified" ? (isRtl ? "مُفعل وموثق" : "Verified") : (isRtl ? "غير موثق" : "Unverified")}
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {isRtl ? "بوابة قبول البطاقات البنكية الائتمانية والـ Apple Pay المباشرة" : "Credit cards, debit, and Apple Pay automatic checkout"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-[var(--radius-xs)] border transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--fg-accent)]"
                  title="Stripe Dashboard"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Live / Test Toggle */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isRtl ? "وضع التشغيل الفعلي (Live Mode)" : "Live Production Mode"}
              </span>
              <button
                type="button"
                onClick={() => setStripeConfig({ ...stripeConfig, isLiveMode: !stripeConfig.isLiveMode })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                  stripeConfig.isLiveMode ? "bg-[var(--fg-accent)]" : "bg-[var(--surface-inset)]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    stripeConfig.isLiveMode ? (isRtl ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  Publishable Key (pk_test_... / pk_live_...)
                </label>
                <input
                  type="text"
                  value={stripeConfig.publishableKey}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })}
                  placeholder="pk_test_..."
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  Secret Key (sk_test_... / sk_live_...)
                </label>

                <div className="relative">
                  <input
                    type={showStripeSecret ? "text" : "password"}
                    value={stripeConfig.secretKey}
                    onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
                    placeholder={stripeConfig.hasSecret ? "•••••••••••••••• (مفتاح محفوظ ومشفّر)" : "sk_test_..."}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showStripeSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  Webhook Signing Secret (whsec_...)
                </label>
                <input
                  type="password"
                  value={stripeConfig.webhookSecret}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, webhookSecret: e.target.value })}
                  placeholder="whsec_..."
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveStripe}
                disabled={isSavingStripe}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-4 py-2.5 rounded-[var(--radius-sm)] transition-all font-bold text-xs shadow-xs disabled:opacity-50 min-h-[42px] cursor-pointer touch-target-44 active:scale-95"
              >
                <Save size={14} />
                <span>{isSavingStripe ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "حفظ الإعدادات" : "Save Config")}</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyStripe}
                disabled={isVerifyingStripe}
                className="flex items-center justify-center gap-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--fg-accent)] border border-[var(--border-accent)] px-4 py-2.5 rounded-[var(--radius-sm)] transition-all font-bold text-xs shadow-xs disabled:opacity-50 min-h-[42px] cursor-pointer touch-target-44 active:scale-95"
              >
                <RefreshCw size={14} className={isVerifyingStripe ? "animate-spin" : ""} />
                <span>{isRtl ? "فحص الاتصال" : "Ping & Verify"}</span>
              </button>
            </div>
          </div>

          {/* PayPal Gateway Card */}
          <div className="p-6 rounded-[var(--radius-md)] border transition-theme bg-[var(--surface-card)] border-[var(--border-default)] hover:border-[var(--border-accent)] shadow-xs space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)]">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] leading-tight flex items-center gap-2">
                    PayPal Gateway
                    <span className={`px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-bold border ${
                      paypalConfig.status === "verified"
                        ? "bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/20"
                        : "bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border-[var(--fg-warning)]/20"
                    }`}>
                      {paypalConfig.status === "verified" ? (isRtl ? "مُفعل وموثق" : "Verified") : (isRtl ? "غير موثق" : "Unverified")}
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {isRtl ? "قبول الدفع عبر محفظة PayPal والدفع السريع المباشر" : "PayPal digital wallet and express checkout integration"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://developer.paypal.com/dashboard/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-[var(--radius-xs)] border transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--fg-accent)]"
                  title="PayPal Developer Dashboard"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isRtl ? "وضع PayPal (Mode)" : "PayPal Operating Mode"}
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-shape-xs bg-[var(--surface-inset)]">
                <button
                  type="button"
                  onClick={() => setPaypalConfig({ ...paypalConfig, mode: "sandbox" })}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xs transition-all cursor-pointer ${
                    paypalConfig.mode === "sandbox"
                      ? "bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-2xs font-black"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setPaypalConfig({ ...paypalConfig, mode: "live" })}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xs transition-all cursor-pointer ${
                    paypalConfig.mode === "live"
                      ? "bg-[var(--surface-card)] text-[var(--fg-success)] shadow-2xs font-black"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Live
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={paypalConfig.clientId}
                  onChange={(e) => setPaypalConfig({ ...paypalConfig, clientId: e.target.value })}
                  placeholder="PAYPAL_CLIENT_ID..."
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  Client Secret
                </label>

                <div className="relative">
                  <input
                    type={showPaypalSecret ? "text" : "password"}
                    value={paypalConfig.clientSecret}
                    onChange={(e) => setPaypalConfig({ ...paypalConfig, clientSecret: e.target.value })}
                    placeholder={paypalConfig.hasSecret ? "•••••••••••••••• (مفتاح محفوظ ومشفّر)" : "PAYPAL_SECRET..."}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showPaypalSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSavePaypal}
                disabled={isSavingPaypal}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-4 py-2.5 rounded-[var(--radius-sm)] transition-all font-bold text-xs shadow-xs disabled:opacity-50 min-h-[42px] cursor-pointer touch-target-44 active:scale-95"
              >
                <Save size={14} />
                <span>{isSavingPaypal ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "حفظ الإعدادات" : "Save Config")}</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyPaypal}
                disabled={isVerifyingPaypal}
                className="flex items-center justify-center gap-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--fg-accent)] border border-[var(--border-accent)] px-4 py-2.5 rounded-[var(--radius-sm)] transition-all font-bold text-xs shadow-xs disabled:opacity-50 min-h-[42px] cursor-pointer touch-target-44 active:scale-95"
              >
                <RefreshCw size={14} className={isVerifyingPaypal ? "animate-spin" : ""} />
                <span>{isRtl ? "فحص الاتصال" : "Ping & Verify"}</span>
              </button>
            </div>
          </div>

          {/* Crypto / USDT Wallet Vault Card */}
          <div className="p-6 rounded-[var(--radius-md)] border transition-theme bg-[var(--surface-card)] border-[var(--border-default)] hover:border-[var(--border-accent)] shadow-xs space-y-5 lg:col-span-2">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)]">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] leading-tight flex items-center gap-2">
                    {isRtl ? "عنوان محفظة العملات المشفرة (Crypto / USDT Vault)" : "Crypto & USDT Deposit Wallet"}
                    {manualConfig.crypto_address && (
                      <span className="px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/20">
                        {isRtl ? "جاهز لاستقبال الإيداعات" : "Ready"}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {isRtl
                      ? "إيداعات العملات الرقمية المستقرة (USDT) مع المراجعة والتأكيد الآلي للإشعار"
                      : "USDT stablecoin address configuration for user deposits with automated receipt validation"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  {isRtl ? "عنوان المحفظة (USDT Wallet Address)" : "USDT Wallet Address"}
                </label>
                <input
                  type="text"
                  value={manualConfig.crypto_address}
                  onChange={(e) => setManualConfig({ ...manualConfig, crypto_address: e.target.value })}
                  placeholder="T..."
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  {isRtl ? "شبكة التحويل (Network)" : "Network Protocol"}
                </label>
                <select
                  value={manualConfig.crypto_network}
                  onChange={(e) => setManualConfig({ ...manualConfig, crypto_network: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs"
                >
                  <option value="TRC20">TRON (TRC-20) - ⚡ Rushed Low Fee</option>
                  <option value="ERC20">Ethereum (ERC-20)</option>
                  <option value="BEP20">Binance Smart Chain (BEP-20)</option>
                  <option value="SOL">Solana (SOL)</option>
                </select>
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="pt-4 border-t border-[var(--border-default)] space-y-4">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-[var(--fg-accent)]" />
                <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                  {isRtl ? "بيانات التحويلات البنكية المباشرة (Bank Wire Details)" : "Bank Wire Transfer Instructions"}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    {isRtl ? "اسم البنك" : "Bank Name"}
                  </label>
                  <input
                    type="text"
                    value={manualConfig.bank_name}
                    onChange={(e) => setManualConfig({ ...manualConfig, bank_name: e.target.value })}
                    placeholder={isRtl ? "مثال: البنك العربي" : "e.g. Arab Bank"}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    {isRtl ? "اسم صاحب الحساب" : "Account Holder Name"}
                  </label>
                  <input
                    type="text"
                    value={manualConfig.bank_account_holder}
                    onChange={(e) => setManualConfig({ ...manualConfig, bank_account_holder: e.target.value })}
                    placeholder={isRtl ? "اسم الشركة / الفرد" : "Company / Entity Name"}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    {isRtl ? "رقم الحساب / الآيبان (IBAN)" : "IBAN / Account Number"}
                  </label>
                  <input
                    type="text"
                    value={manualConfig.bank_iban}
                    onChange={(e) => setManualConfig({ ...manualConfig, bank_iban: e.target.value })}
                    placeholder="PS..."
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveManual}
                disabled={isSavingManual}
                className="flex items-center justify-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-6 py-2.5 rounded-[var(--radius-sm)] transition-all font-bold text-xs shadow-xs disabled:opacity-50 min-h-[42px] cursor-pointer touch-target-44 active:scale-95"
              >
                <Save size={14} />
                <span>{isSavingManual ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "حفظ البيانات" : "Save Config")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
