import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  FileText,
  Shield,
  Scale,
  Layers,
  DollarSign,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Search,
  Printer,
  Check,
  Calendar,
  ArrowUpRight,
  Menu,
  X,
  Share2
} from 'lucide-react';
import { LEGAL_DOCS, LegalDocMetadata, getLegalDoc } from '../content/docs/legalDocsData';
import { useAppContext } from '../context/AppContext';
import { Logo } from '../components/common/Logo';
import { ThemeToggleButton } from '../components/ThemeToggleButton';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  core: <FileText className="w-4 h-4 text-[var(--text-secondary)]" />,
  'ai-safety': <Shield className="w-4 h-4 text-[var(--text-secondary)]" />,
  'intellectual-property': <Scale className="w-4 h-4 text-[var(--text-secondary)]" />,
  advertising: <Layers className="w-4 h-4 text-[var(--text-secondary)]" />,
  finance: <DollarSign className="w-4 h-4 text-[var(--text-secondary)]" />,
  infrastructure: <Cpu className="w-4 h-4 text-[var(--text-secondary)]" />,
};

export const LegalDocsPage: React.FC = () => {
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const { language: appLanguage, siteSettings, t } = useAppContext();

  // Local document language toggle (defaults to current app language)
  const [docLang, setDocLang] = useState<'ar' | 'en'>(() => (appLanguage === 'en' ? 'en' : 'ar'));
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const isRtl = docLang === 'ar';
  const brandName = (isRtl ? siteSettings?.siteNameAr : siteSettings?.siteName) || siteSettings?.siteName || t?.('appName') || (isRtl ? 'بيربليكستا' : 'Perplexta');

  // Active document selection
  const activeDoc: LegalDocMetadata = useMemo(() => {
    if (docId) {
      const found = getLegalDoc(docId);
      if (found) return found;
    }
    return LEGAL_DOCS.find((d) => d.id === '01-terms-of-service') || LEGAL_DOCS[0];
  }, [docId]);

  // Find index for prev/next buttons
  const activeIndex = useMemo(() => {
    return LEGAL_DOCS.findIndex((d) => d.id === activeDoc.id);
  }, [activeDoc]);

  const prevDoc = activeIndex > 0 ? LEGAL_DOCS[activeIndex - 1] : null;
  const nextDoc = activeIndex < LEGAL_DOCS.length - 1 ? LEGAL_DOCS[activeIndex + 1] : null;

  // Filtered documents for search
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return LEGAL_DOCS;
    const q = searchQuery.toLowerCase().trim();
    return LEGAL_DOCS.filter((d) => {
      if (isRtl) {
        return (
          d.titleAr.toLowerCase().includes(q) ||
          d.shortTitleAr.toLowerCase().includes(q) ||
          d.descriptionAr.toLowerCase().includes(q) ||
          d.badgeAr.toLowerCase().includes(q)
        );
      }
      return (
        d.titleEn.toLowerCase().includes(q) ||
        d.shortTitleEn.toLowerCase().includes(q) ||
        d.descriptionEn.toLowerCase().includes(q) ||
        d.badgeEn.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, isRtl]);

  // Hierarchical pyramid sorting (from shortest title at the top to longest title at the bottom)
  const sortedDocs = useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
      const lenA = (isRtl ? a.shortTitleAr : a.shortTitleEn).length;
      const lenB = (isRtl ? b.shortTitleAr : b.shortTitleEn).length;
      return lenA - lenB;
    });
  }, [filteredDocs, isRtl]);

  // Sanitize Markdown: Strip duplicate # H1 Title and pre-divider raw paragraph, leaving clean body starting at ## 1.
  const { sanitizedContent, docMetaExtra } = useMemo(() => {
    const raw = isRtl ? activeDoc.bodyContentAr : activeDoc.bodyContentEn;
    const dividerIndex = raw.indexOf('\n---\n');
    if (dividerIndex !== -1) {
      const body = raw.slice(dividerIndex + 5).trim();

      let extra: { label: string; value: string } | null = null;
      if (activeDoc.id === '06-dmca-copyright-policy') {
        extra = {
          label: isRtl ? 'إشعار الانتهاك الرسمي:' : 'Official Notice Endpoint:',
          value: 'dmca@perplexta.com',
        };
      } else if (activeDoc.id === '10-billing-refund-policy') {
        extra = {
          label: isRtl ? 'بوابات الدفع المعتمدة:' : 'Authorized Processors:',
          value: isRtl ? 'شركة سترايب العالمية (المملكة المتحدة)' : 'Stripe Inc. / Stripe Payments UK',
        };
      }

      return { sanitizedContent: body, docMetaExtra: extra };
    }

    // Fallback if no divider: strip leading # title
    const stripped = raw.replace(/^#[^\n]*\n+/, '');
    return { sanitizedContent: stripped, docMetaExtra: null };
  }, [activeDoc, isRtl]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  useEffect(() => {
    // Scroll to top of reading pane when document changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeDoc.id]);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="h-[100dvh] w-full overflow-hidden bg-[var(--surface-page)] text-[var(--text-primary)] transition-theme flex flex-col font-sans select-text print:h-auto print:overflow-visible print:bg-white print:text-black"
    >
      {/* Top Header Bar for Legal Documentation */}
      <header className="shrink-0 z-40 w-full border-b border-[var(--border-default)] bg-[var(--surface-card)]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 transition-theme print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden w-8 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center shrink-0 transition-all duration-fast active:scale-95 cursor-pointer shadow-2xs relative before:absolute before:-inset-1.5 before:content-['']"
              aria-label={isRtl ? 'عرض فهرس الوثائق' : 'Toggle Document Index'}
            >
              {isMobileNavOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity select-none group shrink-0"
              title={brandName}
            >
              <Logo size={32} fallbackType="cpu" />
              <div className="flex flex-col min-w-0">
                <span className="leading-none text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)] whitespace-nowrap truncate">
                  {brandName}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium leading-none mt-1 whitespace-nowrap truncate">
                  {isRtl ? 'بوابة الوثائق والسياسات القانونية' : 'Legal Documentation Suite'}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 py-2 shrink-0">
            {/* Language Switcher */}
            <div 
              className="flex items-center h-8 p-0.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] shrink-0 shadow-2xs"
              role="group"
              aria-label={isRtl ? 'لغة المستندات' : 'Document Language'}
            >
              <button
                type="button"
                onClick={() => setDocLang('ar')}
                className={`h-7 px-2.5 text-xs font-bold rounded-[var(--radius-xs)] transition-all flex items-center justify-center cursor-pointer select-none ${
                  docLang === 'ar'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setDocLang('en')}
                className={`h-7 px-2.5 text-xs font-bold rounded-[var(--radius-xs)] transition-all flex items-center justify-center cursor-pointer select-none ${
                  docLang === 'en'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                English
              </button>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggleButton 
              variant="icon-button" 
              size="sm" 
              className="!w-8 !h-8 !rounded-[var(--radius-sm)] shrink-0 relative before:absolute before:-inset-1.5 before:content-[''] shadow-2xs" 
            />

            {/* Print Document */}
            <button
              type="button"
              onClick={handlePrint}
              title={isRtl ? 'طباعة الوثيقة القانونية' : 'Print Legal Document'}
              aria-label={isRtl ? 'طباعة الوثيقة القانونية' : 'Print Legal Document'}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 transition-all duration-fast active:scale-95 cursor-pointer shadow-2xs relative before:absolute before:-inset-1.5 before:content-['']"
            >
              <Printer size={14} />
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              title={isRtl ? 'مشاركة رابط الوثيقة' : 'Share Document Link'}
              aria-label={isRtl ? 'مشاركة رابط الوثيقة' : 'Share Document Link'}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 bg-transparent hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 transition-all duration-fast active:scale-95 cursor-pointer shadow-2xs relative before:absolute before:-inset-1.5 before:content-['']"
            >
              {copied ? <Check size={14} className="text-[var(--fg-success)]" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : isRtl ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - CSS Grid Layout */}
      <div className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] lg:[grid-template-areas:'sidebar_main-content'] gap-6 lg:gap-8 relative overflow-hidden h-full print:block print:p-0">
        {/* Sidebar Index / Navigation (Desktop CSS Grid 'sidebar' Column & Mobile Drawer) */}
        <aside
          className={`z-30 transition-all duration-300 print:hidden ${
            isMobileNavOpen
              ? 'fixed inset-y-0 start-0 w-80 bg-[var(--surface-card)] shadow-2xl p-5 border-e border-[var(--border-default)] flex flex-col h-full z-50'
              : 'hidden lg:flex lg:flex-col lg:[grid-area:sidebar] lg:w-[320px] lg:h-full lg:overflow-hidden'
          }`}
        >
          {isMobileNavOpen && (
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-default)] lg:hidden">
              <span className="font-bold text-sm text-[var(--text-primary)]">
                {isRtl ? 'فهرس الوثائق' : 'Documents Index'}
              </span>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-all"
                aria-label={isRtl ? 'إغلاق الفهرس' : 'Close index'}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Sidebar Header with Professional Border matching Article Header */}
          <div className="shrink-0 pb-3 mb-3 border-b border-[var(--border-default)] flex items-center justify-between min-h-[40px]">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              {isRtl ? 'فهرس الوثائق' : 'Document Index'}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {isRtl ? `${LEGAL_DOCS.length} وثيقة معتمدة` : `${LEGAL_DOCS.length} Verified Policies`}
            </span>
          </div>

          {/* Search Box */}
          <div className="shrink-0 relative mb-3">
            <Search
              size={15}
              className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${
                isRtl ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRtl
                  ? 'بحث في الوثائق والسياسات...'
                  : 'Search legal documents...'
              }
              className={`w-full py-2 text-xs rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] transition-all min-h-[40px] ${
                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] rounded-[var(--radius-xs)] w-7 h-7 flex items-center justify-center cursor-pointer transition-all ${
                  isRtl ? 'left-2' : 'right-2'
                }`}
                title={isRtl ? 'مسح البحث' : 'Clear search'}
              >
                ✕
              </button>
            )}
          </div>

          {/* Documents Count & Status */}
          <div className="shrink-0 flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1 mb-2 font-mono">
            <span>
              {isRtl
                ? `الوثائق المعتمدة (${LEGAL_DOCS.length})`
                : `Verified Policies (${LEGAL_DOCS.length})`}
            </span>
            <span className="text-[var(--fg-success)] dark:text-[var(--fg-success)] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse" />
              {isRtl ? 'سارية المفعول' : 'Enforceable'}
            </span>
          </div>

          {/* Scrollable Document List */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pe-1 custom-scrollbar">
            {sortedDocs.map((doc) => {
              const isActive = doc.id === activeDoc.id;
              const displayTitle = isRtl ? doc.shortTitleAr : doc.shortTitleEn;
              const fullTitle = isRtl ? doc.titleAr : doc.titleEn;
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    navigate(`/docs/legal/${doc.slug}`);
                    setIsMobileNavOpen(false);
                  }}
                  title={fullTitle}
                  className={`w-full text-start px-3 py-2.5 rounded-[var(--radius-sm)] border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                      : 'bg-transparent border-transparent hover:bg-[var(--surface-subtle)]/70 hover:border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {CATEGORY_ICONS[doc.category] || <FileText className="w-4 h-4" />}
                    </span>
                    <span
                      className={`text-xs truncate transition-colors ${
                        isActive ? 'font-bold text-blue-700 dark:text-blue-300' : 'font-medium'
                      }`}
                    >
                      {displayTitle}
                    </span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}

            {sortedDocs.length === 0 && (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                {isRtl ? 'لا توجد وثائق مطابقة للبحث' : 'No matching documents found'}
              </div>
            )}
          </div>

          {/* Corporate Trust Badge / Entity Card in Sidebar */}
          <div className="shrink-0 mt-auto pt-4 border-t border-[var(--border-main)]">
            <div className="p-3.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2.5 transition-all hover:border-[var(--border-accent)] shadow-xs">
              {/* Header: Entity Name & Live Indicator */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-bold text-xs text-[var(--text-primary)] tracking-tight truncate"
                    title={isRtl ? 'فيرال لينك اب المحدودة' : 'ViralLinkUp Limited'}
                  >
                    {isRtl ? 'فيرال لينك اب المحدودة' : 'ViralLinkUp Limited'}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)] truncate">
                    {isRtl ? 'ViralLinkUp Limited' : 'فيرال لينك اب المحدودة'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-shape-full text-[10px] font-medium bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-shape-full bg-[var(--fg-success)] animate-pulse" />
                  {isRtl ? 'نشط ومعتمد' : 'Active & Certified'}
                </span>
              </div>

              {/* Embedded Legal Data */}
              <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
                <div className="flex items-center justify-between">
                  <span>{isRtl ? 'رقم التسجيل البريطاني:' : 'UK Registration No:'}</span>
                  <span className="font-mono font-semibold text-[var(--text-secondary)] bg-[var(--surface-card)] px-1.5 py-0.5 rounded-shape-xs border border-[var(--border-subtle)]">
                    16804604
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{isRtl ? 'نطاق الاختصاص:' : 'Jurisdiction:'}</span>
                  <span className="font-medium text-[var(--text-secondary)]">
                    {isRtl ? 'إنجلترا وويلز (UK)' : 'England & Wales (UK)'}
                  </span>
                </div>
              </div>

              {/* Fast Official Verification Link */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{isRtl ? 'سجل الشركات البريطاني' : 'Companies House UK'}</span>
                <a
                  href="https://find-and-update.company-information.service.gov.uk/company/16804604"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--fg-accent)] hover:underline inline-flex items-center gap-0.5 font-medium transition-colors"
                >
                  {isRtl ? 'التحقق الرسمي ↗' : 'Official Verification ↗'}
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {isMobileNavOpen && (
          <div
            onClick={() => setIsMobileNavOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Content Viewer / Article Container (Desktop CSS Grid 'main-content' Column) */}
        <main
          ref={scrollContainerRef}
          className="lg:[grid-area:main-content] h-full overflow-y-auto overflow-x-hidden min-w-0 bg-transparent pt-0 px-1 sm:px-2 lg:px-3 pb-6 lg:pb-8 main-scroll-container custom-scrollbar print:p-0 print:overflow-visible print:h-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
          }}
        >
          {/* Top Header Section - Unified harmonious hierarchy */}
          <div className="mb-8">
            {/* Title & Badge Container strictly aligned to start (right in RTL, left in LTR) */}
            <div
              className={`flex flex-col items-start gap-2 mb-3 w-full ${isRtl ? 'text-right' : 'text-left'}`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Smart Unified Status Badge */}
              <div
                className={`inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-shape-sm text-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)] shadow-2xs ${
                  isRtl ? 'self-start mr-0 ml-auto' : 'self-start ml-0 mr-auto'
                }`}
              >
                <span className="font-medium text-[var(--fg-accent)]">
                  {isRtl ? activeDoc.badgeAr : activeDoc.badgeEn}
                </span>
                <span className="text-[var(--border-main)] select-none">•</span>
                <span className="font-mono">v{activeDoc.version}</span>
                <span className="text-[var(--border-main)] select-none">•</span>
                <span>
                  {isRtl ? `آخر تحديث: ${activeDoc.lastUpdated}` : `Last updated: ${activeDoc.lastUpdated}`}
                </span>
              </div>

              {/* Main Document Title */}
              <h1 className={`text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight w-full ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? activeDoc.titleAr : activeDoc.titleEn}
              </h1>
            </div>

            {/* Balanced Technical Metadata Grid Card */}
            <div className="rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] p-4 text-xs shadow-2xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[var(--text-muted)] mb-1">
                    {isRtl ? 'تاريخ السريان' : 'Effective Date'}
                  </div>
                  <div className="font-semibold text-[var(--text-primary)] font-mono">
                    {isRtl ? '21 سبتمبر 2026' : 'September 21, 2026'}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)] mb-1">
                    {isRtl ? 'الكيان القانوني' : 'Legal Entity'}
                  </div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isRtl ? 'فيرال لينك اب المحدودة' : 'ViralLinkUp Limited'}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)] mb-1">
                    {isRtl ? 'رقم التسجيل التجاري' : 'Registration No (UK)'}
                  </div>
                  <div className="font-mono font-bold text-[var(--fg-success)] bg-[var(--status-success-subtle)] px-2 py-0.5 rounded-shape-xs border border-[var(--fg-success)]/30 w-fit">
                    16804604
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)] mb-1">
                    {isRtl ? 'الاختصاص القضائي' : 'Jurisdiction'}
                  </div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isRtl ? 'إنجلترا وويلز' : 'England & Wales'}
                  </div>
                </div>
              </div>

              {/* Specialized Endpoint / Extra Info (e.g. DMCA, DPO, Stripe) */}
              {docMetaExtra && (
                <div className="pt-3 mt-3 border-t border-[var(--border-main)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-shape-full bg-[var(--fg-accent)]" />
                    <span className="font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider">
                      {docMetaExtra.label.replace(':', '')}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-primary)] font-bold shadow-2xs">
                    {docMetaExtra.value}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Render Markdown Content - Pure Language Isolation */}
          <div className="max-w-none text-[var(--text-primary)] leading-relaxed font-sans text-sm sm:text-base">
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: () => null,
                h2: ({ children }) => (
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-10 mb-4 pb-2.5 border-b border-[var(--border-default)] tracking-tight">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-6 mb-2 tracking-tight">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] mt-5 mb-2">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-[var(--text-secondary)] leading-relaxed sm:leading-[1.85] mb-5 text-sm sm:text-[15px]">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ps-6 sm:ps-7 space-y-4 [&>li]:mb-4 my-6 text-[var(--text-secondary)] text-sm sm:text-[15px]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ps-6 sm:ps-7 space-y-4 [&>li]:mb-4 my-6 text-[var(--text-secondary)] text-sm sm:text-[15px]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-[var(--text-secondary)] leading-loose sm:leading-[2.1] ps-1.5 py-1 mb-4 last:mb-0">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-[var(--text-primary)] text-sm sm:text-[15px]">
                    {children}
                  </strong>
                ),
                table: ({ children, className, ...props }: any) => {
                  if (className && (className.includes('text-') || className.includes('w-'))) {
                    return (
                      <table className={className} {...props}>
                        {children}
                      </table>
                    );
                  }
                  return (
                    <div className="overflow-x-auto my-6 border border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--surface-card)] shadow-2xs">
                      <table className={className || "w-full text-xs sm:text-sm text-start border-collapse"} {...props}>
                        {children}
                      </table>
                    </div>
                  );
                },
                thead: ({ children, className, ...props }: any) => (
                  <thead className={className || "bg-[var(--surface-subtle)] border-b border-[var(--border-default)] font-bold text-[var(--text-primary)]"} {...props}>
                    {children}
                  </thead>
                ),
                th: ({ children, className, ...props }: any) => (
                  <th className={className || "p-3.5 text-start font-bold border-e border-[var(--border-default)] last:border-e-0 text-[var(--text-primary)]"} {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, className, ...props }: any) => (
                  <td className={className || "p-3.5 border-b border-[var(--border-subtle)] text-[var(--text-secondary)]"} {...props}>
                    {children}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="p-4 my-6 rounded-[var(--radius-sm)] border-s-4 border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] leading-[1.8]">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[var(--fg-accent)] hover:underline"
                  >
                    <span>{children}</span>
                    <ArrowUpRight size={12} className="inline opacity-70" />
                  </a>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded-[var(--radius-xs)] font-mono text-xs bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    {children}
                  </code>
                ),
                hr: () => <hr className="my-10 border-[var(--border-default)]" />,
              }}
            >
              {sanitizedContent}
            </Markdown>
          </div>

          {/* Previous / Next Document Navigation */}
          <div className="mt-12 pt-6 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            {prevDoc ? (
              <button
                onClick={() => navigate(`/docs/legal/${prevDoc.slug}`)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
              >
                {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                <div className="flex flex-col text-start">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {isRtl ? 'الوثيقة السابقة' : 'Previous Policy'}
                  </span>
                  <span>{isRtl ? prevDoc.shortTitleAr : prevDoc.shortTitleEn}</span>
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextDoc ? (
              <button
                onClick={() => navigate(`/docs/legal/${nextDoc.slug}`)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
              >
                <div className="flex flex-col text-end">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {isRtl ? 'الوثيقة التالية' : 'Next Policy'}
                  </span>
                  <span>{isRtl ? nextDoc.shortTitleAr : nextDoc.shortTitleEn}</span>
                </div>
                {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* Corporate Legal Footer inside Document */}
          <div className="mt-8 p-4 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-center text-xs text-[var(--text-muted)] font-mono">
            <p>
              {isRtl
                ? '© 2026 شركة فيرال لينك اب المحدودة (مسجلة في إنجلترا وويلز برقم 16804604). جميع الحقوق محفوظة لمنظومة بيربليكستا.'
                : '© 2026 ViralLinkUp Limited (Incorporated in England and Wales under Company No. 16804604). All rights reserved across the Perplexta ecosystem.'}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LegalDocsPage;
