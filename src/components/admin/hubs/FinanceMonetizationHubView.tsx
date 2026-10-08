import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Landmark, CreditCard, UserPlus } from "lucide-react";
import { FinanceVaultView } from "../FinanceVaultView";
import { PlansSubscriptionsView } from "../PlansSubscriptionsView";
import { ReferralDashboardView } from "../../../pages/ReferralDashboardView";

export type FinanceTab = "finance" | "plans" | "referrals";

interface FinanceMonetizationHubViewProps {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
  language: string;
  showToast: (message: string, type?: "success" | "error" | "warning" | "info" | any) => void;
  initialTab?: FinanceTab;
  onTabChange?: (tab: FinanceTab) => void;
  hideSubTabs?: boolean;
}

export const FinanceMonetizationHubView: React.FC<FinanceMonetizationHubViewProps> = ({
  theme,
  t,
  dir,
  language,
  showToast,
  initialTab = "finance",
  onTabChange,
  hideSubTabs = false,
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);
  const isRtl = language === "ar";

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: FinanceTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const tabs: { id: FinanceTab; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      id: "finance",
      labelAr: "دفتر الحسابات والمالية (Ledger)",
      labelEn: "Financial Ledger & Balances",
      icon: <Landmark size={16} />,
    },
    {
      id: "plans",
      labelAr: "الباقات والخطط والحدود الدقيقة",
      labelEn: "Plans, Pricing & Granular Limits",
      icon: <CreditCard size={16} />,
    },
    {
      id: "referrals",
      labelAr: "لوحة التسويق بالعمولة وشجرة الإحالات",
      labelEn: "Affiliate & Referral Network",
      icon: <UserPlus size={16} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Sub-Tabs Navigation Bar */}
      {!hideSubTabs && (
        <div className="w-full flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] overflow-x-auto max-w-full custom-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={`finance-tab-${tab.id}`}
                  type="button"
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-[var(--radius-sm)] text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-44 ${
                    isActive
                      ? "bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-xs border border-[var(--border-accent)]/30 font-black"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]/50 border border-transparent"
                  }`}
                >
                  <span className={isActive ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"}>
                    {tab.icon}
                  </span>
                  <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content Display */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`finance-view-${activeTab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === "finance" && (
              <FinanceVaultView theme={theme} t={t} dir={dir} showToast={showToast} />
            )}
            {activeTab === "plans" && (
              <PlansSubscriptionsView theme={theme} t={t} dir={dir} />
            )}
            {activeTab === "referrals" && (
              <ReferralDashboardView theme={theme} t={t} dir={dir} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
