import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Music,
  Radio,
  Volume2,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Server,
  Layers,
  ExternalLink,
  Star,
  Check,
  Zap,
  Film,
  Smile,
  Disc
} from 'lucide-react';
import { AdminViewProps } from './adminTypes';
import { useAppContext } from '../../context/AppContext';

export interface AudioProviderData {
  id: number;
  provider_key: string;
  name: string;
  name_ar?: string;
  description_ar?: string;
  portal_url?: string;
  api_key_masked?: string;
  has_key: boolean;
  is_enabled: boolean;
  is_primary: boolean;
  priority: number;
  config: Record<string, any>;
  status: 'healthy' | 'degraded' | 'error' | 'untested' | 'free_tier';
  last_tested_at: string | null;
  last_error: string | null;
  latency_ms: number | null;
  capabilities: string[];
}

export const AudioInfrastructureView: React.FC<AdminViewProps> = ({
  theme,
  t,
  dir,
  showToast
}) => {
  const { token, language } = useAppContext();
  const isRtl = dir === 'rtl' || language === 'ar';

  const [providers, setProviders] = useState<AudioProviderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [showKeyVisible, setShowKeyVisible] = useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = useState<Record<string, { loading: boolean; result?: any }>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  const handleSyncTracks = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/audio/sync-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(
          isRtl
            ? `تمت مزامنة ${data.synced_count} مقطع ونغمة صوتية بنجاح داخل الخزنة المحلية`
            : `Successfully synced ${data.synced_count} tracks into local vault`,
          'success'
        );
      } else {
        showToast?.(data.message || 'Sync failed', 'error');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error syncing tracks', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchProviders = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/admin/audio/providers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      }
    } catch (err) {
      console.error('[AudioInfrastructure] Error fetching providers:', err);
      showToast?.(isRtl ? 'فشل جلب مزودي الصوت' : 'Failed to fetch audio providers', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProviders();
    }
  }, [token]);

  const handleTestConnection = async (provider: AudioProviderData) => {
    setTestingStatus(prev => ({ ...prev, [provider.provider_key]: { loading: true } }));

    try {
      const res = await fetch(`/api/admin/audio/providers/${provider.provider_key}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.(
          isRtl
            ? `تم فحص مزود الصوت بنجاح (${data.latency_ms}ms)`
            : `Audio provider pinged successfully (${data.latency_ms}ms)`,
          'success'
        );
        fetchProviders(true);
      } else {
        showToast?.(
          data.message || (isRtl ? 'فشل الاتصال بمزود الصوت' : 'Connection failed'),
          'error'
        );
      }
    } catch (err: any) {
      showToast?.(err.message || (isRtl ? 'خطأ أثناء الفحص' : 'Testing error'), 'error');
    } finally {
      setTestingStatus(prev => ({ ...prev, [provider.provider_key]: { loading: false } }));
    }
  };

  const handleSaveKey = async (provider: AudioProviderData) => {
    const rawKey = editingKeys[provider.provider_key];
    if (rawKey === undefined) return;

    setSavingStatus(prev => ({ ...prev, [provider.provider_key]: true }));

    try {
      const res = await fetch(`/api/admin/audio/providers/${provider.provider_key}/key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ api_key: rawKey })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.(
          isRtl ? 'تم حفظ وتشفير مفتاح المزود بنجاح' : 'API key encrypted and saved',
          'success'
        );
        setEditingKeys(prev => {
          const next = { ...prev };
          delete next[provider.provider_key];
          return next;
        });
        fetchProviders(true);
      } else {
        showToast?.(data.message || (isRtl ? 'فشل حفظ المفتاح' : 'Save failed'), 'error');
      }
    } catch (err: any) {
      showToast?.(err.message || (isRtl ? 'خطأ بالحفظ' : 'Save error'), 'error');
    } finally {
      setSavingStatus(prev => ({ ...prev, [provider.provider_key]: false }));
    }
  };

  const handleToggleEnable = async (provider: AudioProviderData) => {
    try {
      const res = await fetch(`/api/admin/audio/providers/${provider.provider_key}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_enabled: !provider.is_enabled })
      });

      if (res.ok) {
        showToast?.(
          provider.is_enabled
            ? isRtl ? 'تم تعطيل المزود' : 'Provider disabled'
            : isRtl ? 'تم تفعيل المزود' : 'Provider enabled',
          'info'
        );
        fetchProviders(true);
      }
    } catch (err) {
      console.error('Error toggling provider:', err);
    }
  };

  const handleSetPrimary = async (provider: AudioProviderData) => {
    try {
      const res = await fetch(`/api/admin/audio/providers/${provider.provider_key}/primary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        showToast?.(
          isRtl ? `تم تعيين ${provider.name} كمزود رئيسي` : `${provider.name} set as primary provider`,
          'success'
        );
        fetchProviders(true);
      }
    } catch (err) {
      console.error('Error setting primary:', err);
    }
  };

  const activeCount = providers.filter(p => p.is_enabled).length;
  const primaryProvider = providers.find(p => p.is_primary) || providers[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Diagnostic Status Bar (Orchestrator Style) */}
      <div className="p-5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-4 transition-theme">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] shrink-0 border border-[var(--border-default)] relative">
              <Music size={20} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fg-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--fg-success)]"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {isRtl ? 'خزانة ومزودو الصوت والموسيقى والمؤثرات' : 'Audio & Music Infrastructure Vault'}
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-xs)] text-[11px] font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse"></span>
                  <span>{isRtl ? 'محرك فيرال بوك نشط' : 'ViralBook Audio Active'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                  {activeCount} / {providers.length} {isRtl ? 'مزود نشط' : 'Active Providers'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Disc size={13} className="text-[var(--fg-accent)] shrink-0" />
                  <span>
                    {isRtl ? 'المزود الرئيسي:' : 'Primary Engine:'}{" "}
                    <strong className="text-[var(--text-primary)] font-semibold">
                      {primaryProvider?.name_ar || primaryProvider?.name || 'Local Vault'}
                    </strong>
                  </span>
                </div>

                <span className="hidden sm:inline text-[var(--border-default)]">•</span>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                  <span>
                    {isRtl ? 'التخزين المؤقت نشط' : 'Local Caching Enabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:self-auto self-start">
            <button
              onClick={handleSyncTracks}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] text-xs font-bold transition-all bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] hover:opacity-90 active:scale-95 disabled:opacity-50 shrink-0 shadow-xs cursor-pointer group touch-target-44"
              title={isRtl ? 'مزامنة وتخزين المقاطع الصوتية في الخزنة' : 'Sync & cache audio tracks from providers'}
            >
              <Zap size={14} className={isSyncing ? 'animate-bounce text-yellow-300' : 'text-yellow-300'} />
              <span>{isSyncing ? (isRtl ? 'جاري المزامنة...' : 'Syncing...') : (isRtl ? 'مزامنة الصوتيات' : 'Sync Audio Vault')}</span>
            </button>

            <button
              onClick={() => fetchProviders(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] text-xs font-bold transition-all border border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] hover:bg-[var(--surface-card)] active:scale-95 disabled:opacity-50 shrink-0 shadow-xs cursor-pointer group touch-target-44"
              title={isRtl ? 'تحديث المزودين' : 'Refresh providers'}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[var(--fg-accent)]" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2">
          <span>
            {isRtl
              ? 'ربط وتوجيه مفاتيح مكتبات الصوت والمؤثرات المفتوحة المصدر لقصص وريلز مجتمع بيربليكستا.'
              : 'Open-source audio and tracks provider configuration for ViralBook stories and short-form reels.'}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
            {isRtl ? 'البنية التحتية • الصوتيات' : 'Infrastructure • Audio'}
          </span>
        </div>
      </div>

      {/* Provider Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
          <RefreshCw size={24} className="animate-spin text-[var(--fg-success)]" />
          <span className="text-xs font-bold">{isRtl ? 'جاري جلب مزودي الصوت...' : 'Loading audio providers...'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map(provider => {
            const isEditing = editingKeys[provider.provider_key] !== undefined;
            const keyVal = editingKeys[provider.provider_key] ?? '';
            const isTesting = testingStatus[provider.provider_key]?.loading;
            const isSaving = savingStatus[provider.provider_key];

            return (
              <motion.div
                key={provider.provider_key}
                layout
                className={`relative overflow-hidden rounded-shape-sm border bg-[var(--surface-card)] p-4 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                  provider.is_primary
                    ? 'border-[var(--fg-success)]/50 ring-1 ring-emerald-500/20'
                    : provider.is_enabled
                    ? 'border-[var(--border-main)]'
                    : 'border-[var(--border-main)] opacity-70'
                }`}
              >
                {/* Header Section */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-shape-xs bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 text-[var(--fg-success)] flex items-center justify-center shrink-0 font-bold">
                        {provider.provider_key === 'perplexta_native' ? (
                          <Disc size={18} />
                        ) : provider.provider_key === 'freesound' ? (
                          <Volume2 size={18} />
                        ) : provider.provider_key === 'jamendo' ? (
                          <Music size={18} />
                        ) : (
                          <Radio size={18} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">
                            {isRtl ? provider.name_ar || provider.name : provider.name}
                          </h3>
                          {provider.is_primary && (
                            <span className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--fg-success)]/20 text-[var(--fg-success)] border border-[var(--fg-success)]/30 text-[9px] font-black flex items-center gap-0.5">
                              <Star size={9} className="fill-emerald-400" />
                              {isRtl ? 'رئيسي' : 'Primary'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                          {provider.provider_key}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border flex items-center gap-1 ${
                          provider.status === 'healthy'
                            ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/20'
                            : provider.status === 'free_tier'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : provider.status === 'untested'
                            ? 'bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border-[var(--fg-warning)]/20'
                            : 'bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] border-[var(--fg-danger)]/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            provider.status === 'healthy'
                              ? 'bg-[var(--fg-success)] animate-pulse'
                              : provider.status === 'free_tier'
                              ? 'bg-sky-400'
                              : provider.status === 'untested'
                              ? 'bg-[var(--fg-warning)]'
                              : 'bg-[var(--fg-danger)]'
                          }`}
                        />
                        {provider.status === 'healthy'
                          ? isRtl ? 'نشط وسريع' : 'Healthy'
                          : provider.status === 'free_tier'
                          ? isRtl ? 'معاينة مجانية' : 'Free Tier'
                          : provider.status === 'untested'
                          ? isRtl ? 'لم يختبر' : 'Untested'
                          : isRtl ? 'خطأ بالاتصال' : 'Error'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {provider.description_ar || provider.name}
                  </p>

                  {/* Capability Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {provider.capabilities.map(cap => (
                      <span
                        key={cap}
                        className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[9px] font-bold text-[var(--text-muted)]"
                      >
                        {cap === 'sfx_effects'
                          ? 'مؤثرات SFX'
                          : cap === 'ringtones'
                          ? 'نغمات رينج تون'
                          : cap === 'cinematic_ambient'
                          ? 'أجواء سينمائية'
                          : cap === 'cinematic_music'
                          ? 'موسيقى سينمائية'
                          : cap === 'lofi_vibes'
                          ? 'لوفي وهادئ'
                          : cap === 'royalty_free'
                          ? 'بدون حقوق ملكية'
                          : cap === 'cc_licensed'
                          ? 'مشاع إبداعي CC'
                          : cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* API Key Configuration Section */}
                {provider.provider_key !== 'perplexta_native' && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1">
                        <Key size={11} className="text-[var(--fg-success)]" />
                        {isRtl ? 'مفتاح الـ API (API Key / Client ID)' : 'API Key / Client ID'}
                      </label>
                    </div>

                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKeyVisible[provider.provider_key] ? 'text' : 'password'}
                          value={isEditing ? keyVal : provider.has_key ? '••••••••••••••••' : ''}
                          onChange={e =>
                            setEditingKeys(prev => ({
                              ...prev,
                              [provider.provider_key]: e.target.value
                            }))
                          }
                          placeholder={
                            provider.has_key
                              ? isRtl ? 'المفتاح مشفر ومحفوظ بالخزنة' : 'Encrypted key stored'
                              : isRtl ? 'أدخل مفتاح الـ API هنا...' : 'Enter API Key...'
                          }
                          className="w-full h-8 px-2.5 pe-8 text-xs font-mono rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--fg-success)]/40 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKeyVisible(prev => ({
                              ...prev,
                              [provider.provider_key]: !prev[provider.provider_key]
                            }))
                          }
                          className="absolute end-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          {showKeyVisible[provider.provider_key] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>

                      {isEditing && (
                        <button
                          onClick={() => handleSaveKey(provider)}
                          disabled={isSaving}
                          className="h-8 px-3 rounded-shape-xs bg-[var(--fg-success)] hover:bg-[var(--fg-success)] text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? <RefreshCw size={11} className="animate-spin" /> : <Check size={12} />}
                          <span>{isRtl ? 'حفظ' : 'Save'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Controls & Ping */}
                <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(provider)}
                      disabled={isTesting}
                      className="h-7 px-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] text-[10.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Activity size={11} className={isTesting ? 'animate-spin text-[var(--fg-success)]' : 'text-[var(--fg-success)]'} />
                      <span>{isRtl ? 'فحص الاتصال (Ping)' : 'Test Ping'}</span>
                    </button>

                    {provider.portal_url && (
                      <a
                        href={provider.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={isRtl ? 'فتح بوابة المزود بضغطة زر' : 'Open provider portal'}
                        className="h-7 px-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] hover:text-[var(--fg-success)] text-[10.5px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer group shadow-2xs"
                      >
                        <ExternalLink size={11} className="text-[var(--fg-success)] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        <span>{isRtl ? 'بوابة المزود' : 'Provider Portal'}</span>
                      </a>
                    )}

                    {!provider.is_primary && provider.is_enabled && (
                      <button
                        onClick={() => handleSetPrimary(provider)}
                        className="h-7 px-2 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--fg-success)] text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Star size={10} />
                        <span>{isRtl ? 'تعيين كرئيسي' : 'Set Primary'}</span>
                      </button>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provider.is_enabled}
                      onChange={() => handleToggleEnable(provider)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-[var(--surface-subtle)] peer-focus:outline-none rounded-[var(--radius-full)] peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[var(--border-default)] after:border after:rounded-[var(--radius-full)] after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--fg-success)]"></div>
                  </label>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
