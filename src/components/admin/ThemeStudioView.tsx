import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Settings,
  Download,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  MousePointerClick,
  Info,
  Loader2,
  Database,
  CheckCircle2,
  Layers,
  Zap,
} from 'lucide-react';
import {
  useThemeStudio,
  LiveThemePreview,
  TokenColorPicker,
  TokenSliderInput,
  ThemePresetsSelector,
  ThemeExportImportModal,
  TokenSearchBar,
  ThemeAuditModal,
} from './theme';

interface ThemeStudioViewProps {
  t: (key: string, replacements?: any) => string;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  token: string | null;
  language: string;
}

export const ThemeStudioView: React.FC<ThemeStudioViewProps> = ({
  t,
  showToast,
  token,
  language,
}) => {
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const {
    activeMode,
    setActiveMode,
    lightTokens,
    darkTokens,
    currentTokens,
    currentDefaultTokens,
    loading,
    saving,
    lastSavedAt,
    dbStatus,
    autoSave,
    toggleAutoSave,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    activePresetId,
    filteredDefinitions,
    modifiedCount,
    totalTokensCount,
    handleTokenChange,
    handleSelectPreset,
    handleImportTokens,
    handleSave,
    handleReset,
    handlePurgeDatabaseOverrides,
  } = useThemeStudio(token, showToast, language);

  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Button Governance Lab State
  const [buttonState, setButtonState] = useState<'idle' | 'hover' | 'active' | 'loading' | 'disabled'>('idle');
  const [selectedRadius, setSelectedRadius] = useState<'4px' | '6px' | '8px' | '12px' | '60px' | '9999px'>('8px');
  const [selectedHeight, setSelectedHeight] = useState<'28px' | '32px' | '36px' | '40px' | '44px'>('36px');

  // Semantic button tokens
  const btnPrimaryBg = currentTokens['--bg-btn-primary'] || (activeMode === 'dark' ? '#238636' : '#1a7f37');
  const btnPrimaryFg = currentTokens['--fg-btn-primary'] || '#ffffff';
  const btnSecondaryBg = currentTokens['--bg-btn-secondary'] || (activeMode === 'dark' ? '#161b22' : '#f6f8fa');
  const btnSecondaryFg = currentTokens['--fg-btn-secondary'] || (activeMode === 'dark' ? '#e6edf3' : '#1f2328');
  const btnSecondaryBorder = currentTokens['--border-btn-secondary'] || (activeMode === 'dark' ? '#3d444d' : '#d0d7de');
  const btnDangerBg = currentTokens['--bg-btn-danger'] || (activeMode === 'dark' ? '#f85149' : '#cf222e');
  const btnDangerFg = currentTokens['--fg-btn-danger'] || '#ffffff';

  const handleApplyButtonPreset = (height: string, radius: string) => {
    handleTokenChange(activeMode, '--radius-sm', radius);
    handleTokenChange(activeMode, '--btn-header-size', height);
    handleTokenChange(activeMode, '--btn-input-size', height);
    handleTokenChange(activeMode, '--btn-tool-size', height);
    handleTokenChange(activeMode, '--btn-action-size', height);

    setSelectedHeight(height as any);
    setSelectedRadius(radius as any);

    showToast(
      isAr
        ? `تم تعميم مقاييس الأزرار: الارتفاع ${height} والانحناء ${radius}`
        : `Applied button geometry: Height ${height}, Radius ${radius}`,
      'success'
    );
  };

  // Format last saved timestamp for display
  const formattedLastSaved = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  useEffect(() => {
    const handleSaveEvent = () => {
      handleSave();
    };
    window.addEventListener("admin-save-theme", handleSaveEvent);
    return () => {
      window.removeEventListener("admin-save-theme", handleSaveEvent);
    };
  }, [handleSave]);

  return (
    <div className="w-full max-w-full space-y-6 pb-20 px-1 md:px-2" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Sovereign Command & Database Sync Header */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] p-5 sm:p-6 rounded-[var(--radius-lg)] shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Identity Info */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--fg-accent)] flex items-center justify-center shrink-0">
                <Palette size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {isAr
                      ? 'خريطة التحكم المركزية في الهوية البصرية ونظام التصميم'
                      : 'Design System & Brand Visual Identity Control Map'}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] font-bold">
                    PERPLEXTA PRIMER V4.0
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-3xl leading-relaxed">
                  {isAr
                    ? 'التحكم السيادي المباشر في كافة رموز النظام (Tokens)، الأسطح، الخطوط، الأزرار، والتباين المعتمد. متصل مباشرة بقاعدة البيانات ويتم تطبيق وحفظ أي تعديل كمعيار نهائي.'
                    : 'Sovereign governance over all design tokens, surfaces, typography, buttons, and WCAG contrast. Direct PostgreSQL connection ensures any modification is final and permanently persisted.'}
                </p>
              </div>
            </div>

            {/* Database & System Live Telemetry Strip */}
            <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-[var(--border-default)]/60 text-xs">
              {/* PostgreSQL Sync Status */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)]">
                <Database size={13} className="text-[var(--fg-accent)]" />
                <span className="font-semibold text-[var(--text-primary)]">
                  {isAr ? 'قاعدة البيانات (PostgreSQL):' : 'Database:'}
                </span>
                <span className="flex items-center gap-1.5 font-bold font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      dbStatus === 'saving'
                        ? 'bg-[var(--fg-warning)] animate-pulse'
                        : dbStatus === 'error'
                        ? 'bg-[var(--fg-danger)]'
                        : 'bg-[var(--fg-success)] animate-pulse'
                    }`}
                  />
                  <span className="text-[var(--text-secondary)]">
                    {dbStatus === 'saving'
                      ? isAr ? 'جاري الحفظ...' : 'Saving...'
                      : dbStatus === 'error'
                      ? isAr ? 'خطأ في الاتصال' : 'Connection Error'
                      : isAr ? 'متصلة ونشطة' : 'Live & Synced'}
                  </span>
                </span>
              </div>

              {/* Last Saved Stamp */}
              {formattedLastSaved && (
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-[var(--fg-success)]" />
                  <span>
                    {isAr
                      ? `آخر اعتماد وحفظ نهائي: ${formattedLastSaved}`
                      : `Last database commit: ${formattedLastSaved}`}
                  </span>
                </div>
              )}

              {/* Modified Tokens Badge */}
              <div className="text-[11px] text-[var(--text-muted)] font-mono">
                <span>{isAr ? 'الرموز المعدلة:' : 'Modified:'} </span>
                <span className="font-bold text-[var(--fg-accent)]">{modifiedCount}</span>
                <span> / {totalTokensCount}</span>
              </div>

              {/* Auto-Save Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none ms-auto">
                <span className="text-[var(--text-secondary)]">
                  {isAr ? 'الحفظ التلقائي في قاعدة البيانات:' : 'Live Auto-Save to DB:'}
                </span>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => toggleAutoSave(e.target.checked)}
                  className="rounded border-[var(--border-default)] text-[var(--fg-accent)] focus:ring-0 cursor-pointer h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Master Global Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Live Preview Toggle */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`min-h-[44px] px-3.5 rounded-[var(--radius-sm)] border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showLivePreview
                  ? 'border-[var(--border-accent)] text-[var(--fg-accent)] bg-[var(--surface-subtle)]'
                  : 'border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {showLivePreview ? <Eye size={15} /> : <EyeOff size={15} />}
              <span>{isAr ? 'المعاينة الحية' : 'Live Preview'}</span>
            </button>

            {/* Governance Audit Modal */}
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="min-h-[44px] px-3.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={15} className="text-[var(--fg-success)]" />
              <span>{isAr ? 'فحص الامتثال' : 'WCAG Audit'}</span>
            </button>

            {/* Import / Export */}
            <button
              type="button"
              onClick={() => setShowExportImportModal(true)}
              className="min-h-[44px] px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title={isAr ? 'تصدير أو استيراد كود JSON' : 'Export/Import Tokens'}
            >
              <Download size={14} />
              <span>{isAr ? 'تصدير / استيراد' : 'JSON'}</span>
            </button>

            {/* Reset Current Mode */}
            <button
              type="button"
              onClick={() => handleReset(activeMode)}
              className="min-h-[44px] px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title={isAr ? 'استعادة الافتراضي للوضع الحالي' : 'Reset mode defaults'}
            >
              <RotateCcw size={14} />
              <span>{isAr ? 'استعادة' : 'Reset'}</span>
            </button>

            {/* Purge Database Overrides */}
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    isAr
                      ? 'هل أنت متأكد من تطهير وحذف كافة التخصيصات المحفوظة من قاعدة البيانات والعودة للقيم الرسمية الأساسية؟'
                      : 'Are you sure you want to purge all custom database overrides and restore canonical defaults?'
                  )
                ) {
                  handlePurgeDatabaseOverrides();
                }
              }}
              className="min-h-[44px] px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title={isAr ? 'تطهير قاعدة البيانات' : 'Purge DB'}
            >
              <Trash2 size={14} />
              <span>{isAr ? 'تطهير DB' : 'Purge DB'}</span>
            </button>

            {/* Primary Save & Commit Action */}
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="min-h-[44px] px-5 rounded-[var(--radius-sm)] bg-[var(--bg-btn-primary)] hover:opacity-90 text-[var(--fg-btn-primary)] font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--fg-btn-primary)]" />
              ) : (
                <Save size={15} />
              )}
              <span>{isAr ? 'حفظ المظهر' : 'Save Theme'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Visual Palette Voltage Strip (The 6 Canonical Color Pillars) */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] p-5 rounded-[var(--radius-lg)] shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[var(--fg-accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              {isAr ? 'أعمدة الهوية البصرية الرسمية (Canonical Voltage Matrix)' : 'Canonical Brand Voltage Pillars'}
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            {isAr ? 'انقر على أي ركيزة لتصفية الرموز المتعلقة بها' : 'Click any pillar to filter corresponding tokens'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Pillar 1: Deep Canvas */}
          <div
            onClick={() => setSelectedCategory('surfaces')}
            className="p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] cursor-pointer transition-all"
          >
            <div className="w-full h-7 rounded-[var(--radius-xs)] border border-black/20 mb-2 flex items-center justify-center font-mono text-[10px]" style={{ backgroundColor: activeMode === 'dark' ? '#0d1117' : '#ffffff', color: activeMode === 'dark' ? '#e6edf3' : '#1f2328' }}>
              {activeMode === 'dark' ? '#0d1117' : '#ffffff'}
            </div>
            <span className="block text-xs font-bold text-[var(--text-primary)] truncate">
              {isAr ? 'السطح والكانفاس' : 'Deep Canvas'}
            </span>
            <span className="block text-[10px] text-[var(--text-muted)] truncate">--surface-page</span>
          </div>

          {/* Pillar 2: Container Surface */}
          <div
            onClick={() => setSelectedCategory('surfaces')}
            className="p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] cursor-pointer transition-all"
          >
            <div className="w-full h-7 rounded-[var(--radius-xs)] border border-black/20 mb-2 flex items-center justify-center font-mono text-[10px]" style={{ backgroundColor: activeMode === 'dark' ? '#161b22' : '#ffffff', color: activeMode === 'dark' ? '#e6edf3' : '#1f2328' }}>
              {activeMode === 'dark' ? '#161b22' : '#ffffff'}
            </div>
            <span className="block text-xs font-bold text-[var(--text-primary)] truncate">
              {isAr ? 'حاويات البطاقات' : 'Surface Container'}
            </span>
            <span className="block text-[10px] text-[var(--text-muted)] truncate">--surface-card</span>
          </div>

          {/* Pillar 3: GitHub Blue Link Voltage */}
          <div
            onClick={() => setSelectedCategory('brand_accent')}
            className="p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] cursor-pointer transition-all"
          >
            <div className="w-full h-7 rounded-[var(--radius-xs)] border border-black/20 mb-2 flex items-center justify-center font-mono text-[10px] font-bold text-white" style={{ backgroundColor: activeMode === 'dark' ? '#58a6ff' : '#0969da' }}>
              {activeMode === 'dark' ? '#58a6ff' : '#0969da'}
            </div>
            <span className="block text-xs font-bold text-[var(--text-primary)] truncate">
              {isAr ? 'أزرق جيت هب للروابط' : 'GitHub Blue Voltage'}
            </span>
            <span className="block text-[10px] text-[var(--text-muted)] truncate">--github-blue / --accent</span>
          </div>

          {/* Pillar 4: GitHub Green Primary CTA */}
          <div
            onClick={() => setSelectedCategory('buttons_controls')}
            className="p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] cursor-pointer transition-all"
          >
            <div className="w-full h-7 rounded-[var(--radius-xs)] border border-black/20 mb-2 flex items-center justify-center font-mono text-[10px] text-white font-bold" style={{ backgroundColor: activeMode === 'dark' ? '#238636' : '#1a7f37' }}>
              {activeMode === 'dark' ? '#238636' : '#1a7f37'}
            </div>
            <span className="block text-xs font-bold text-[var(--text-primary)] truncate">
              {isAr ? 'أخضر جيت هب للإجراءات' : 'GitHub Green Primary'}
            </span>
            <span className="block text-[10px] text-[var(--text-muted)] truncate">--github-green / --bg-btn-primary</span>
          </div>

          {/* Pillar 5: GitHub Purple Sovereign */}
          <div
            onClick={() => setSelectedCategory('brand_accent')}
            className="p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] cursor-pointer transition-all"
          >
            <div className="w-full h-7 rounded-[var(--radius-xs)] border border-black/20 mb-2 flex items-center justify-center font-mono text-[10px] text-white font-bold" style={{ backgroundColor: activeMode === 'dark' ? '#a371f7' : '#8250df' }}>
              {activeMode === 'dark' ? '#a371f7' : '#8250df'}
            </div>
            <span className="block text-xs font-bold text-[var(--text-primary)] truncate">
              {isAr ? 'بنفسجي جيت هب السيادي' : 'GitHub Purple Voltage'}
            </span>
            <span className="block text-[10px] text-[var(--text-muted)] truncate">--github-purple</span>
          </div>

          {/* Pillar 6: Hairline Structural Borders */}
          <div
            onClick={() => setSelectedCategory('borders_dividers')}
            className="p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] cursor-pointer transition-all"
          >
            <div className="w-full h-7 rounded-[var(--radius-xs)] border border-black/20 mb-2 flex items-center justify-center font-mono text-[10px] font-bold" style={{ backgroundColor: activeMode === 'dark' ? '#3d444d' : '#d0d7de', color: activeMode === 'dark' ? '#e6edf3' : '#1f2328' }}>
              {activeMode === 'dark' ? '#3d444d' : '#d0d7de'}
            </div>
            <span className="block text-xs font-bold text-[var(--text-primary)] truncate">
              {isAr ? 'الحدود الهيكلية القياسية' : 'Structural Borders'}
            </span>
            <span className="block text-[10px] text-[var(--text-muted)] truncate">--border-default</span>
          </div>
        </div>
      </div>

      {/* 3. Official Brand Presets */}
      <ThemePresetsSelector
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
        language={language}
      />

      {/* 4. Mode Switcher & DOM Injection Info */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--surface-card)] border border-[var(--border-default)] p-3 rounded-[var(--radius-md)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-secondary)] mr-1">
            {isAr ? 'وضع التعديل والمعاينة:' : 'Active Canvas Mode:'}
          </span>
          <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] p-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => setActiveMode('dark')}
              className={`flex items-center gap-2 px-3.5 min-h-[36px] rounded-[var(--radius-xs)] font-bold text-xs transition-all cursor-pointer ${
                activeMode === 'dark'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Moon size={14} className="text-[var(--fg-accent)]" />
              <span>{isAr ? 'الوضع الداكن (#0d1117)' : 'Dark Mode (#0d1117)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('light')}
              className={`flex items-center gap-2 px-3.5 min-h-[36px] rounded-[var(--radius-xs)] font-bold text-xs transition-all cursor-pointer ${
                activeMode === 'light'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sun size={14} className="text-[var(--fg-warning)]" />
              <span>{isAr ? 'الوضع الفاتح (#ffffff)' : 'Light Mode (#ffffff)'}</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--fg-accent)]" />
          <span>
            {isAr
              ? 'الحقن المباشر في DOM مفعل: أي تغيير ينعكس فوراً على كامل واجهة الموقع'
              : 'Direct DOM CSS variable injection active: changes immediately reflect across app'}
          </span>
        </div>
      </div>

      {/* 5. Live Interactive Sandbox Preview (Collapsible) */}
      {showLivePreview && (
        <LiveThemePreview
          tokens={currentTokens}
          mode={activeMode}
          language={language}
        />
      )}

      {/* 6. Button & Component Governance Studio */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--fg-accent)] flex items-center justify-center shrink-0">
              <MousePointerClick size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isAr ? 'مختبر الأزرار وعناصر التحكم التفاعلية' : 'Interactive Buttons & Controls Lab'}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {isAr
                  ? 'حوكمة شاملة لأبعاد وارتفاعات الأزرار، الحواف، وحالات التفاعل وفق معايير M3 و44px إمكانية الوصول'
                  : 'Full governance over button heights, corner radii, and interaction states adhering to M3 & 44px WCAG AA standards'}
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] mr-1">
              {isAr ? 'قوالب قياسية:' : 'Presets:'}
            </span>
            <button
              type="button"
              onClick={() => handleApplyButtonPreset('36px', '8px')}
              className="min-h-[32px] px-3 text-[11px] font-bold rounded-[var(--radius-xs)] border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              {isAr ? 'معيار بيربليكستا (36px / 8px)' : 'Perplexta Standard (36px / 8px)'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyButtonPreset('44px', '12px')}
              className="min-h-[32px] px-3 text-[11px] font-bold rounded-[var(--radius-xs)] border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              {isAr ? 'مريح وواسع (44px / 12px)' : 'Comfort (44px / 12px)'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyButtonPreset('32px', '60px')}
              className="min-h-[32px] px-3 text-[11px] font-bold rounded-[var(--radius-xs)] border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              {isAr ? 'بيضاوي ناعم (32px / 60px)' : 'Pill Shape (32px / 60px)'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controllers Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Height Selector */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 flex items-center justify-between">
                <span>{isAr ? 'الارتفاع القياسي للأزرار (Button Height)' : 'Button Height'}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--fg-accent)] font-bold">
                  {selectedHeight}
                </span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['28px', '32px', '36px', '40px', '44px'] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleApplyButtonPreset(h, selectedRadius)}
                    className={`min-h-[36px] font-mono text-[11px] rounded-[var(--radius-xs)] border transition-all cursor-pointer ${
                      selectedHeight === h
                        ? 'border-[var(--border-accent)] text-[var(--fg-accent)] bg-[var(--surface-subtle)] font-bold shadow-xs'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape & Corner Radius Selector */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 flex items-center justify-between">
                <span>{isAr ? 'درجة الانحناء وحجم الحواف (Border Radius)' : 'Border Radius'}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--fg-accent)] font-bold">
                  {selectedRadius}
                </span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {(['4px', '6px', '8px', '12px', '60px', '9999px'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleApplyButtonPreset(selectedHeight, r)}
                    className={`min-h-[36px] font-mono text-[10px] rounded-[var(--radius-xs)] border transition-all cursor-pointer ${
                      selectedRadius === r
                        ? 'border-[var(--border-accent)] text-[var(--fg-accent)] bg-[var(--surface-subtle)] font-bold shadow-xs'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {r === '4px' ? 'XS (4)' : r === '6px' ? 'SM (6)' : r === '8px' ? 'MD (8)' : r === '12px' ? 'LG (12)' : r === '60px' ? 'Pill' : 'Full'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive States Simulator */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                {isAr ? 'محاكاة الحالات التفاعلية للزر:' : 'Simulate Button State:'}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['idle', 'hover', 'active', 'loading', 'disabled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setButtonState(st)}
                    className={`min-h-[36px] text-xs font-bold rounded-[var(--radius-xs)] border transition-all cursor-pointer capitalize ${
                      buttonState === st
                        ? 'bg-[var(--bg-btn-primary)] text-[var(--fg-btn-primary)] border-transparent shadow-xs'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {st === 'idle'
                      ? isAr ? 'الخمول' : 'Default'
                      : st === 'hover'
                      ? isAr ? 'تحويم' : 'Hover'
                      : st === 'active'
                      ? isAr ? 'ضغط' : 'Active'
                      : st === 'loading'
                      ? isAr ? 'تحميل' : 'Loading'
                      : isAr ? 'معطل' : 'Disabled'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] text-[11px] leading-relaxed text-[var(--text-secondary)] flex items-start gap-2 border border-[var(--border-default)]">
              <Info size={14} className="text-[var(--fg-accent)] shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? 'هذه المقاييس تُحدّث المتغيرات القياسية (--radius-sm, --btn-header-size) وتعمم على كافة عناصر التحكم في المشروع.'
                  : 'These metrics re-calculate variables such as --radius-sm, --btn-header-size, and --btn-input-size globally across the application.'}
              </span>
            </div>
          </div>

          {/* Sandbox Live Testing Area */}
          <div className="lg:col-span-7 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider block mb-4">
                {isAr ? 'محيط الاختبار الفوري للمكونات (Live Component Output Sandbox)' : 'Live Interactive Button Play Area'}
              </span>

              <div className="space-y-6">
                {/* Variant Row 1: Primary vs Secondary */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {isAr ? 'أزرار الإجراءات الأساسية والثانوية:' : 'Primary CTA and Secondary Actions:'}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Primary Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`font-bold text-xs flex items-center justify-center gap-2 transition-all select-none duration-fast shrink-0 ${
                        buttonState === 'hover'
                          ? 'opacity-90 scale-98'
                          : buttonState === 'active'
                          ? 'scale-95 duration-75'
                          : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnPrimaryBg,
                        color: btnPrimaryFg,
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                    >
                      {buttonState === 'loading' && (
                        <Loader2 size={13} className="animate-spin text-[var(--fg-btn-primary)]" />
                      )}
                      <span>{isAr ? 'زر رئيسي (Primary CTA)' : 'Primary CTA Button'}</span>
                    </button>

                    {/* Secondary Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`font-bold text-xs flex items-center justify-center gap-2 transition-all select-none border duration-fast shrink-0 ${
                        buttonState === 'hover'
                          ? 'opacity-95 scale-98'
                          : buttonState === 'active'
                          ? 'scale-95 duration-75'
                          : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnSecondaryBg,
                        borderColor: btnSecondaryBorder,
                        color: btnSecondaryFg,
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                    >
                      {buttonState === 'loading' && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      <span>{isAr ? 'زر ثانوي' : 'Secondary Action'}</span>
                    </button>
                  </div>
                </div>

                {/* Variant Row 2: Danger, Status, Ghost */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {isAr ? 'أزرار حالات التنبيه والحذف والرموز:' : 'Affirmative, Destructive & Compact Icon Buttons:'}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Danger Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`font-bold text-xs flex items-center justify-center gap-2 transition-all select-none duration-fast shrink-0 ${
                        buttonState === 'hover'
                          ? 'opacity-95 scale-98'
                          : buttonState === 'active'
                          ? 'scale-95 duration-75'
                          : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnDangerBg,
                        color: btnDangerFg,
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                    >
                      {buttonState === 'loading' && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      <span>{isAr ? 'إجراء حذف (Danger)' : 'Danger Button'}</span>
                    </button>

                    {/* Status Badge Custom */}
                    <span
                      className="px-3 inline-flex items-center gap-2 font-mono text-xs font-bold border rounded-shape-sm"
                      style={{
                        height: selectedHeight,
                        backgroundColor: 'rgba(95, 237, 131, 0.1)',
                        borderColor: 'rgba(95, 237, 131, 0.3)',
                        color: '#5fed83',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#5fed83] animate-pulse" />
                      <span>{isAr ? 'حالة نشطة' : 'ACTIVE'}</span>
                    </span>

                    {/* Square Icon Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`flex items-center justify-center transition-all select-none border duration-fast shrink-0 ${
                        buttonState === 'hover' ? 'scale-105' : buttonState === 'active' ? 'scale-95' : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        width: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnSecondaryBg,
                        borderColor: btnSecondaryBorder,
                        color: btnSecondaryFg,
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                      title="Settings Icon"
                    >
                      {buttonState === 'loading' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Settings size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-default)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>{isAr ? 'الأبعاد المطبقة:' : 'Applied Dimensions:'}</span>
              <span className="font-mono bg-[var(--surface-card)] px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--border-default)] text-[10px]">
                {selectedHeight} height • {selectedRadius === '9999px' ? 'Full Pill' : `${selectedRadius} radius`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Token Search & Category Navigation */}
      <TokenSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalTokensCount={currentTokens ? Object.keys(currentTokens).length : 0}
        filteredCount={filteredDefinitions.length}
        language={language}
      />

      {/* 8. Token Cards Grid (The Control Map) */}
      {loading ? (
        <div className="p-16 text-center text-[var(--text-secondary)] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-accent)] mx-auto mb-3" />
          <p className="text-xs font-semibold">
            {isAr ? 'جاري تحميل مصفوفة رموز التصميم من قاعدة البيانات...' : 'Loading design token registry from database...'}
          </p>
        </div>
      ) : filteredDefinitions.length === 0 ? (
        <div className="p-12 text-center text-[var(--text-secondary)] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <p className="text-xs">
            {isAr
              ? 'لم يتم العثور على أي رمز يطابق كلمة البحث المحددة.'
              : 'No tokens matched your search query or category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDefinitions.map((def) => {
            const val = currentTokens[def.key] ?? '';
            const defVal = currentDefaultTokens[def.key] ?? '';

            if (def.type === 'size' || (def.options && def.options.length > 0)) {
              return (
                <TokenSliderInput
                  key={def.key}
                  definition={def}
                  value={val}
                  defaultValue={defVal}
                  onChange={(newVal) => handleTokenChange(activeMode, def.key, newVal)}
                  language={language}
                  showToast={showToast}
                />
              );
            }

            return (
              <TokenColorPicker
                key={def.key}
                definition={def}
                value={val}
                defaultValue={defVal}
                onChange={(newVal) => handleTokenChange(activeMode, def.key, newVal)}
                language={language}
                showToast={showToast}
              />
            );
          })}
        </div>
      )}

      {/* Export / Import Modal */}
      <ThemeExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        lightTokens={lightTokens}
        darkTokens={darkTokens}
        activeMode={activeMode}
        onImportTokens={handleImportTokens}
        language={language}
        showToast={showToast}
      />

      {/* Design System Governance Audit Modal */}
      <ThemeAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        lightTokens={lightTokens}
        darkTokens={darkTokens}
        language={language}
      />
    </div>
  );
};
