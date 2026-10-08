import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Search,
  Shield,
  Zap,
  Server,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Code
} from 'lucide-react';
import { ThemeTokensMap } from '../types';

interface LiveThemePreviewProps {
  tokens: ThemeTokensMap;
  mode: 'light' | 'dark';
  language: string;
}

export const LiveThemePreview: React.FC<LiveThemePreviewProps> = ({ tokens, mode, language }) => {
  const isAr = language === 'ar';
  
  const [composerText, setComposerText] = useState('');
  const [composerModel, setComposerModel] = useState<'GLM-4.6' | 'Gemini 2.5' | 'Claude 3.7'>('GLM-4.6');
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [isAuthFocused, setIsAuthFocused] = useState(false);

  const [streamingKey, setStreamingKey] = useState(0);

  const [copiedCss, setCopiedCss] = useState(false);

  const [sandboxTab, setSandboxTab] = useState<'components' | 'composer' | 'cards' | 'css'>('components');

  const surfacePage = tokens['--surface-page'] || (mode === 'dark' ? '#0d1117' : '#ffffff');
  const surfaceCard = tokens['--surface-card'] || (mode === 'dark' ? '#161b22' : '#ffffff');
  const surfaceSubtle = tokens['--surface-subtle'] || (mode === 'dark' ? '#161b22' : '#f6f8fa');
  const surfaceInset = tokens['--surface-inset'] || (mode === 'dark' ? '#010409' : '#f6f8fa');
  
  const fgPrimary = tokens['--fg-primary'] || (mode === 'dark' ? '#e6edf3' : '#1f2328');
  const fgSecondary = tokens['--fg-secondary'] || (mode === 'dark' ? '#8b949e' : '#32383f');
  const fgMuted = tokens['--fg-muted'] || (mode === 'dark' ? '#8b949e' : '#656d76');
  const fgDanger = tokens['--fg-danger'] || (mode === 'dark' ? '#f85149' : '#cf222e');
  const fgOnEmphasis = tokens['--fg-on-emphasis'] || '#ffffff';
  
  const githubGreen = tokens['--github-green'] || (mode === 'dark' ? '#238636' : '#1a7f37');
  const githubBlue = tokens['--github-blue'] || (mode === 'dark' ? '#58a6ff' : '#0969da');
  const githubPurple = tokens['--github-purple'] || (mode === 'dark' ? '#a371f7' : '#8250df');
  const githubOrange = tokens['--github-orange'] || (mode === 'dark' ? '#db6d28' : '#bc4c00');
  
  const borderDefault = tokens['--border-default'] || (mode === 'dark' ? '#3d444d' : '#d0d7de');
  const borderFocus = tokens['--border-focus'] || githubBlue;
  
  const btnPrimaryBg = tokens['--bg-btn-primary'] || githubGreen;
  const btnPrimaryFg = tokens['--fg-btn-primary'] || '#ffffff';
  
  const radiusSm = tokens['--radius-sm'] || '8px';
  const radiusMd = tokens['--radius-md'] || '12px';
  const radiusLg = tokens['--radius-lg'] || '16px';

  const fontDisplay = tokens['--font-display'] || '"Cairo", "Geist", system-ui, sans-serif';
  const fontMono = tokens['--font-mono'] || '"Geist Mono", "JetBrains Mono", monospace';

  const handleComposerInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerText(e.target.value);
    if (composerTextareaRef.current) {
      composerTextareaRef.current.style.height = 'auto';
      composerTextareaRef.current.style.height = `${Math.max(36, Math.min(composerTextareaRef.current.scrollHeight, 180))}px`;
    }
  };

  const handleCopyGeneratedCss = () => {
    const cssLines = Object.entries(tokens)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    const fullCss = `:root${mode === 'dark' ? '.dark, [data-theme="dark"]' : ''} {\n${cssLines}\n}`;
    navigator.clipboard.writeText(fullCss);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  return (
    <div
      className="rounded-[var(--radius-lg)] border shadow-lg transition-all duration-200 overflow-hidden"
      style={{
        backgroundColor: surfacePage,
        borderColor: borderDefault,
        color: fgPrimary,
        fontFamily: fontDisplay,
      }}
    >
      <div
        className="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: surfaceCard,
          borderColor: borderDefault,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center font-bold text-sm shadow-xs"
            style={{
              background: `linear-gradient(135deg, ${githubGreen}, ${githubBlue}, ${githubPurple})`,
              color: '#ffffff',
            }}
          >
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight" style={{ color: fgPrimary }}>
                {isAr ? 'مختبر المعاينة الحية والتفاعل الشامل' : 'Live Interactive Component Lab'}
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                style={{
                  backgroundColor: mode === 'dark' ? 'rgba(88,166,255,0.15)' : 'rgba(9,105,218,0.12)',
                  color: githubBlue,
                  border: `1px solid ${borderDefault}`,
                }}
              >
                {mode === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
              </span>
            </div>
            <p className="text-[11px]" style={{ color: fgMuted }}>
              {isAr
                ? 'استجابة حية لكافة متغيرات التصميم مع محاكاة حقيقية للمكونات'
                : 'Real-time rendering for all design tokens with active physics'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-sm)] border" style={{ backgroundColor: surfaceSubtle, borderColor: borderDefault }}>
          <button
            type="button"
            onClick={() => setSandboxTab('components')}
            className={`px-3 py-1 text-xs font-semibold rounded-shape-sm transition-all cursor-pointer ${
              sandboxTab === 'components' ? 'shadow-xs' : ''
            }`}
            style={{
              backgroundColor: sandboxTab === 'components' ? surfaceCard : 'transparent',
              color: sandboxTab === 'components' ? githubBlue : fgMuted,
            }}
          >
            {isAr ? 'الأزرار والقوائم' : 'Controls & Menus'}
          </button>
          <button
            type="button"
            onClick={() => setSandboxTab('composer')}
            className={`px-3 py-1 text-xs font-semibold rounded-shape-sm transition-all cursor-pointer ${
              sandboxTab === 'composer' ? 'shadow-xs' : ''
            }`}
            style={{
              backgroundColor: sandboxTab === 'composer' ? surfaceCard : 'transparent',
              color: sandboxTab === 'composer' ? githubGreen : fgMuted,
            }}
          >
            {isAr ? 'حاوية المحادثة (Composer)' : 'Chat Composer'}
          </button>
          <button
            type="button"
            onClick={() => setSandboxTab('cards')}
            className={`px-3 py-1 text-xs font-semibold rounded-shape-sm transition-all cursor-pointer ${
              sandboxTab === 'cards' ? 'shadow-xs' : ''
            }`}
            style={{
              backgroundColor: sandboxTab === 'cards' ? surfaceCard : 'transparent',
              color: sandboxTab === 'cards' ? githubPurple : fgMuted,
            }}
          >
            {isAr ? 'البطاقات والإحصاء' : 'Stats & Dividers'}
          </button>
          <button
            type="button"
            onClick={() => setSandboxTab('css')}
            className={`px-3 py-1 text-xs font-semibold rounded-shape-sm transition-all cursor-pointer ${
              sandboxTab === 'css' ? 'shadow-xs' : ''
            }`}
            style={{
              backgroundColor: sandboxTab === 'css' ? surfaceCard : 'transparent',
              color: sandboxTab === 'css' ? githubOrange : fgMuted,
            }}
          >
            <Code size={12} className="inline mr-1" />
            CSS Output
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6" style={{ backgroundColor: surfacePage }}>
        {sandboxTab === 'components' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className="p-5 border space-y-4"
              style={{
                backgroundColor: surfaceCard,
                borderColor: borderDefault,
                borderRadius: radiusMd,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: borderDefault }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: fgSecondary }}>
                  {isAr ? 'حزمة الأزرار الرسمية (5 أنماط)' : 'Sovereign Button Suite (5 Styles)'}
                </span>
                <span className="text-[10px] font-mono" style={{ color: fgMuted }}>
                  hover: translateY(-1px)
                </span>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-fast active:translate-y-0"
                  style={{
                    backgroundColor: btnPrimaryBg,
                    color: btnPrimaryFg,
                    borderRadius: radiusSm,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 2px 6px 0 ${githubGreen}44`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.2)';
                  }}
                >
                  <Send size={14} />
                  <span>{isAr ? 'زر الإجراء الرئيسي (Primary Action)' : 'Primary Action Button'}</span>
                </button>

                <button
                  type="button"
                  className="w-full py-2.5 px-4 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-fast"
                  style={{
                    backgroundColor: surfaceCard,
                    color: fgPrimary,
                    borderColor: borderDefault,
                    borderWidth: '1.5px',
                    borderStyle: 'solid',
                    borderRadius: radiusSm,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = surfaceSubtle;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = surfaceCard;
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <span>{isAr ? 'تسجيل الدخول عبر Google' : 'Continue with Google'}</span>
                </button>

                <button
                  type="button"
                  className="w-full py-2 px-3 text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-fast"
                  style={{
                    backgroundColor: `${githubPurple}18`,
                    borderColor: `${githubPurple}40`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: githubPurple,
                    borderRadius: radiusSm,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={14} />
                    <span>{isAr ? 'لوحة تحكم المشرف (Admin Suite)' : 'Admin Command Console'}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${githubPurple}30` }}>
                    ADMIN
                  </span>
                </button>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium border rounded-shape-sm flex items-center gap-1.5 cursor-pointer transition-all"
                      style={{
                        backgroundColor: surfaceSubtle,
                        borderColor: borderDefault,
                        color: fgPrimary,
                      }}
                    >
                      <Sparkles size={13} style={{ color: githubBlue }} />
                      <span>{isAr ? 'أدوات الذكاء' : 'AI Tools'}</span>
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium border rounded-shape-sm flex items-center gap-1.5 cursor-pointer transition-all"
                      style={{
                        backgroundColor: `${githubGreen}18`,
                        borderColor: `${githubGreen}40`,
                        color: githubGreen,
                      }}
                    >
                      <Check size={13} />
                      <span>{isAr ? 'تم الحفظ' : 'Saved'}</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono" style={{ color: fgMuted }}>
                    Min 44px Hit Target
                  </span>
                </div>
              </div>
            </div>

            <div
              className="p-5 border space-y-5"
              style={{
                backgroundColor: surfaceCard,
                borderColor: borderDefault,
                borderRadius: radiusMd,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: borderDefault }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: fgSecondary }}>
                  {isAr ? 'حقول الإدخال والقائمة المنسدلة' : 'Input Focus Ring & Portal Dropdown'}
                </span>
                <span className="text-[10px] font-mono" style={{ color: fgMuted }}>
                  box-shadow: 3px ring
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold block" style={{ color: fgSecondary }}>
                  {isAr ? 'حقل إدخال بريد المصادقة' : 'Authentication Email Input'}
                </label>
                <div className="relative">
                  <Search size={14} className="absolute top-3 start-3" style={{ color: fgMuted }} />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    onFocus={() => setIsAuthFocused(true)}
                    onBlur={() => setIsAuthFocused(false)}
                    placeholder={isAr ? 'admin@perplexta.ai' : 'Enter email address...'}
                    className="w-full ps-9 pe-3 py-2 text-xs outline-none transition-all duration-fast"
                    style={{
                      backgroundColor: surfacePage,
                      color: fgPrimary,
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      borderColor: isAuthFocused ? borderFocus : borderDefault,
                      borderRadius: radiusSm,
                      boxShadow: isAuthFocused ? `0 0 0 3px ${githubBlue}2e` : 'none',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-semibold block" style={{ color: fgSecondary }}>
                  {isAr ? 'قائمة المستخدم المنسدلة (User Popover)' : 'User Menu Portal Dropdown'}
                </label>

                <div className="relative inline-block w-full">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-full flex items-center justify-between p-2 border rounded-[var(--radius-sm)] cursor-pointer transition-all"
                    style={{
                      backgroundColor: surfaceSubtle,
                      borderColor: isMenuOpen ? githubBlue : borderDefault,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{
                          background: `linear-gradient(135deg, ${githubGreen}, ${githubBlue})`,
                          color: '#ffffff',
                        }}
                      >
                        P
                      </div>
                      <div className="text-start">
                        <div className="text-xs font-bold" style={{ color: fgPrimary }}>Perplexta Admin</div>
                        <div className="text-[10px]" style={{ color: fgMuted }}>admin@perplexta.com</div>
                      </div>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-fast ${isMenuOpen ? 'rotate-180' : ''}`} style={{ color: fgMuted }} />
                  </button>

                  {isMenuOpen && (
                    <div
                      className="absolute z-20 top-full mt-1.5 w-full border rounded-[var(--radius-md)] overflow-hidden shadow-2xl animate-fade-in"
                      style={{
                        backgroundColor: surfaceCard,
                        borderColor: borderDefault,
                        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.5), 0 4px 12px -2px rgba(0,0,0,0.25)',
                      }}
                    >
                      <div className="p-1 space-y-0.5 text-xs">
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-shape-sm text-start cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors"
                          style={{ color: fgPrimary }}
                        >
                          <User size={13} style={{ color: githubBlue }} />
                          <span>{isAr ? 'الملف الشخصي' : 'Profile Settings'}</span>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-shape-sm text-start cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors"
                          style={{ color: fgPrimary }}
                        >
                          <Settings size={13} style={{ color: githubPurple }} />
                          <span>{isAr ? 'إعدادات النظام' : 'System Preferences'}</span>
                        </button>
                        <div className="my-1 border-t" style={{ borderColor: borderDefault }} />
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-shape-sm text-start cursor-pointer transition-colors"
                          style={{ color: fgDanger }}
                        >
                          <LogOut size={13} />
                          <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {sandboxTab === 'composer' && (
          <div className="space-y-4">
            <div
              className="p-5 border space-y-4"
              style={{
                backgroundColor: surfaceCard,
                borderColor: borderDefault,
                borderRadius: radiusMd,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: borderDefault }}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} style={{ color: githubGreen }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: fgSecondary }}>
                    {isAr ? 'حاوية الإدخال الذكية (Sovereign Composer Shell)' : 'Sovereign Composer Shell'}
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: fgMuted }}>
                  border: 1.5px | radius: 16px
                </span>
              </div>

              <div
                className="relative flex flex-col transition-all duration-180 overflow-hidden"
                style={{
                  backgroundColor: surfaceCard,
                  borderColor: isComposerFocused ? borderFocus : borderDefault,
                  borderWidth: '1.5px',
                  borderStyle: 'solid',
                  borderRadius: radiusLg,
                  boxShadow: isComposerFocused
                    ? `0 0 0 3px ${githubBlue}2e, 0 1px 3px 0 rgba(0,0,0,0.12)`
                    : '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}
              >
                <div className="flex items-end gap-2 p-3 min-h-[76px]">
                  <textarea
                    ref={composerTextareaRef}
                    rows={1}
                    value={composerText}
                    onChange={handleComposerInput}
                    onFocus={() => setIsComposerFocused(true)}
                    onBlur={() => setIsComposerFocused(false)}
                    placeholder={isAr ? 'اكتب رسالتك أو صف متطلباتك البرمجية...' : 'Ask Perplexta or write your prompt here...'}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed p-1"
                    style={{ color: fgPrimary, fontFamily: fontDisplay }}
                  />
                  <div className="flex items-end shrink-0 pb-0.5">
                    <button
                      type="button"
                      disabled={!composerText.trim()}
                      className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: composerText.trim() ? githubGreen : surfaceSubtle,
                        color: composerText.trim() ? '#ffffff' : fgMuted,
                        boxShadow: composerText.trim() ? '0 1px 2px 0 rgba(0,0,0,0.2)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (composerText.trim()) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = `0 2px 6px 0 ${githubGreen}44`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between gap-2 px-3 py-2 border-t flex-wrap"
                  style={{ borderColor: `${borderDefault}80`, backgroundColor: `${surfaceSubtle}60` }}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-semibold border cursor-pointer"
                      style={{
                        backgroundColor: surfaceCard,
                        borderColor: borderDefault,
                        color: fgPrimary,
                      }}
                    >
                      <Sparkles size={12} style={{ color: githubBlue }} />
                      <span>Meta · Perplexta Core</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setComposerModel(
                          composerModel === 'GLM-4.6'
                            ? 'Gemini 2.5'
                            : composerModel === 'Gemini 2.5'
                            ? 'Claude 3.7'
                            : 'GLM-4.6'
                        )
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-semibold border cursor-pointer"
                      style={{
                        backgroundColor: surfaceCard,
                        borderColor: borderDefault,
                        color: fgPrimary,
                      }}
                    >
                      <span>{composerModel}</span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase"
                        style={{
                          backgroundColor: `${githubPurple}22`,
                          color: githubPurple,
                        }}
                      >
                        {isAr ? 'أقوى' : 'SOVEREIGN'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                key={streamingKey}
                className="p-4 border rounded-[var(--radius-md)] flex items-start gap-3"
                style={{
                  backgroundColor: surfaceSubtle,
                  borderColor: borderDefault,
                }}
              >
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center font-bold text-xs shrink-0"
                  style={{ backgroundColor: githubGreen, color: fgOnEmphasis }}
                >
                  <Bot size={14} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: fgPrimary }}>Perplexta Intelligence</span>
                    <button
                      type="button"
                      onClick={() => setStreamingKey((k) => k + 1)}
                      className="text-[10px] flex items-center gap-1 cursor-pointer font-mono"
                      style={{ color: githubBlue }}
                    >
                      <RotateCcw size={10} />
                      <span>{isAr ? 'إعادة تشغيل المؤشر' : 'Replay Blink'}</span>
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: fgPrimary }}>
                    {isAr
                      ? 'النظام يعمل بكفاءة استجابة كاملة مع توحيد المتغيرات الهندسية'
                      : 'System runtime operating under unified mathematical token matrix'}
                    <span className="inline-block w-2 h-3.5 ms-1 rounded-xs align-middle animate-pulse" style={{ backgroundColor: githubGreen }} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {sandboxTab === 'cards' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className="p-4 border rounded-[var(--radius-md)] space-y-2 transition-all hover:border-[var(--github-blue)] cursor-pointer"
                style={{ backgroundColor: surfaceCard, borderColor: borderDefault }}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center"
                  style={{ backgroundColor: `${githubBlue}18`, color: githubBlue }}
                >
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono" style={{ color: fgPrimary }}>1,482</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: fgMuted }}>
                    {isAr ? 'المستخدمون النشطون' : 'Active Users'}
                  </div>
                </div>
              </div>

              <div
                className="p-4 border rounded-[var(--radius-md)] space-y-2 transition-all hover:border-[var(--github-green)] cursor-pointer"
                style={{ backgroundColor: surfaceCard, borderColor: borderDefault }}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center"
                  style={{ backgroundColor: `${githubGreen}18`, color: githubGreen }}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono" style={{ color: fgPrimary }}>84,290</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: fgMuted }}>
                    {isAr ? 'المحادثات المنجزة' : 'Total Prompts'}
                  </div>
                </div>
              </div>

              <div
                className="p-4 border rounded-[var(--radius-md)] space-y-2 transition-all hover:border-[var(--github-purple)] cursor-pointer"
                style={{ backgroundColor: surfaceCard, borderColor: borderDefault }}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center"
                  style={{ backgroundColor: `${githubPurple}18`, color: githubPurple }}
                >
                  <Zap size={16} />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono" style={{ color: fgPrimary }}>100%</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: fgMuted }}>
                    {isAr ? 'النماذج المفعلة' : 'Model Uptime'}
                  </div>
                </div>
              </div>

              <div
                className="p-4 border rounded-[var(--radius-md)] space-y-2 transition-all hover:border-[var(--github-orange)] cursor-pointer"
                style={{ backgroundColor: surfaceCard, borderColor: borderDefault }}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center"
                  style={{ backgroundColor: `${githubOrange}18`, color: githubOrange }}
                >
                  <Server size={16} />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono" style={{ color: fgPrimary }}>2 Nodes</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: fgMuted }}>
                    {isAr ? 'خوادم GPU' : 'GPU Compute'}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="p-5 border rounded-[var(--radius-md)] space-y-4"
              style={{ backgroundColor: surfaceCard, borderColor: borderDefault }}
            >
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: fgSecondary }}>
                {isAr ? 'الفواصل الهندسية والتوهج البصري (Brand Glow & Geo-Dividers)' : 'Geo-Dividers & Signature Brand Glow'}
              </span>

              <div className="flex items-center gap-4 py-2">
                <span className="text-xs font-mono" style={{ color: fgMuted }}>RTL</span>
                <div
                  className="flex-1 h-px"
                  style={{
                    background: `linear-gradient(to right, transparent 0%, ${borderDefault} 20%, ${borderDefault} 80%, transparent 100%)`,
                  }}
                />
                <span className="text-xs font-mono" style={{ color: fgMuted }}>LTR</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-lg text-white"
                    style={{
                      background: `linear-gradient(135deg, ${githubGreen} 0%, ${githubBlue} 50%, ${githubPurple} 100%)`,
                      boxShadow: `0 0 0 1px ${borderDefault}, 0 0 24px -6px ${githubPurple}`,
                    }}
                  >
                    P
                  </div>
                  <div>
                    <div
                      className="text-2xl font-bold tracking-tight"
                      style={{
                        background: `linear-gradient(135deg, ${githubGreen} 0%, ${githubBlue} 50%, ${githubPurple} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Perplexta
                    </div>
                    <div className="text-xs" style={{ color: fgMuted }}>
                      v4.0.0 GitHub Primer Architecture
                    </div>
                  </div>
                </div>

                <div className="text-end font-mono text-xs" style={{ color: fgSecondary }}>
                  <div>Display: {fontDisplay.split(',')[0]}</div>
                  <div>Mono: {fontMono.split(',')[0]}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {sandboxTab === 'css' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: fgSecondary }}>
                {isAr ? 'كود متغيرات CSS البرمجية الفعالة' : 'Live Generated CSS Variables'}
              </span>
              <button
                type="button"
                onClick={handleCopyGeneratedCss}
                className="px-3 py-1.5 text-xs font-semibold rounded-shape-sm border flex items-center gap-1.5 cursor-pointer transition-all"
                style={{
                  backgroundColor: surfaceSubtle,
                  borderColor: borderDefault,
                  color: copiedCss ? githubGreen : fgPrimary,
                }}
              >
                {copiedCss ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCss ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy CSS')}</span>
              </button>
            </div>

            <pre
              className="p-4 rounded-[var(--radius-md)] border font-mono text-[11.5px] leading-relaxed overflow-x-auto max-h-[320px] custom-scrollbar"
              style={{
                backgroundColor: surfaceInset,
                borderColor: borderDefault,
                color: githubBlue,
                direction: 'ltr',
                textAlign: 'left',
              }}
            >
{`:root${mode === 'dark' ? '.dark, [data-theme="dark"]' : ''} {
${Object.entries(tokens)
  .map(([k, v]) => `  ${k}: ${v};`)
  .join('\n')}
}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
