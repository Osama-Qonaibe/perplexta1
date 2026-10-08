import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Key,
  KeyRound,
  Lock,
  Globe,
  Copy,
  Check,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info,
  Server,
  Shield,
  Fingerprint
} from 'lucide-react';
import { AdminViewProps } from './adminTypes';
import { useAppContext } from '../../context/AppContext';
import { toast } from '@/design-system';

interface AuthProviderInfo {
  provider_id: string;
  name: string;
  name_ar: string;
  client_id: string;
  has_secret: boolean;
  is_configured: boolean;
  authorized_origins?: string[];
  redirect_uris?: string[];
  scopes?: string[];
  status: 'configured' | 'pending';
  team_id?: string;
  key_id?: string;
  has_private_key?: boolean;
}

interface AuthProvidersResponse {
  google: AuthProviderInfo;
  github: AuthProviderInfo;
  apple: AuthProviderInfo;
  microsoft: AuthProviderInfo;
  custom_config?: Record<string, any>;
}

export const AuthProvidersInfrastructureView: React.FC<AdminViewProps> = ({
  theme,
  t,
  dir,
  showToast
}) => {
  const { token, language } = useAppContext();
  const isRtl = dir === 'rtl' || language === 'ar';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);

  const [githubClientId, setGithubClientId] = useState('');
  const [githubClientSecret, setGithubClientSecret] = useState('');
  const [showGithubSecret, setShowGithubSecret] = useState(false);

  const [appleClientId, setAppleClientId] = useState('');
  const [appleTeamId, setAppleTeamId] = useState('');
  const [appleKeyId, setAppleKeyId] = useState('');
  const [applePrivateKey, setApplePrivateKey] = useState('');
  const [showAppleKey, setShowAppleKey] = useState(false);

  const [msClientId, setMsClientId] = useState('');
  const [msClientSecret, setMsClientSecret] = useState('');
  const [showMsSecret, setShowMsSecret] = useState(false);

  const [providersData, setProvidersData] = useState<AuthProvidersResponse | null>(null);

  const fetchAuthProviders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings/auth-providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: AuthProvidersResponse = await res.json();
        setProvidersData(data);
        
        // Google
        if (data.google) {
          setGoogleClientId(data.google.client_id || '');
          setGoogleClientSecret(data.google.has_secret ? '********' : '');
        }
        // GitHub
        if (data.github) {
          setGithubClientId(data.github.client_id || '');
          setGithubClientSecret(data.github.has_secret ? '********' : '');
        }
        // Apple
        if (data.apple) {
          setAppleClientId(data.apple.client_id || '');
          setAppleTeamId(data.apple.team_id || '');
          setAppleKeyId(data.apple.key_id || '');
          setApplePrivateKey(data.apple.has_private_key ? '********' : '');
        }
        // Microsoft
        if (data.microsoft) {
          setMsClientId(data.microsoft.client_id || '');
          setMsClientSecret(data.microsoft.has_secret ? '********' : '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch auth providers:', err);
      toast.error(isRtl ? 'فشل تحميل بيانات مزودي المصادقة' : 'Failed to load auth providers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAuthProviders();
    }
  }, [token]);

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    toast.success(isRtl ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveProvider = async (provider: 'google' | 'github' | 'apple' | 'microsoft') => {
    setIsSaving(provider);
    try {
      let body: any = { provider };

      if (provider === 'google') {
        if (!googleClientId.trim()) {
          toast.error(isRtl ? 'يرجى إدخال Google Client ID' : 'Google Client ID is required');
          setIsSaving(null);
          return;
        }
        body.clientId = googleClientId.trim();
        body.clientSecret = googleClientSecret;
      } else if (provider === 'github') {
        body.clientId = githubClientId.trim();
        body.clientSecret = githubClientSecret;
      } else if (provider === 'apple') {
        body.clientId = appleClientId.trim();
        body.teamId = appleTeamId.trim();
        body.keyId = appleKeyId.trim();
        body.privateKey = applePrivateKey;
      } else if (provider === 'microsoft') {
        body.clientId = msClientId.trim();
        body.clientSecret = msClientSecret;
      }

      const res = await fetch('/api/admin/settings/auth-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(isRtl ? `تم حفظ إعدادات ${provider.toUpperCase()} بنجاح` : `${provider.toUpperCase()} settings saved successfully`);
        await fetchAuthProviders();
      } else {
        const err = await res.json();
        toast.error(err.error || (isRtl ? 'فشل الحفظ' : 'Failed to save'));
      }
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'خطأ في الاتصال' : 'Connection error'));
    } finally {
      setIsSaving(null);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const googleCallbackUrl = `${originUrl}/api/auth/google/callback`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative font-sans">
      {/* Top Diagnostic Status Bar (Orchestrator Style) */}
      <div className="p-5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-4 transition-theme">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] shrink-0 border border-[var(--border-default)] relative">
              <Fingerprint size={20} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fg-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--fg-success)]"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {isRtl ? 'مزودو المصادقة والـ OAuth والتطبيقات الخارجية' : 'External Authentication & OAuth Providers'}
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-xs)] text-[11px] font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse"></span>
                  <span>{providersData?.google?.is_configured ? (isRtl ? 'Google OAuth نشط' : 'Google OAuth Active') : (isRtl ? 'بانتظار المفاتيح' : 'Setup Required')}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                  AES-256 VAULT
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={13} className="text-[var(--fg-accent)] shrink-0" />
                  <span>
                    {isRtl ? 'حالة المصادقة الموحدة:' : 'SSO Status:'}{" "}
                    <strong className="text-[var(--text-primary)] font-semibold">
                      {providersData?.google?.is_configured ? (isRtl ? 'تسجيل الدخول بنقرة واحدة مفعل' : 'One-Click Sign-In Enabled') : (isRtl ? 'غير مكتمل' : 'Not Configured')}
                    </strong>
                  </span>
                </div>

                <span className="hidden sm:inline text-[var(--border-default)]">•</span>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                  <span>
                    {isRtl ? 'Google, GitHub, Apple, Microsoft' : 'Multi-Provider Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:self-auto self-start">
            <button
              onClick={fetchAuthProviders}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] text-xs font-bold transition-all border border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] hover:bg-[var(--surface-card)] active:scale-95 disabled:opacity-50 shrink-0 shadow-xs cursor-pointer group touch-target-44"
              title={isRtl ? 'تحديث وفحص حالة مزودي المصادقة' : 'Refresh auth providers vault'}
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-[var(--fg-accent)]" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span>{isRtl ? 'تحديث الخزانة' : 'Refresh Vault'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2">
          <span>
            {isRtl
              ? 'إدارة مفاتيح الـ OAuth وتكاملات تسجيل الدخول الموحد (SSO) للتطبيقات الخارجية مع تشفير AES-256 وحفظ معزول.'
              : 'Sovereign OAuth credentials management, single sign-on (SSO) integrations, and external authentication vaults with AES-256 encryption.'}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
            {isRtl ? 'البنية التحتية • المصادقة' : 'Infrastructure • Auth Vault'}
          </span>
        </div>
      </div>

      {/* 1. Google OAuth 2.0 Provider Card (Primary) */}
      <div className="p-6 md:p-8 rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs transition-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-black text-base text-[var(--fg-danger)] shadow-2xs">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isRtl ? 'مصادقة قوقل (Google OAuth 2.0)' : 'Google OAuth 2.0'}
                </h2>
                {providersData?.google?.is_configured ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/20">
                    {isRtl ? 'مُفعّل' : 'ACTIVE'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--status-warning-subtle)] text-[var(--fg-warning)] border border-[var(--fg-warning)]/20">
                    {isRtl ? 'غير مكتمل' : 'SETUP REQUIRED'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isRtl ? 'تمكين تسجيل الدخول ومصادقة المستخدمين بنقرة واحدة عبر حسابات Google' : 'One-click user authentication and signup via Google Identity Services'}
              </p>
            </div>
          </div>

          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-accent hover:underline shrink-0"
          >
            <span>Google Cloud Console</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Google Client ID <span className="text-[var(--fg-danger)]">*</span>
            </label>
            <input
              type="text"
              value={googleClientId}
              dir="ltr"
              onChange={(e) => setGoogleClientId(e.target.value)}
              placeholder="e.g. 123456789-abcdefgh.apps.googleusercontent.com"
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Google Client Secret
              </label>
              <button
                type="button"
                onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                {showGoogleSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showGoogleSecret ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار' : 'Show')}</span>
              </button>
            </div>
            <input
              type={showGoogleSecret ? 'text' : 'password'}
              value={googleClientSecret}
              dir="ltr"
              onChange={(e) => setGoogleClientSecret(e.target.value)}
              placeholder={googleClientSecret === '********' ? '••••••••' : 'Enter client secret'}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
            />
            {googleClientSecret === '********' && (
              <p className="text-[11px] text-[var(--fg-warning)] mt-1">
                {isRtl ? 'المفتاح السري محفوظ ومشفّر بـ AES-256. اتركه كما هو دون تعديل إذا كنت لا ترغب بتغييره.' : 'Secret is encrypted in vault. Leave as is if unchanged.'}
              </p>
            )}
          </div>
        </div>

        {/* Authorized URIs & Copy helper */}
        <div className="mt-6 p-4 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Globe size={14} className="text-accent" />
              {isRtl ? 'روابط التوجيه المعتمدة لـ Google Console' : 'Authorized URIs for Google Cloud Console'}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {isRtl ? 'انسخ الروابط التالية والصقها في إعدادات OAuth بـ Google Cloud' : 'Copy and paste into your Google Cloud Credentials settings'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Authorized JavaScript Origin</span>
                <span className="text-xs font-mono text-[var(--text-primary)] truncate block mt-0.5">{originUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(originUrl, 'origin')}
                className="p-2 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 touch-target-44 flex items-center justify-center"
                title="Copy Origin"
              >
                {copiedKey === 'origin' ? <Check size={14} className="text-[var(--fg-success)]" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="p-3 rounded bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Authorized Redirect URI</span>
                <span className="text-xs font-mono text-[var(--text-primary)] truncate block mt-0.5">{googleCallbackUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(googleCallbackUrl, 'redirect')}
                className="p-2 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 touch-target-44 flex items-center justify-center"
                title="Copy Redirect URI"
              >
                {copiedKey === 'redirect' ? <Check size={14} className="text-[var(--fg-success)]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => handleSaveProvider('google')}
            disabled={isSaving === 'google'}
            className="flex items-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-6 py-2.5 rounded-[var(--radius-sm)] transition-theme font-bold text-xs shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer touch-target-44"
          >
            {isSaving === 'google' ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{isRtl ? 'حفظ الإعدادات' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* 2. GitHub OAuth Provider Card */}
      <div className="p-6 md:p-8 rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs transition-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-base text-[var(--text-primary)] shadow-2xs">
              GH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isRtl ? 'مصادقة غيت هاب (GitHub OAuth)' : 'GitHub OAuth'}
                </h2>
                {providersData?.github?.is_configured ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/20">
                    {isRtl ? 'مُفعّل' : 'ACTIVE'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                    {isRtl ? 'جاهز للإعداد' : 'OPTIONAL'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isRtl ? 'تسجيل الدخول ومصادقة المطورين عبر حسابات GitHub' : 'Developer authentication and authorization via GitHub OAuth Apps'}
              </p>
            </div>
          </div>

          <a
            href="https://github.com/settings/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-accent hover:underline shrink-0"
          >
            <span>GitHub Developer Apps</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              GitHub Client ID
            </label>
            <input
              type="text"
              value={githubClientId}
              dir="ltr"
              onChange={(e) => setGithubClientId(e.target.value)}
              placeholder="e.g. Iv1.1234567890abcdef"
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                GitHub Client Secret
              </label>
              <button
                type="button"
                onClick={() => setShowGithubSecret(!showGithubSecret)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                {showGithubSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showGithubSecret ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار' : 'Show')}</span>
              </button>
            </div>
            <input
              type={showGithubSecret ? 'text' : 'password'}
              value={githubClientSecret}
              dir="ltr"
              onChange={(e) => setGithubClientSecret(e.target.value)}
              placeholder={githubClientSecret === '********' ? '••••••••' : 'Enter GitHub client secret'}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => handleSaveProvider('github')}
            disabled={isSaving === 'github'}
            className="flex items-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-6 py-2.5 rounded-[var(--radius-sm)] transition-theme font-bold text-xs shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer touch-target-44"
          >
            {isSaving === 'github' ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{isRtl ? 'حفظ الإعدادات' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* 3. Sign in with Apple Card */}
      <div className="p-6 md:p-8 rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs transition-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-base text-[var(--text-primary)] shadow-2xs">
              
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isRtl ? 'تسجيل الدخول مع آبل (Sign in with Apple)' : 'Sign in with Apple'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                  {isRtl ? 'توسعة مستقبلية' : 'EXPANDABLE'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isRtl ? 'مصادقة مستخدمي أجهزة Apple و iOS عبر Apple Developer Services' : 'Secure Apple ID authentication for iOS and Web platforms'}
              </p>
            </div>
          </div>

          <a
            href="https://developer.apple.com/account/resources/identifiers/list"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-accent hover:underline shrink-0"
          >
            <span>Apple Developer Portal</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Services ID (Client ID)
            </label>
            <input
              type="text"
              value={appleClientId}
              dir="ltr"
              onChange={(e) => setAppleClientId(e.target.value)}
              placeholder="e.g. com.perplexta.service"
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Team ID & Key ID
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={appleTeamId}
                dir="ltr"
                onChange={(e) => setAppleTeamId(e.target.value)}
                placeholder="Team ID (10 chars)"
                className="w-full px-3 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
              />
              <input
                type="text"
                value={appleKeyId}
                dir="ltr"
                onChange={(e) => setAppleKeyId(e.target.value)}
                placeholder="Key ID (10 chars)"
                className="w-full px-3 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => handleSaveProvider('apple')}
            disabled={isSaving === 'apple'}
            className="flex items-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-6 py-2.5 rounded-[var(--radius-sm)] transition-theme font-bold text-xs shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer touch-target-44"
          >
            {isSaving === 'apple' ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{isRtl ? 'حفظ الإعدادات' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* 4. Microsoft Entra ID Card */}
      <div className="p-6 md:p-8 rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-xs transition-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-base text-[var(--fg-accent)] shadow-2xs">
              MS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isRtl ? 'مصادقة مايكروسوفت (Microsoft Entra / Azure AD)' : 'Microsoft Entra / Azure AD'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                  {isRtl ? 'توسعة مستقبلية' : 'ENTERPRISE'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isRtl ? 'مصادقة الشركات والمؤسسات عبر Microsoft 365 و Azure Active Directory' : 'Enterprise single sign-on via Microsoft Azure AD and Office 365 accounts'}
              </p>
            </div>
          </div>

          <a
            href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-accent hover:underline shrink-0"
          >
            <span>Azure App Registrations</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Application (Client) ID
            </label>
            <input
              type="text"
              value={msClientId}
              dir="ltr"
              onChange={(e) => setMsClientId(e.target.value)}
              placeholder="e.g. 00000000-0000-0000-0000-000000000000"
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Client Secret
              </label>
              <button
                type="button"
                onClick={() => setShowMsSecret(!showMsSecret)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                {showMsSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showMsSecret ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار' : 'Show')}</span>
              </button>
            </div>
            <input
              type={showMsSecret ? 'text' : 'password'}
              value={msClientSecret}
              dir="ltr"
              onChange={(e) => setMsClientSecret(e.target.value)}
              placeholder={msClientSecret === '********' ? '••••••••' : 'Enter Microsoft client secret'}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => handleSaveProvider('microsoft')}
            disabled={isSaving === 'microsoft'}
            className="flex items-center gap-2 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-on-emphasis)] px-6 py-2.5 rounded-[var(--radius-sm)] transition-theme font-bold text-xs shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer touch-target-44"
          >
            {isSaving === 'microsoft' ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{isRtl ? 'حفظ الإعدادات' : 'Save Config'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
