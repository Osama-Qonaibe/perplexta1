import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Globe,
  Compass,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Layers,
  ExternalLink,
  RotateCcw,
  Info,
  Star,
  Cpu,
  Check
} from 'lucide-react';
import { MapsInfrastructureViewProps } from './adminTypes';
import { useAppContext } from '../../context/AppContext';

export interface MapProviderData {
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

export const MapsInfrastructureView: React.FC<MapsInfrastructureViewProps> = ({
  theme,
  t,
  dir,
  showToast
}) => {
  const { token, language } = useAppContext();
  const isRtl = dir === 'rtl' || language === 'ar';

  const [providers, setProviders] = useState<MapProviderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State for Editing Keys
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [showKeyVisible, setShowKeyVisible] = useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = useState<Record<string, { loading: boolean; result?: any }>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  const fetchProviders = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/admin/maps/providers', {
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
      console.error('[MapsInfrastructure] Error fetching providers:', err);
      showToast?.(isRtl ? 'فشل جلب مزودي الخرائط' : 'Failed to fetch map providers', 'error');
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

  // Test Provider Connection (Ping)
  const handleTestConnection = async (provider: MapProviderData) => {
    const keyToTest = editingKeys[provider.provider_key] !== undefined 
      ? editingKeys[provider.provider_key] 
      : undefined;

    setTestingStatus(prev => ({ ...prev, [provider.provider_key]: { loading: true } }));

    try {
      const res = await fetch('/api/admin/maps/providers/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          provider_key: provider.provider_key,
          api_key: keyToTest
        })
      });

      const data = await res.json();
      setTestingStatus(prev => ({
        ...prev,
        [provider.provider_key]: { loading: false, result: data }
      }));

