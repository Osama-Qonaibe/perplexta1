import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, Server, Cpu, MapPin, Music, Fingerprint, CreditCard } from "lucide-react";
import { ApiKeysVaultView } from "../ApiKeysVaultView";
import { GpuInfrastructureView } from "../GpuInfrastructureView";
import { OrchestratorView } from "../OrchestratorView";
import { MapsInfrastructureView } from "../MapsInfrastructureView";
import { AudioInfrastructureView } from "../AudioInfrastructureView";
import { AuthProvidersInfrastructureView } from "../AuthProvidersInfrastructureView";
import { PaymentGatewaysInfrastructureView } from "../PaymentGatewaysInfrastructureView";

export type AiInfraTab = "keys" | "gpu" | "maps" | "audio" | "auth" | "payments" | "orchestrator";

interface AiInfrastructureHubViewProps {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
  language: string;
  providerModels: Record<string, any[]>;
  setProviderModels: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  showToast: (message: string, type?: "success" | "error" | "warning" | "info" | any) => void;
  onRefreshModels: () => Promise<void>;
  initialTab?: AiInfraTab;
  onTabChange?: (tab: AiInfraTab) => void;
  hideSubTabs?: boolean;
}

export const AiInfrastructureHubView: React.FC<AiInfrastructureHubViewProps> = ({
  theme,
  t,
  dir,
  language,
  providerModels,
  setProviderModels,
  showToast,
  onRefreshModels,
  initialTab = "keys",
  onTabChange,
  hideSubTabs = false,
}) => {
  const [activeTab, setActiveTab] = useState<AiInfraTab>(initialTab);
  const isRtl = language === "ar";

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: AiInfraTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const tabs: { id: AiInfraTab; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      id: "keys",
      labelAr: "خزانة مفاتيح الـ LLM",
      labelEn: "LLM API Keys Vault",
      icon: <Key size={16} />,
    },
    {
      id: "gpu",
      labelAr: "خوادم الـ GPU ومعالجة الوسائط",
      labelEn: "GPU Infrastructure & Media Compute",
      icon: <Server size={16} />,
    },
    {
      id: "maps",
      labelAr: "مزودو الخرائط والمواقع",
      labelEn: "Maps & Geocoding Infrastructure",
      icon: <MapPin size={16} />,
    },
    {
      id: "audio",
      labelAr: "مزودو الصوت والموسيقى والمؤثرات",
      labelEn: "Audio & Music Infrastructure",
      icon: <Music size={16} />,
    },
    {
      id: "auth",
      labelAr: "مزودو المصادقة والـ OAuth",
      labelEn: "Auth & OAuth Providers",
      icon: <Fingerprint size={16} />,
    },
    {
      id: "payments",
      labelAr: "بوابات الدفع والتحويلات",
      labelEn: "Payment Gateways Vault",
      icon: <CreditCard size={16} />,
    },
    {
      id: "orchestrator",
      labelAr: "موجّه الأدوات والفشل الصامت",
      labelEn: "Tool Orchestrator & Failover",
      icon: <Cpu size={16} />,
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
                  key={`ai-infra-tab-${tab.id}`}
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
            key={`ai-infra-view-${activeTab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === "keys" && (
              <ApiKeysVaultView
                theme={theme}
                t={t}
                dir={dir}
                providerModels={providerModels}
                setProviderModels={setProviderModels}
                showToast={showToast}
              />
            )}
            {activeTab === "gpu" && (
              <GpuInfrastructureView
                theme={theme}
                t={t}
                dir={dir}
                showToast={showToast}
              />
            )}
            {activeTab === "maps" && (
              <MapsInfrastructureView
                theme={theme}
                t={t}
                dir={dir}
                showToast={showToast}
              />
            )}
            {activeTab === "audio" && (
              <AudioInfrastructureView
                theme={theme}
                t={t}
                dir={dir}
                showToast={showToast}
              />
            )}
            {activeTab === "auth" && (
              <AuthProvidersInfrastructureView
                theme={theme}
                t={t}
                dir={dir}
                showToast={showToast}
              />
            )}
            {activeTab === "payments" && (
              <PaymentGatewaysInfrastructureView
                theme={theme}
                t={t}
                dir={dir}
                showToast={showToast}
              />
            )}
            {activeTab === "orchestrator" && (
              <OrchestratorView
                theme={theme}
                t={t}
                dir={dir}
                providerModels={providerModels}
                showToast={showToast}
                onRefreshModels={onRefreshModels}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
