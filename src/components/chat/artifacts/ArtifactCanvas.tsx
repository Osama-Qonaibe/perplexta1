import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useArtifact } from '../../../context/ArtifactContext';
import { useAppContext } from '../../../context/AppContext';
import { useResolvedTheme } from '../../../hooks/useResolvedTheme';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import { ArtifactCode } from './ArtifactCode';
import { ArtifactPreview } from './ArtifactPreview';
import { ArtifactAIAnalysis } from './ArtifactAIAnalysis';
import { ArtifactImageEditor } from './ArtifactImageEditor';
import { CanvasFileTree } from './CanvasFileTree';
import { CanvasTabBar } from './CanvasTabBar';
import { Logo } from '../../common/Logo';
import {
  X,
  Code,
  Eye,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Archive,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Terminal,
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  Play,
  Edit3,
  Search
} from 'lucide-react';
import { toast } from '@/design-system';
import { buildArtifactSrcDoc, ensureArtifactFiles } from '../../../utils/artifactSandbox';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function ArtifactCanvas() {
  const {
    activeArtifact,
    closeArtifact,
    isFullscreen,
    setIsFullscreen,
    activeTab,
    setActiveTab,
    deviceViewport,
    setDeviceViewport,
    triggerRefresh,
    showConsole,
    setShowConsole,
    frameBg,
    setFrameBg,
    errorCount,
    isEditingCode,
    setIsEditingCode,
    showCodeSearch,
    setShowCodeSearch,
    showFileTree
  } = useArtifact();
  const { dir, language } = useAppContext();
  const { isDark } = useResolvedTheme();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canvasObserver = useResizeObserver<HTMLDivElement>({
    triggers: [isFullscreen, activeTab]
  });

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setIsFullscreen]);

  if (!activeArtifact) return null;

  const isAr = language === 'ar' || dir === 'rtl';
  const extension = activeArtifact.type === 'react'
    ? 'tsx'
    : activeArtifact.type === 'html'
    ? 'html'
    : activeArtifact.type === 'svg'
    ? 'svg'
    : 'txt';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeArtifact.content)
      .then(() => {
        setCopied(true);
        toast.success(isAr ? 'تم نسخ الشفرة البرمجية' : 'Code copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error(isAr ? 'فشل نسخ الشفرة' : 'Failed to copy code');
      });
  };

  const handleDownload = () => {
    const blob = new Blob([activeArtifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.id || 'artifact'}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'بدء تحميل الملف...' : 'Downloading file...');
  };

  const handleDownloadZip = async () => {
    try {
      const projectInfo = ensureArtifactFiles(activeArtifact);
      const zip = new JSZip();
      const filesToZip = projectInfo.files;
      const filePaths = Object.keys(filesToZip);

      if (filePaths.length === 0) {
        handleDownload();
        return;
      }

      filePaths.forEach(filePath => {
        const file = filesToZip[filePath];
        if (file) {
          zip.file(filePath, file.content);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const projectName = (activeArtifact.title || activeArtifact.id || 'project')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
      saveAs(zipBlob, `${projectName}.zip`);
      toast.success(isAr ? 'تم تصدير وتحميل المشروع بصيغة ZIP بنجاح' : 'Project exported and downloaded as ZIP');
    } catch (err: any) {
      console.error('ZIP export failed:', err);
      toast.error(isAr ? 'فشل تصدير ملف ZIP' : 'Failed to export ZIP file');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    toast.info(isAr ? 'تم تحديث المعاينة' : 'Preview refreshed');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenExternal = () => {
    const doc = buildArtifactSrcDoc(activeArtifact, {
      language,
      isDark,
      frameBg
    });
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div
      ref={canvasObserver.ref}
      className="flex flex-col w-full h-full bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] transition-theme"
    >
      {activeArtifact.type !== 'image' && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-[var(--border-default)] bg-[var(--surface-card)] shrink-0 gap-2 sm:gap-3 select-none transition-theme z-20 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] shrink-0">
              <Layers size={14} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate leading-tight max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
                {activeArtifact.title || (isAr ? 'الكانفاس التفاعلي' : 'Artifact Canvas')}
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                <span className="text-[9.5px] font-mono font-bold text-[var(--text-secondary)] uppercase bg-[var(--surface-subtle)] border border-[var(--border-default)] px-1.5 py-0.2 rounded-shape-xs shrink-0">
                  {extension}
                </span>
                <span className="text-[9.5px] font-bold text-[var(--text-muted)] shrink-0 hidden sm:inline">
                  {isAr ? `الإصدار ${activeArtifact.version || 1}` : `Version ${activeArtifact.version || 1}`}
                </span>
                <div className="flex items-center gap-1 px-1.5 py-0.2 bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] rounded-shape-xs border border-[var(--fg-success)]/20 text-[9.5px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse" />
                  <span>{activeTab === 'preview' ? (isAr ? 'نشط' : 'Live') : (isAr ? 'نشط' : 'Active')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center p-0.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm shrink-0 gap-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8 rounded-shape-sm text-xs font-bold transition-theme cursor-pointer relative before:absolute before:-inset-1.5 box-border active:scale-95 ${
                activeTab === 'preview'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
              }`}
            >
              <Eye size={14} className={activeTab === 'preview' ? 'text-[var(--fg-success)]' : ''} />
              <span className="text-[11px] whitespace-nowrap">{isAr ? 'المعاينة' : 'Preview'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8 rounded-shape-sm text-xs font-bold transition-theme cursor-pointer relative before:absolute before:-inset-1.5 box-border active:scale-95 ${
                activeTab === 'code'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
              }`}
            >
              <Code size={14} className={activeTab === 'code' ? 'text-[var(--fg-accent)]' : ''} />
              <span className="text-[11px] whitespace-nowrap">{isAr ? 'الكود' : 'Code'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8 rounded-shape-sm text-xs font-bold transition-theme cursor-pointer relative before:absolute before:-inset-1.5 box-border active:scale-95 ${
                activeTab === 'analysis'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
              }`}
            >
              <Logo size={16} fallbackType="cpu" />
              <span className="text-[11px] whitespace-nowrap hidden md:inline">{isAr ? 'التحليل' : 'Analysis'}</span>
              <span className="text-[11px] whitespace-nowrap md:hidden">AI</span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {activeTab === 'code' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('artifact_run_preview'));
                  }}
                  className="flex items-center gap-1.5 px-3 h-8 text-xs font-bold rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 transition-theme cursor-pointer shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
                  title={isAr ? 'حفظ الكود وتشغيل المعاينة الحية' : 'Save and Run Live Preview'}
                >
                  <Play size={13} className="fill-current" />
                  <span className="hidden sm:inline">{isAr ? 'تشغيل ومعاينة' : 'Run & Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingCode(!isEditingCode)}
                  className={`flex items-center gap-1.5 px-2.5 h-8 text-xs font-bold rounded-shape-sm border transition-theme cursor-pointer shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5 ${
                    isEditingCode
                      ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border-[var(--border-accent)]/40'
                      : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border-[var(--border-default)]'
                  }`}
                  title={isEditingCode ? (isAr ? 'إيقاف التعديل' : 'View Mode') : (isAr ? 'تعديل الكود' : 'Edit Mode')}
                >
                  {isEditingCode ? <Eye size={14} /> : <Edit3 size={14} />}
                  <span className="hidden md:inline">{isEditingCode ? (isAr ? 'معاينة' : 'View') : (isAr ? 'تعديل' : 'Edit')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCodeSearch(!showCodeSearch)}
                  className={`w-8 h-8 rounded-shape-sm border transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5 ${
                    showCodeSearch 
                      ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border-[var(--border-accent)]/40' 
                      : 'border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                  title={isAr ? 'بحث في الكود' : 'Search in Code'}
                >
                  <Search size={14} />
                </button>
              </>
            )}

            {activeTab === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
                  title={isAr ? 'تحديث المعاينة' : 'Refresh Preview'}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                </button>

                <div className="hidden lg:flex items-center p-0.5 bg-[var(--surface-subtle)] rounded-shape-sm border border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setDeviceViewport('desktop')}
                    className={`w-7 h-7 rounded-shape-xs transition-theme flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 box-border active:scale-95 ${
                      deviceViewport === 'desktop'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-bold border border-[var(--border-default)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                    title={isAr ? 'سطح المكتب' : 'Desktop'}
                  >
                    <Monitor size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeviceViewport('tablet')}
                    className={`w-7 h-7 rounded-shape-xs transition-theme flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 box-border active:scale-95 ${
                      deviceViewport === 'tablet'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-bold border border-[var(--border-default)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                    title={isAr ? 'جهاز لوحي' : 'Tablet'}
                  >
                    <Tablet size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeviceViewport('mobile')}
                    className={`w-7 h-7 rounded-shape-xs transition-theme flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 box-border active:scale-95 ${
                      deviceViewport === 'mobile'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-bold border border-[var(--border-default)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                    title={isAr ? 'هاتف محمول' : 'Mobile'}
                  >
                    <Smartphone size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setFrameBg(b => b === 'auto' ? 'dark' : b === 'dark' ? 'light' : 'auto')}
                  className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
                  title={isAr ? 'خلفية المعاينة' : 'Preview Theme'}
                >
                  {frameBg === 'dark' ? <Moon size={14} /> : frameBg === 'light' ? <Sun size={14} /> : <span className="text-[9.5px] font-bold">AUTO</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setShowConsole(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 h-8 rounded-shape-sm text-xs font-bold border transition-theme cursor-pointer shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5 ${
                    showConsole
                      ? 'bg-[var(--surface-subtle)] text-[var(--fg-accent)] border-[var(--border-default)]'
                      : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border-[var(--border-default)]'
                  }`}
                  title={isAr ? 'الطرفية' : 'Terminal Console'}
                >
                  <Terminal size={14} />
                  <span className="hidden xl:inline text-[11px]">{isAr ? 'الطرفية' : 'Terminal'}</span>
                  {errorCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                      {errorCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
                  title={isAr ? 'فتح في تبويب جديد' : 'Open in New Tab'}
                >
                  <ExternalLink size={14} />
                </button>
              </>
            )}

            <div className="w-px h-5 bg-[var(--border-default)] mx-0.5 shrink-0" />

            <button
              type="button"
              onClick={handleCopy}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
              title={isAr ? 'نسخ الكود' : 'Copy Code'}
            >
              {copied ? <Check size={14} className="text-[var(--fg-success)]" /> : <Copy size={14} />}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
              title={isAr ? 'تنزيل الملف' : 'Download File'}
            >
              <Download size={14} />
            </button>

            <button
              type="button"
              onClick={handleDownloadZip}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
              title={isAr ? 'تنزيل المشروع كاملاً (ZIP)' : 'Download Project as ZIP'}
            >
              <Archive size={14} />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
              title={isFullscreen ? (isAr ? 'خروج من الشاشة الكاملة (Esc)' : 'Exit Fullscreen (Esc)') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              type="button"
              onClick={closeArtifact}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-theme cursor-pointer flex items-center justify-center shrink-0 box-border active:scale-95 relative before:absolute before:-inset-1.5"
              title={isAr ? 'إغلاق الكانفاس' : 'Close Canvas'}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Multi-File Project Tab Bar */}
      {activeArtifact.type !== 'image' && (activeTab === 'code' || activeTab === 'preview') && (
        <CanvasTabBar />
      )}

      <div className="flex-1 overflow-hidden relative bg-[var(--surface-page)] flex flex-row min-h-0">
        {/* Collapsible File Tree Sidebar */}
        {activeArtifact.type !== 'image' && showFileTree && (activeTab === 'code' || activeTab === 'preview') && (
          <CanvasFileTree />
        )}

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {isFullscreen && activeArtifact.type !== 'image' && (
            <div className="absolute top-3 end-3 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-shape-full bg-[var(--surface-card)]/90 backdrop-blur-md border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-md transition-theme text-xs font-bold cursor-pointer active:scale-95"
              >
                <Minimize2 size={12} className="text-[var(--fg-accent)]" />
                <span>{isAr ? 'خروج' : 'Exit'}</span>
                <kbd className="text-[9px] font-mono px-1 py-0.2 bg-[var(--surface-subtle)] rounded-shape-xs border border-[var(--border-default)]">Esc</kbd>
              </button>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              className="flex-1 w-full h-full flex flex-col min-h-0 transform-gpu"
            >
              {activeArtifact.type === 'image' ? (
                <ArtifactImageEditor
                  artifact={activeArtifact}
                  onClose={closeArtifact}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                  isInChat={true}
                />
              ) : activeTab === 'code' ? (
                <ArtifactCode artifact={activeArtifact} />
              ) : activeTab === 'analysis' ? (
                <ArtifactAIAnalysis artifact={activeArtifact} />
              ) : (
                <ArtifactPreview artifact={activeArtifact} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

