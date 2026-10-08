import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ShieldCheck, Cpu, CreditCard, Sparkles, 
  ChevronRight, ChevronLeft, ArrowUpRight,
  MessageSquare, Terminal, Music, Code, Languages, Image as ImageIcon, Palette
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageResolver';
import { ThemeToggleButton } from '../components/ThemeToggleButton';

export const StudioPage: React.FC = () => {
  const { theme, language, setLanguage, siteSettings, dir, isMobile } = useAppContext();
  const navigate = useNavigate();
  const siteName = language === 'ar' ? siteSettings.siteNameAr : siteSettings.siteName;
  const logo = theme === 'dark' ? siteSettings.logoBase64 : (siteSettings.logoLightBase64 || siteSettings.logoBase64);

  const studioFeatures = React.useMemo(() => {
    const list = [
      {
        id: 'chat_engine',
        icon: <MessageSquare className="w-5 h-5 text-[var(--accent)]" />,
        title: language === 'ar' ? 'المحادثة والتحليل الذكي' : 'Smart Chat & Reasoning',
        desc: language === 'ar' ? 'محركات ذكاء اصطناعي متعددة مع نظام التوجيه والتبديل الصامت.' : 'Multi-model AI engines with dynamic failover orchestration.',
        action: () => navigate('/chat'),
        badge: language === 'ar' ? 'نشط' : 'Active'
      },
      {
        id: 'bulletin_hub',
        icon: <Sparkles className="w-5 h-5 text-[var(--accent)]" />,
        title: language === 'ar' ? 'منصة بيربليكستا بورد والمجتمع' : 'Perplexta Board Community Hub',
        desc: language === 'ar' ? 'مجتمع تفاعلي، ريلز، وقنوات تجارية موثقة بدقة متناهية.' : 'Interactive feed, verified commercial pages, and short reels.',
        action: () => navigate('/bulletin'),
        badge: language === 'ar' ? 'شائع' : 'Trending'
      },
      {
        id: 'image_studio',
        icon: logo ? (
          <img 
            src={resolveImageUrl(logo, 'general')} 
            alt={language === 'ar' ? 'استوديو رينكس' : 'Rinex Studio'} 
            className="w-5 h-5 object-contain rounded-xs"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <Palette className="w-5 h-5 text-[var(--accent)]" />
        ),
        title: language === 'ar' ? 'استوديو رينكس' : 'Rinex Studio',
        desc: language === 'ar' ? 'تصميم جرافيكي، قوالب سوشيال ميديا، نصوص احترافية، وفلاتر سينمائية.' : 'Graphic design suite, social media presets, curved typography, and high-res exporting.',
        action: () => navigate('/image-studio'),
        badge: language === 'ar' ? 'احترافي' : 'Pro'
      },
      {
        id: 'api_portal',
        icon: <Terminal className="w-5 h-5 text-[var(--accent)]" />,
        title: language === 'ar' ? 'بوابة المطورين والـ API' : 'Developer & API Portal',
        desc: language === 'ar' ? 'مفاتيح API، توجيه الروبوتات، والتحليلات البرمجية المستقلة.' : 'API keys, autonomous bots routing, and programmatic workflows.',
        action: () => navigate('/settings/developer'),
        badge: language === 'ar' ? 'للمطورين' : 'Devs'
      },
      {
        id: 'wallet_economy',
        icon: <CreditCard className="w-5 h-5 text-[var(--accent)]" />,
        title: language === 'ar' ? 'المحفظة والاشتراكات' : 'Wallet & Plans',
        desc: language === 'ar' ? 'نظام مالي مدقق بسجل غير قابل للتعديل لشحن النقاط والترقية.' : 'Audited ledger financial system for credits and tier upgrades.',
        action: () => navigate('/settings/wallet'),
        badge: language === 'ar' ? 'آمن' : 'Secure'
      },
      {
        id: 'app_studio',
        icon: <Code className="w-5 h-5 text-[var(--accent)]" />,
        title: language === 'ar' ? 'استوديو التطبيق (IDE متكامل)' : 'App Studio & Live IDE',
        desc: language === 'ar' ? 'معاينة حيّة، شجرة ملفات، قاعدة بيانات SQLite، وتصحيح ذكي.' : 'Live preview, file tree, SQLite database, and AI code fixing.',
        action: () => navigate('/app'),
        badge: language === 'ar' ? 'مميز' : 'Pro'
      },
      {
        id: 'audio_studio',
        icon: <Music className="w-5 h-5 text-[var(--accent)]" />,
        title: language === 'ar' ? 'استوديو الصوت والإنتاج' : 'Audio Studio & Production',
        desc: language === 'ar' ? 'محركات تأليف النطق، تحويل الصوت، والموسيقى الأوركسترالية المتطورة.' : 'State-of-the-art TTS vocal synthesis, speech transcribing, and orchestral music composition.',
        action: () => navigate('/audio-studio'),
        badge: language === 'ar' ? 'جديد' : 'New'
      }
    ];

    if (isMobile) {
      return list.filter(f => f.id !== 'app_studio' && f.id !== 'audio_studio' && f.id !== 'code');
    }
    return list;
  }, [language, isMobile, navigate]);

  return (
    <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] font-sans pb-28 md:pb-20 transition-theme">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--surface-page)]/95 border-b border-[var(--border-default)] pt-[env(safe-area-inset-top,0px)] transition-theme shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="h-8 px-2.5 flex items-center gap-1 rounded-shape-sm bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-subtle)] transition-all duration-150 active:scale-95 cursor-pointer"
              title={dir === 'rtl' ? 'رجوع' : 'Back'}
            >
              {dir === 'rtl' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              <span className="text-xs font-bold">{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={resolveImageUrl(logo, 'general')} alt={siteName} className="w-7 h-7 rounded-shape-sm object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
              )}
              <h1 className="text-xs sm:text-sm font-bold tracking-wide">
                {language === 'ar' ? 'استوديو بيربليكستا' : 'Perplexta Studio'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Languages size={14} />
            </button>
            <ThemeToggleButton variant="icon-button" size="sm" className="!w-8 !h-8 !rounded-shape-sm !border-[var(--border-default)] hover:!border-[var(--border-accent)] !bg-transparent hover:!bg-[var(--surface-subtle)] !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] transition-all duration-150" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {studioFeatures.map((feat) => (
            <div 
              key={feat.id}
              onClick={feat.action}
              className="p-5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] hover:bg-[var(--surface-subtle)] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between group shadow-2xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-shape-sm bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[color-mix(in_oklab,var(--accent)_20%,transparent)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] transition-all duration-fast">
                    {feat.icon}
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                    {feat.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center justify-between">
                    <span>{feat.title}</span>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]" />
                  </h3>
                  <p 
                    className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed"
                    style={{
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      textAlign: language === 'ar' ? 'right' : 'left',
                      unicodeBidi: 'plaintext'
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="pt-2 space-y-4 text-center">
          <div className="p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] max-w-xl mx-auto space-y-2 shadow-2xs">
            <div className="flex items-center justify-center gap-2 text-[var(--text-primary)]">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'أمان وحماية البيانات المتقدمة' : 'Enterprise Data Security & Privacy'}
              </h4>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {language === 'ar'
                ? 'كافة المحركات وأنظمة الربط والتشفير تعمل داخل بيئة معزولة لضمان خصوصية بيانات المستخدمين وأمان العمليات.'
                : 'All engines, orchestration layers, and encryption routines are isolated to guarantee data privacy and operational security.'}
            </p>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-page)]/95 border-t border-[var(--border-default)] backdrop-blur-md select-none py-3 px-4 md:px-6 shadow-2xs transition-theme">
        <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] sm:text-[11px] text-[var(--text-muted)]">
          <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-medium text-[var(--text-secondary)]">
            <button 
              type="button"
              onClick={() => navigate('/about')} 
              className="cursor-pointer hover:underline hover:text-[var(--text-primary)] bg-transparent border-0 p-0 text-inherit font-inherit transition-colors duration-150"
            >
              {language === 'ar' ? 'من نحن' : 'About Us'}
            </button>
            <span className="text-[var(--border-default)] select-none">•</span>
            <button 
              type="button"
              onClick={() => navigate('/terms')} 
              className="cursor-pointer hover:underline hover:text-[var(--text-primary)] bg-transparent border-0 p-0 text-inherit font-inherit transition-colors duration-150"
            >
              {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
            </button>
            <span className="text-[var(--border-default)] select-none">•</span>
            <button 
              type="button"
              onClick={() => navigate('/privacy')} 
              className="cursor-pointer hover:underline hover:text-[var(--text-primary)] bg-transparent border-0 p-0 text-inherit font-inherit transition-colors duration-150"
            >
              {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
          </nav>
          <p className="font-sans tracking-wide leading-relaxed text-[var(--text-muted)] whitespace-nowrap text-[9px] sm:text-[10px]">
            {language === 'ar' 
              ? 'جميع الحقوق محفوظة © 2026 بيربليكستا'
              : '© 2026 Perplexta. All rights reserved.'
            }
          </p>
        </div>
      </footer>
    </div>
  );
};