      if (data.success) {
        showToast?.(
          isRtl ? `🟢 ${data.message_ar || 'تم التحقق بنجاح'}` : `🟢 ${data.message || 'Connected successfully'}`,
          'success'
        );
        fetchProviders(true);
      } else {
        showToast?.(
          isRtl ? `🔴 ${data.message_ar || 'فشل الاتصال بالمزود'}` : `🔴 ${data.message || 'Connection failed'}`,
          'error'
        );
      }
    } catch (err: any) {
      setTestingStatus(prev => ({
        ...prev,
        [provider.provider_key]: { loading: false, result: { success: false, message: err.message } }
      }));
      showToast?.(isRtl ? 'حدث خطأ أثناء فحص الاتصال' : 'Error testing connection', 'error');
    }
  };

  // Save Provider Credentials & Toggles
  const handleSaveProvider = async (provider: MapProviderData, overrideUpdates?: Partial<MapProviderData>) => {
    const updatedKey = editingKeys[provider.provider_key];
    setSavingStatus(prev => ({ ...prev, [provider.provider_key]: true }));

    try {
      const payload: any = {
        provider_key: provider.provider_key,
        name: overrideUpdates?.name || provider.name,
        is_enabled: overrideUpdates?.is_enabled !== undefined ? overrideUpdates.is_enabled : provider.is_enabled,
        is_primary: overrideUpdates?.is_primary !== undefined ? overrideUpdates.is_primary : provider.is_primary,
        priority: overrideUpdates?.priority !== undefined ? overrideUpdates.priority : provider.priority,
        config: overrideUpdates?.config || provider.config
      };

      if (updatedKey !== undefined) {
        payload.api_key = updatedKey;
      }

      const res = await fetch('/api/admin/maps/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showToast?.(
          isRtl ? 'تم حفظ وتشفير إعدادات المزود وتفعيله هجيناً بنجاح' : 'Map provider saved, encrypted and activated in hybrid mode',
          'success'
        );
        // Clear active editing buffer for this key
        setEditingKeys(prev => {
          const next = { ...prev };
          delete next[provider.provider_key];
          return next;
        });
        fetchProviders(true);
      } else {
        showToast?.(data.error || (isRtl ? 'فشل حفظ المزود' : 'Failed to save provider'), 'error');
      }
    } catch (err: any) {
      showToast?.(err.message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving provider'), 'error');
    } finally {
      setSavingStatus(prev => ({ ...prev, [provider.provider_key]: false }));
    }
  };

  // Toggle Provider Active Status
  const handleToggleActive = async (provider: MapProviderData) => {
    await handleSaveProvider(provider, { is_enabled: !provider.is_enabled });
  };

  // Set as Primary Provider
  const handleSetPrimary = async (provider: MapProviderData) => {
    await handleSaveProvider(provider, { is_primary: true, is_enabled: true });
  };

  // Reset / Clear API Key
  const handleResetKey = async (provider: MapProviderData) => {
    if (!window.confirm(isRtl ? `هل أنت متأكد من حذف مفتاح ${provider.name_ar || provider.name}؟` : `Are you sure you want to reset key for ${provider.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/maps/providers/${provider.provider_key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast?.(isRtl ? 'تم حذف المفتاح بنجاح' : 'API Key reset successfully', 'success');
        setEditingKeys(prev => {
          const next = { ...prev };
          delete next[provider.provider_key];
          return next;
        });
        fetchProviders(true);
      }
    } catch {
      showToast?.(isRtl ? 'فشل حذف المفتاح' : 'Failed to reset key', 'error');
    }
  };

  const getProviderIcon = (key: string) => {
    switch (key) {
      case 'openstreetmap':
        return <Globe className="w-6 h-6 text-[var(--fg-success)]" />;
      case 'google_maps':
        return <MapPin className="w-6 h-6 text-[var(--fg-accent)]" />;
      case 'mapbox':
        return <Compass className="w-6 h-6 text-[var(--fg-accent)]" />;
      case 'locationiq':
        return <Activity className="w-6 h-6 text-[var(--fg-warning)]" />;
      default:
        return <Server className="w-6 h-6 text-[var(--text-muted)]" />;
    }
  };

  const getCapabilityLabel = (cap: string) => {
    if (!isRtl) return cap.replace(/_/g, ' ');
    const map: Record<string, string> = {
      places_autocomplete: 'الإكمال التلقائي للأماكن',
      geocoding: 'تحويل العناوين لإحداثيات',
      reverse_geocoding: 'تحويل الإحداثيات لعنوان',
      places_details: 'تفاصيل الأماكن والمؤسسات',
      static_maps: 'خرائط ثابتة عالية الدقة',
      vector_tiles: 'طبقات الخرائط المتجهة',
      navigation: 'التوجيه والملاحة',
      satellite_imagery: 'صور الأقمار الصناعية',
      autocomplete: 'اقتراح المدن والبلدات',
      routing: 'حساب المسارات',
      free_unlimited: 'مجاني 100% وبلا قيود'
    };
    return map[cap] || cap.replace(/_/g, ' ');
  };

  const getStatusBadge = (provider: MapProviderData) => {
    if (provider.provider_key === 'openstreetmap') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--fg-success)]/20">
          <Sparkles className="w-3.5 h-3.5" />
          {isRtl ? 'مجاني ومتاح دائماً' : 'Free & Unlimited'}
        </span>
      );
    }

    if (!provider.has_key && editingKeys[provider.provider_key] === undefined) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
          <Key className="w-3.5 h-3.5" />
          {isRtl ? 'غير مهيأ (بدون مفتاح)' : 'Not Configured'}
        </span>
      );
    }

    if (provider.status === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--fg-success)]/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isRtl ? `متصل ومُفحوص (${provider.latency_ms || 0}ms)` : `Healthy (${provider.latency_ms || 0}ms)`}
        </span>
      );
    }

    if (provider.status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] dark:text-[var(--fg-danger)] border border-[var(--fg-danger)]/20">
          <AlertCircle className="w-3.5 h-3.5" />
          {isRtl ? 'خطأ في المصادقة' : 'Auth Error'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] dark:text-[var(--fg-warning)] border border-[var(--fg-warning)]/20">
        <Clock className="w-3.5 h-3.5" />
        {isRtl ? 'بانتظار الفحص' : 'Untested'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative font-sans">
      {/* Top Diagnostic Status Bar (Orchestrator Style) */}
      <div className="p-5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-4 transition-theme">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] shrink-0 border border-[var(--border-default)] relative">
              <MapPin size={20} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fg-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--fg-success)]"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {isRtl ? 'مزودو الخرائط والبيانات الجغرافية' : 'Maps & Geocoding Infrastructure'}
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-xs)] text-[11px] font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse"></span>
                  <span>{isRtl ? 'المحرك الهجين نشط' : 'Hybrid Engine Active'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                  {providers.filter(p => p.is_enabled).length} / {providers.length || 4} {isRtl ? 'مزود نشط' : 'Providers Active'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Globe size={13} className="text-[var(--fg-accent)] shrink-0" />
                  <span>
                    {isRtl ? 'المحرك الأساسي:' : 'Primary Engine:'}{" "}
                    <strong className="text-[var(--text-primary)] font-semibold">
                      {providers.find(p => p.is_primary)?.name_ar || providers.find(p => p.is_primary)?.name || 'OpenStreetMap'}
                    </strong>
                  </span>
                </div>

                <span className="hidden sm:inline text-[var(--border-default)]">•</span>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                  <span>
                    {isRtl ? 'تكلفة الاستعلام: $0.00 (مجاني)' : 'Cost: $0.00 (Free Tier)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:self-auto self-start">
            <button
              onClick={() => fetchProviders(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] text-xs font-bold transition-all border border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] hover:bg-[var(--surface-card)] active:scale-95 disabled:opacity-50 shrink-0 shadow-xs cursor-pointer group touch-target-44"
              title={isRtl ? 'تحديث وفحص حالة المزودين' : 'Refresh map providers'}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[var(--fg-accent)]" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span>{isRtl ? 'تحديث المزودين' : 'Refresh Providers'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2">
          <span>
            {isRtl
              ? 'إدارة مشفرة للبحث الجغرافي وتوجيه الخرائط مع تفعيل المفاتيح فور حفظها في قاعدة البيانات.'
              : 'Encrypted map and geocoding providers management with instant in-memory cache invalidation.'}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
            {isRtl ? 'البنية التحتية • الخرائط' : 'Infrastructure • Maps'}
          </span>
        </div>
      </div>

      {/* Quick Overview Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)]">
              {isRtl ? 'المحرك الافتراضي الأساسي' : 'Primary Engine'}
            </div>
            <div className="text-lg font-black text-[var(--fg-success)] dark:text-[var(--fg-success)] mt-1">
              {providers.find(p => p.is_primary)?.name_ar || providers.find(p => p.is_primary)?.name || (isRtl ? 'OpenStreetMap & Photon' : 'OpenStreetMap')}
            </div>
          </div>
          <div className="p-3 rounded-full bg-[var(--status-success-subtle)] text-[var(--fg-success)]">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)]">
              {isRtl ? 'تكلفة الاستعلام الحالية' : 'Current Operating Cost'}
            </div>
            <div className="text-lg font-black text-[var(--fg-success)] dark:text-[var(--fg-success)] mt-1">
              $0.00 / {isRtl ? 'مجاني بالكامل' : 'Zero Cost'}
            </div>
          </div>
          <div className="p-3 rounded-full bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)]">
              {isRtl ? 'المزودون النشطون هجيناً' : 'Active Hybrid Providers'}
            </div>
            <div className="text-lg font-black text-[var(--text-primary)] mt-1">
              {providers.filter(p => p.is_enabled).length} / {providers.length || 4}
            </div>
          </div>
          <div className="p-3 rounded-full bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)]">
              {isRtl ? 'حماية التشفير والذاكرة' : 'Vault & Cache Security'}
            </div>
            <div className="text-lg font-black text-[var(--fg-accent)] dark:text-[var(--fg-accent)] mt-1">
              AES-256 (0.001ms)
            </div>
          </div>
          <div className="p-3 rounded-full bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Server className="w-5 h-5 text-[var(--fg-accent)]" />
            {isRtl ? 'بطاقات ربط المزودين والخدمات' : 'Configured Map & Geocoding Providers'}
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {isRtl ? 'التوجيه الهجين مفعل تلقائياً' : 'Hybrid dynamic failover enabled'}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-72 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] animate-pulse p-6"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.filter(p => p.provider_key !== 'google_maps').map(provider => {
              const isOpenSource = provider.provider_key === 'openstreetmap';
              const isEditing = editingKeys[provider.provider_key] !== undefined;
              const currentKeyVal = isEditing ? editingKeys[provider.provider_key] : (provider.api_key_masked || '');
              const isVisible = showKeyVisible[provider.provider_key] || false;
              const isTesting = testingStatus[provider.provider_key]?.loading || false;
              const isSaving = savingStatus[provider.provider_key] || false;
              const portalUrl = provider.portal_url || provider.config?.portal_url;

              return (
                <motion.div
                  key={provider.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative p-6 rounded-shape-lg bg-[var(--surface-card)] border transition-all flex flex-col justify-between ${
                    provider.is_primary
                      ? 'border-[var(--fg-success)]/50 shadow-md ring-1 ring-emerald-500/20'
                      : provider.is_enabled
                      ? 'border-[var(--border-accent)]'
                      : 'border-[var(--border-main)] opacity-90'
                  }`}
                >
                  {/* Top Row: Icon, Title, Status & Toggle */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] mt-0.5">
                          {getProviderIcon(provider.provider_key)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-[var(--text-primary)]">
                              {isRtl ? (provider.name_ar || provider.name) : provider.name}
                            </h3>
                            {provider.is_primary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-[var(--fg-success)] text-white shadow-xs">
                                <Star className="w-3 h-3 fill-current" />
                                {isRtl ? 'المحرك الأساسي' : 'Primary'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                            {isRtl 
                              ? (provider.description_ar || (provider.provider_key === 'google_maps' ? 'المحرك الاحتياطي الصامت لتفاصيل الأماكن الدقيقة والبحث الجغرافي المعزز عالمياً.' : 'محرك الخرائط والمواقع الجغرافية.'))
                              : (provider.provider_key === 'google_maps' ? 'Official Google Places & Geocoding APIs with zero-fail failover.' : 'Map and geocoding engine.')
                            }
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Console Portal Button */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {getStatusBadge(provider)}
                        
                        {/* Provider Developer Console Portal Link */}
                        {portalUrl && (
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={isRtl ? 'فتح وحدة تحكم المزود الرسمية لإنشاء وجلب المفتاح' : 'Open official provider developer console'}
                            className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[32px] rounded-shape-sm text-xs font-bold bg-[var(--surface-subtle)] text-[var(--fg-accent)] dark:text-[var(--fg-accent)] hover:bg-[var(--bg-accent-subtle)] border border-[var(--border-main)] hover:border-[var(--border-accent)]/30 transition-all group"
                          >
                            <span>{isRtl ? 'بوابة المزود' : 'Console'}</span>
                            <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Capabilities Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {provider.capabilities?.map((cap, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)]"
                        >
                          {getCapabilityLabel(cap)}
                        </span>
                      ))}
                    </div>

                    {/* API Key Section (if not open source) */}
                    {!isOpenSource ? (
                      <div className="space-y-3 mb-6 p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-[var(--fg-accent)]" />
                            {isRtl ? 'مفتاح الـ API المشفر (Secret Key)' : 'Encrypted API Key'}
                          </label>
                          {provider.has_key && !isEditing && (
                            <button
                              type="button"
                              onClick={() => handleResetKey(provider)}
                              className="text-[11px] font-bold text-[var(--fg-danger)] hover:underline min-h-[30px] flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              {isRtl ? 'حذف المفتاح' : 'Reset Key'}
                            </button>
                          )}
                        </div>

                        <div className="relative flex items-center">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={currentKeyVal}
                            placeholder={
                              provider.provider_key === 'google_maps'
                                ? 'AIzaSy...'
                                : provider.provider_key === 'mapbox'
                                ? 'pk.eyJ1...'
                                : 'pk.xxxx...'
                            }
                            onChange={e => {
                              const val = e.target.value;
                              setEditingKeys(prev => ({ ...prev, [provider.provider_key]: val }));
                            }}
                            className="w-full pl-3 pr-20 py-2.5 min-h-[44px] rounded-shape-sm bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] text-sm font-mono focus:outline-none focus:border-[var(--border-accent)] transition-colors"
                          />
                          <div className="absolute right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setShowKeyVisible(prev => ({
                                  ...prev,
                                  [provider.provider_key]: !prev[provider.provider_key]
                                }))
                              }
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title={isVisible ? 'Hide' : 'Show'}
                            >
                              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {provider.provider_key === 'google_maps' && (
                          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-1">
                            <Info className="w-3.5 h-3.5 flex-shrink-0 text-[var(--fg-accent)]" />
                            <span>
                              {isRtl
                                ? 'يتم استهلاك المفتاح تلقائياً كاحتياط ذكي عند عدم توفر نتائج من المصادر المجانية.'
                                : 'Used automatically as smart failover when free sources return zero results.'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-shape-md bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 mb-6 text-xs text-[var(--fg-success)] dark:text-[var(--fg-success)] space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[var(--fg-success)]" />
                          {isRtl ? 'محرك مجاني ذاتي جاهز للعمل فوراً وبدون تكلفة' : 'Self-Sustaining Engine (Ready Out of the Box)'}
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          {isRtl
                            ? 'يدعم هذا المحرك استعلامات البحث وتحديد المواقع في كافة الدول والمدن والقرى دون أي حدود أو بطاقات ائتمانية.'
                            : 'Handles all global & local geocoding queries with zero external dependencies and zero bills.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="pt-4 border-t border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(provider)}
                        className={`px-3 py-1.5 min-h-[44px] rounded-shape-md text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                          provider.is_enabled
                            ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border-[var(--fg-success)]/30 hover:bg-[var(--status-success-subtle)]'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)] hover:bg-[var(--surface-subtle)]/80'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-[var(--radius-full)] ${provider.is_enabled ? 'bg-[var(--fg-success)]' : 'bg-[var(--text-muted)]'}`} />
                        {provider.is_enabled ? (isRtl ? 'مُفعل هجيناً' : 'Enabled') : (isRtl ? 'معطل' : 'Disabled')}
                      </button>

                      {/* Primary Toggle */}
                      {!provider.is_primary && provider.is_enabled && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(provider)}
                          className="px-3 py-1.5 min-h-[44px] rounded-shape-md text-xs font-bold bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--fg-success)] border border-[var(--border-main)] transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" />
                          {isRtl ? 'تعيين كأساسي' : 'Set as Primary'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Test Connection Button */}
                      <button
                        type="button"
                        onClick={() => handleTestConnection(provider)}
                        disabled={isTesting}
                        className="px-3.5 py-2 min-h-[44px] rounded-shape-md text-xs font-bold bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-card)] border border-[var(--border-main)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[var(--fg-accent)]' : 'text-[var(--fg-accent)]'}`} />
                        <span>{isTesting ? (isRtl ? 'جاري الفحص...' : 'Testing...') : (isRtl ? 'فحص الاتصال (Ping)' : 'Test Ping')}</span>
                      </button>

                      {/* Save Key Button (if edited) */}
                      {!isOpenSource && isEditing && (
                        <button
                          type="button"
                          onClick={() => handleSaveProvider(provider)}
                          disabled={isSaving}
                          className="px-4 py-2 min-h-[44px] rounded-shape-md text-xs font-bold bg-[var(--fg-accent)] hover:bg-[var(--fg-accent)] text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{isSaving ? (isRtl ? 'جاري الحفظ والتشفير...' : 'Saving...') : (isRtl ? 'حفظ وتفعيل هجين' : 'Save & Enable')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
