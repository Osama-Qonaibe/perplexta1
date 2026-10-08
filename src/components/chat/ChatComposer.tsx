import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { themeConfig, PopCard, ActionItem } from '../../design-system';
import { 
  Send, Square, Plus, Mic, ChevronUp, ChevronDown, 
  Zap, Sparkles, ArrowUpRight, Lock, ArrowUp, Paperclip, Search, Clock
} from 'lucide-react';
import { getMatchingSuggestions } from '../../constants/contextualSuggestions';
import { useArtifact } from '../../context/ArtifactContext';
import { useAppContext } from '../../context/AppContext';
import { SCROLL_STYLES, HOVER_STYLES } from '../../styles/scrollStyles';

interface ChatComposerProps {
  query: string;
  setQuery: (val: string) => void;
  isGenerating: boolean;
  handleSendOrStop: (overrideQuery?: string) => void;
  isInputDisabled: boolean;
  dir: 'rtl' | 'ltr';
  t: (key: string) => string;
  selectedTool: string;
  setSelectedTool: (val: string) => void;
  selectedModel: string;
  setSelectedModel: (val: any) => void;
  activeDropdown: 'tool' | 'model';
  setActiveDropdown: (val: 'tool' | 'model') => void;
  isRecording: boolean;
  toggleRecording: () => void;
  interimText: string;
  setInterimText: (val: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  forensicMode: boolean;
  setForensicMode: (val: boolean) => void;
  triggerForensicDiagnostic: () => void;
  ledgerNotice: any;
  typedNotice: string;
  isAspectBarCollapsed: boolean;
  setIsAspectBarCollapsed: (val: boolean) => void;
  videoSettings: any;
  setVideoSettings?: (val: any | ((prev: any) => any)) => void;
  imageSettings: any;
  setImageSettings?: (val: any | ((prev: any) => any)) => void;
  handleSelectAspectRatio: (ratio: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setIsFocused: (val: boolean) => void;
  startWriting: () => void;
  resetWriting: () => void;
  handleUserTyping: () => void;
  isAdvancedToolsOpen: boolean;
  setIsAdvancedToolsOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  isModelMenuOpen: boolean;
  setIsModelMenuOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  advancedTools: any[];
  models: any[];
  currentTool: any;
  currentModel: any;
  currentPlan: any;
  balance: number;
  balanceUSD: number;
  navigate: (path: string) => void;
  toolsMenuRef: React.RefObject<HTMLDivElement | null>;
  modelsMenuRef: React.RefObject<HTMLDivElement | null>;
  getFileIcon: (type: string) => React.ReactNode;
  setForensicReport: (val: any) => void;
  messages?: any[];
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  query, setQuery, isGenerating, handleSendOrStop, isInputDisabled, dir, t,
  selectedTool, setSelectedTool, selectedModel, setSelectedModel,
  activeDropdown, setActiveDropdown, isRecording, toggleRecording,
  interimText, setInterimText, selectedFile, setSelectedFile,
  previewUrl, setPreviewUrl, forensicMode, setForensicMode,
  triggerForensicDiagnostic, ledgerNotice, typedNotice,
  isAspectBarCollapsed, setIsAspectBarCollapsed,
  videoSettings, imageSettings, handleSelectAspectRatio,
  handleFileChange, textareaRef, setIsFocused,
  startWriting, resetWriting, handleUserTyping,
  isAdvancedToolsOpen, setIsAdvancedToolsOpen,
  isModelMenuOpen, setIsModelMenuOpen,
  advancedTools, models, currentTool, currentModel,
  currentPlan, balance, balanceUSD, navigate,
  toolsMenuRef, modelsMenuRef, getFileIcon, setForensicReport,
  messages
}) => {
  const { isArtifactOpen, activeArtifact } = useArtifact();
  const isImageActive = isArtifactOpen && activeArtifact?.type === 'image';

  const [activeSuggestionIndex, setActiveSuggestionIndex] = React.useState<number>(-1);
  const [isSuggestionsDismissed, setIsSuggestionsDismissed] = React.useState<boolean>(false);
  const [isFocused, setIsFocusedLocal] = React.useState<boolean>(false);
  const suggestionsRef = React.useRef<HTMLDivElement | null>(null);

  // Compute zero-latency suggestions (re-evaluate on focus to randomize empty-query suggestions)
  const suggestions = React.useMemo(() => {
    return getMatchingSuggestions(query, selectedTool, dir, 6);
  }, [query, selectedTool, dir, isFocused]);

  // Reset dismiss state and suggestion index when query changes
  React.useEffect(() => {
    setIsSuggestionsDismissed(false);
    setActiveSuggestionIndex(-1);
  }, [query]);

  // Reset dismiss state when selected tool changes
  React.useEffect(() => {
    setIsSuggestionsDismissed(false);
    setActiveSuggestionIndex(-1);
  }, [selectedTool]);

  const { isMobile } = useAppContext();

  // 🏛️ Pyramid Sorting: Shortest to Longest String Length (1 -> 22 -> 333 -> 4444)
  const sortedModels = React.useMemo(() => {
    return [...models].sort((a, b) => (a.label || '').trim().length - (b.label || '').trim().length);
  }, [models]);

  const sortedAdvancedTools = React.useMemo(() => {
    const sorted = [...advancedTools].sort((a, b) => (a.label || '').trim().length - (b.label || '').trim().length);
    if (isMobile) {
      return sorted.filter(t => t.id !== 'code' && t.id !== 'audio_studio');
    }
    return sorted;
  }, [advancedTools, isMobile]);

  const shouldShowSuggestions = Boolean(
    isFocused && !isGenerating && !isSuggestionsDismissed && (!messages || messages.length === 0)
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isAdvancedToolsOpen &&
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setIsAdvancedToolsOpen(false);
      }
      if (
        isModelMenuOpen &&
        modelsMenuRef.current &&
        !modelsMenuRef.current.contains(event.target as Node)
      ) {
        setIsModelMenuOpen(false);
      }
      // Dismiss suggestions if clicking outside the whole input container and the suggestions menu
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node) &&
        (!suggestionsRef.current || !suggestionsRef.current.contains(event.target as Node))
      ) {
        setIsSuggestionsDismissed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isAdvancedToolsOpen, isModelMenuOpen, toolsMenuRef, modelsMenuRef, setIsAdvancedToolsOpen, setIsModelMenuOpen, textareaRef]);

  const handleSelectSuggestion = (suggestion: any) => {
    const textToInsert = suggestion.text;
    setQuery(textToInsert);
    setIsSuggestionsDismissed(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full flex flex-col box-border min-w-0 relative z-30 overflow-visible">
      <div className="relative w-full overflow-visible">
        <AnimatePresence>
          {ledgerNotice && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: -2 }}
              transition={{ 
                opacity: { duration: 0.35, ease: "easeInOut" },
                y: { duration: 0.4, ease: "easeInOut" }
              }}
              className="absolute bottom-full left-0 mb-2 w-full z-50 pointer-events-none"
            >
              <div 
                className={`flex items-center gap-2 font-sans text-xs sm:text-[13px] md:text-[14px] font-medium leading-relaxed select-none ${dir === 'rtl' ? 'justify-start text-right pr-1' : 'justify-start text-left pl-1'}`}
                style={{ 
                  color: currentPlan?.plan_color || '#334155',
                  textShadow: `0 0 14px ${(currentPlan?.plan_color || '#334155')}45`
                }}
              >
                <span>{typedNotice || ''}</span>
                {typedNotice && typedNotice.length < (dir === 'rtl' ? ledgerNotice.textAr : ledgerNotice.textEn).length && (
                  <span 
                    className="inline-block w-1.5 h-4 animate-pulse bg-current relative top-0.5" 
                    style={{ backgroundColor: currentPlan?.plan_color || '#334155' }} 
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(selectedTool === 'video' || selectedTool === 'image') && (
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 self-start select-none max-w-full">
            <AnimatePresence mode="wait">
              {!isAspectBarCollapsed ? (
                <motion.div 
                  key="expanded-ratio-strip"
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 max-w-full overflow-hidden"
                >
                  <div className="inline-flex items-stretch h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent divide-x divide-[var(--border-default)] rtl:divide-x-reverse overflow-x-auto scrollbar-none">
                    {['16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '1:1'].map((ratio) => {
                      const currentRatio = selectedTool === 'video'
                        ? (videoSettings?.aspectRatio || '1:1')
                        : (imageSettings?.aspectRatio || '1:1');
                      const isActive = currentRatio === ratio;

                      const RATIO_TOOLTIPS: Record<string, { ar: string; en: string }> = {
                        '16:9': { ar: '16:9 - عرضي / يوتيوب وسينما', en: '16:9 - Landscape / Cinema' },
                        '9:16': { ar: '9:16 - طولي / ريلز وتيك توك وستوري', en: '9:16 - Portrait / Reels & TikTok' },
                        '4:3':  { ar: '4:3 - كلاسيكي عريض', en: '4:3 - Standard Landscape' },
                        '3:4':  { ar: '3:4 - كلاسيكي طولي', en: '3:4 - Standard Portrait' },
                        '3:2':  { ar: '3:2 - فوتوغرافي أفقي', en: '3:2 - Classic Photo Landscape' },
                        '2:3':  { ar: '2:3 - فوتوغرافي رأسي', en: '2:3 - Classic Photo Portrait' },
                        '1:1':  { ar: '1:1 - مربع / انستغرام', en: '1:1 - Square' },
                      };

                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => handleSelectAspectRatio(ratio)}
                          title={dir === 'rtl' ? RATIO_TOOLTIPS[ratio]?.ar : RATIO_TOOLTIPS[ratio]?.en}
                          className={`px-2.5 sm:px-3 h-full flex items-center justify-center text-[11px] font-mono font-bold transition-all duration-200 whitespace-nowrap active:scale-95 bg-transparent ${
                            isActive
                              ? 'text-[var(--fg-accent)] font-extrabold'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:brightness-125'
                          }`}
                        >
                          {ratio}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAspectBarCollapsed(true);
                      localStorage.setItem('perplexta_aspect_bar_collapsed', 'true');
                    }}
                    title={dir === 'rtl' ? 'طي شريط الأبعاد' : 'Collapse ratio bar'}
                    className="w-8 h-8 flex items-center justify-center rounded-shape-sm border border-[var(--border-default)] bg-transparent hover:border-[var(--border-accent)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 active:scale-95 shrink-0 cursor-pointer group relative before:absolute before:-inset-1.5 before:content-['']"
                  >
                    <ChevronUp size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="collapsed-ratio-strip"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={() => {
                    setIsAspectBarCollapsed(false);
                    localStorage.setItem('perplexta_aspect_bar_collapsed', 'false');
                  }}
                  title={dir === 'rtl' ? 'توسيع شريط الأبعاد' : 'Expand ratio bar'}
                  className="h-8 px-2.5 flex items-center justify-center gap-1.5 rounded-shape-sm border border-[var(--border-default)] bg-transparent hover:border-[var(--border-accent)]/60 transition-colors duration-200 active:scale-95 group shrink-0 text-[11px] font-mono font-bold cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
                >
                  <span className="text-[var(--fg-accent)] font-extrabold">
                    {selectedTool === 'video'
                      ? (videoSettings?.aspectRatio || '1:1')
                      : (imageSettings?.aspectRatio || '1:1')}
                  </span>
                  <ChevronDown size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="relative w-full max-w-3xl mx-auto box-border">
          <motion.div 
            className="w-full select-none relative flex flex-col box-border min-w-0 ide-input-box p-3.5 shadow-lg"
          >
          {isRecording && (
            <div className="px-3.5 py-3.5 bg-[var(--status-danger)]/10 border-b border-dashed border-[var(--status-danger)]/20 flex flex-col gap-2.5 transition-theme mb-3 rounded-shape-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-shape-xs bg-[var(--status-danger)]/75"></span>
                    <span className="relative inline-flex rounded-shape-xs h-2.5 w-2.5 bg-[var(--status-danger)]"></span>
                  </span>
                  <span className="text-xs font-black text-[var(--status-danger)] animate-pulse uppercase tracking-wider font-sans">
                    {dir === 'rtl' ? 'جاري الاستماع وتدوين الصوت...' : 'LISTENING & TRANSCRIBING...'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-end gap-0.5 h-4 select-none pr-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.span
                        key={`chat-sound-wave-${i}`}
                        className="w-0.5 bg-[var(--status-danger)] rounded-shape-xs"
                        animate={{
                          height: ["4px", "16px", "4px"]
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: i * 0.08,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className="text-[10px] font-black uppercase text-[var(--status-danger)] hover:opacity-90 px-2 py-0.5 rounded-shape-xs border border-[var(--status-danger)]/25 hover:bg-[var(--status-danger)]/10 transition-theme"
                  >
                    {dir === 'rtl' ? 'إيقاف' : 'Stop'}
                  </button>
                </div>
              </div>
              <div className="text-[14px] text-[var(--text-secondary)] italic min-h-[36px] bg-[var(--surface-subtle)] rounded-shape-sm px-3 py-2 flex items-center justify-between gap-3 border border-[var(--border-subtle)]">
                <span className="truncate max-w-[80%]">
                  {interimText ? (
                    <span className="text-[var(--text-primary)] font-bold not-italic font-sans">{interimText}</span>
                  ) : (
                    <span className="text-[var(--text-muted)] opacity-70 font-sans">
                      {dir === 'rtl' ? 'تحدث الآن ليتم تدوين كلامك هنا في الوقت الفعلي...' : 'Speak now to see real-time transcription here...'}
                    </span>
                  )}
                </span>
                {interimText && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(query + ' ' + interimText);
                      setInterimText('');
                    }}
                    className="text-[10px] font-black uppercase text-[var(--fg-accent)] hover:opacity-90 border border-[var(--border-accent)]/30 hover:bg-[var(--bg-accent-muted)] px-2 py-1 rounded-shape-xs transition-theme shrink-0 cursor-pointer"
                  >
                    {dir === 'rtl' ? 'إدراج' : 'Insert'}
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="px-2 pb-3 flex items-start gap-2">
              <div className="relative group p-1.5 rounded-shape-md border border-[var(--border-default)] transition-theme bg-[var(--surface-subtle)] flex-shrink-0 flex items-center gap-2">
                <div className="flex items-center gap-2 px-1.5 py-1 min-w-[120px]">
                  {previewUrl && selectedFile.type.startsWith('image/') ? (
                    <div className="w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)]">
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-shape-sm flex items-center justify-center bg-[var(--surface-card)] text-[var(--fg-accent)] border border-[var(--border-default)] shadow-xs">
                      {getFileIcon(selectedFile.type)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 pr-6">
                    <span className="text-[10px] font-bold text-[var(--text-primary)] truncate max-w-[100px] font-sans">
                      {selectedFile.name}
                    </span>
                    <span className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-tight font-mono">
                      {(Number(selectedFile.size || 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setForensicMode(false);
                    setForensicReport(null);
                    const input = document.getElementById('unified-upload') as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--status-danger)] text-white rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-theme z-10"
                >
                  <Plus size={10} className="rotate-45" />
                </button>
              </div>

              {selectedFile.type === 'application/pdf' && (
                <div className="flex items-center gap-3 self-center pl-2 border-l-0 ml-2 h-10 select-none">
                  <button
                    type="button"
                    onClick={triggerForensicDiagnostic}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-shape-sm border border-transparent hover:border-[var(--border-accent)]/40 hover:bg-[var(--bg-accent-muted)] text-xs font-semibold text-[var(--fg-accent)] transition-theme shadow-none bg-transparent cursor-pointer"
                  >
                    <Sparkles size={13} className="text-[var(--fg-accent)] animate-pulse" />
                    <span>{dir === 'rtl' ? 'فحص جنائي مباشر' : 'Run Forensic Scan'}</span>
                  </button>

                  <div className="w-px h-5 bg-[var(--border-default)]" />

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={forensicMode}
                        onChange={(e) => setForensicMode(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-4 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-full transition-theme ${forensicMode ? 'bg-[var(--accent)] border-[var(--border-accent)]' : ''}`} />
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-[var(--surface-card)] shadow-xs transition-transform duration-300 ${forensicMode ? 'transform translate-x-4' : ''}`} />
                    </div>
                    <span className={`text-[10px] font-bold font-sans ${forensicMode ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'}`}>
                      {dir === 'rtl' ? 'وضع التحقيق الجنائي' : 'Forensic Mode'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          <input 
            type="file" 
            id="unified-upload" 
            className="hidden" 
            accept="*/*" 
            onChange={handleFileChange} 
            disabled={isInputDisabled}
          />

          {/* 1. Textarea Input Area */}
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              e.target.style.height = '48px';
              e.target.style.height = `${Math.max(48, Math.min(e.target.scrollHeight, 200))}px`;
              if (val.trim().length > 0) {
                startWriting();
              } else {
                resetWriting();
              }
              handleUserTyping();
            }}
            onFocus={() => {
              setIsFocusedLocal(true);
              setIsFocused(true);
              setIsSuggestionsDismissed(false);
            }}
            onBlur={() => {
              setIsFocusedLocal(false);
              setIsFocused(false);
            }}
            onKeyDown={(e) => {
              if (shouldShowSuggestions && suggestions.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                  return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                    e.preventDefault();
                    handleSelectSuggestion(suggestions[activeSuggestionIndex].suggestion);
                    setActiveSuggestionIndex(-1);
                    return;
                  }
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsSuggestionsDismissed(true);
                  return;
                }
              }

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                resetWriting();
                handleSendOrStop();
                if (textareaRef.current) textareaRef.current.style.height = '48px'; 
              }
            }}
            disabled={isInputDisabled}
            placeholder={
              isInputDisabled
                ? (dir === 'rtl' ? 'يرجى تفعيل باقة اشتراك أو شحن الرصيد للبدء بالاستخدام...' : 'Please activate a subscription plan or top up your balance to start...')
                : (dir === 'rtl' ? 'اكتب موضوع البحث أو التحليل المطلوب...' : 'Type search topic or required analysis...')
            }
            className={`w-full bg-transparent text-[16px] sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none leading-relaxed font-sans min-h-[48px] custom-scrollbar ${dir === 'rtl' ? 'text-right' : 'text-left'} ${isInputDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
            dir={dir || "rtl"}
            rows={2}
            style={{ minHeight: '48px', maxHeight: '200px', height: '48px' }}
          />

          {query.length > 500 && (
            <span className={`absolute bottom-[60px] ${dir === 'rtl' ? 'left-4' : 'right-4'} text-[10px] font-mono select-none pointer-events-none transition-theme ${query.length > 15000 ? 'text-[var(--fg-danger)] font-bold' : 'text-[var(--text-muted)]'}`}>
              {query.length.toLocaleString()} / 16,000
            </span>
          )}

          {/* Dedicated inset floating divider between the textarea and the bottom toolbar - perfectly centered */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent -mt-2 mb-2" />

          {/* 2. Bottom Toolbar (Single-Row Baseline & Language Button Visual Identity) */}
          <div className="flex items-center justify-between px-3.5 py-2.5 flex-nowrap -mx-3.5 -mb-3.5 sm:-mx-3.5 sm:-mb-3.5 bg-[var(--surface-subtle)] border-t border-[var(--border-subtle)] rounded-b-shape-md transition-colors">
            
            {/* Left Action Chips / Tools */}
            <div className="flex items-center gap-2 sm:gap-2 flex-nowrap min-w-0">
              <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                    {/* FAST Accent Chip */}
                    <div ref={modelsMenuRef} className="relative shrink-0">
                      {(() => {
                        const isModelActive = ['chat_fast', 'chat_pro', 'chat_reasoning'].includes(selectedTool);
                        return (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isInputDisabled) {
                                  setIsModelMenuOpen(prev => !prev);
                                  setIsAdvancedToolsOpen(false);
                                }
                              }}
                              className={`w-8 h-8 sm:w-auto sm:px-2.5 sm:h-8 flex items-center justify-center gap-1 sm:gap-1.5 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 transition-all duration-200 active:scale-95 text-xs font-mono cursor-pointer shrink-0 bg-transparent relative before:absolute before:-inset-1.5 sm:before:hidden before:content-[''] box-border ${
                                isModelActive 
                                  ? 'text-[var(--text-primary)]' 
                                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-2xs'
                              }`}
                            >
                              <span className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                                {React.isValidElement(currentModel?.icon) 
                                  ? React.cloneElement(currentModel.icon as React.ReactElement<{ size?: number; className?: string }>, { 
                                      size: 14, 
                                      className: `w-3.5 h-3.5 transition-all duration-300 ${
                                        isModelActive 
                                          ? 'text-[var(--fg-accent)] fill-[var(--fg-accent)]' 
                                          : 'text-[var(--text-muted)]'
                                      }` 
                                    })
                                  : <Zap className={`w-3.5 h-3.5 transition-all duration-300 ${
                                      isModelActive 
                                        ? 'fill-[var(--fg-accent)] text-[var(--fg-accent)]' 
                                        : 'text-[var(--text-muted)]'
                                    }`} />}
                              </span>
                              <span className="hidden sm:inline whitespace-nowrap">{isModelActive ? currentModel?.label : (dir === 'rtl' ? 'سريع' : 'FAST')}</span>
                              <ChevronDown className="w-3 h-3 hidden sm:inline ml-0.5 shrink-0 text-[var(--text-muted)] transition-colors" />
                            </button>

                            {isModelMenuOpen && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.10, ease: [0.16, 1, 0.3, 1] }}
                                style={{ transformOrigin: dir === 'rtl' ? 'bottom right' : 'bottom left' }}
                                className={`absolute bottom-full mb-2 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-40 p-1.5 rounded-shape-md border border-[var(--border-default)] shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col gap-0.5 z-[200] bg-[var(--surface-card)] backdrop-blur-2xl`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {sortedModels.map((model, idx) => {
                                  const limit = currentPlan?.limits?.[model.id];
                                  const isZeroLimit = limit?.daily === 0 && limit?.monthly === 0;
                                  const hasBalance = (balance && balance > 0) || (balanceUSD && balanceUSD > 0);
                                  const isLocked = currentPlan ? isZeroLimit && !hasBalance : false;
                                  const isSelected = selectedModel === model.id && isModelActive;

                                  return (
                                    <button 
                                      key={`${model.id}-${idx}`} 
                                      onClick={() => {
                                        if (isLocked) return;
                                        setSelectedModel(model.id as any);
                                        const targetTool = model.id === 'fast' ? 'chat_fast' : model.id === 'pro' ? 'chat_pro' : model.id === 'thinking' ? 'chat_reasoning' : 'chat_fast';
                                        setSelectedTool(targetTool);
                                        setActiveDropdown('model');
                                        setIsModelMenuOpen(false);
                                      }}
                                      className={`group flex items-center justify-between w-full h-[36px] min-h-[36px] px-3 py-2 rounded-shape-sm flex-nowrap transition-all duration-fast text-xs font-medium cursor-pointer ${
                                        isLocked
                                          ? 'opacity-40 cursor-not-allowed text-[var(--text-disabled)]'
                                          : isSelected
                                            ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-semibold border border-[var(--border-accent)]/30'
                                            : HOVER_STYLES.dropdownItem + ' border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 flex-nowrap">
                                        <span className={`shrink-0 flex items-center justify-center w-3.5 h-3.5 transition-colors duration-fast ${
                                          isLocked 
                                            ? 'text-[var(--text-disabled)] opacity-60' 
                                            : isSelected 
                                              ? 'text-[var(--fg-accent)] fill-[var(--fg-accent)]' 
                                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                                        }`}>
                                          {React.isValidElement(model.icon) 
                                            ? React.cloneElement(model.icon as React.ReactElement<{ size?: number; className?: string }>, { 
                                                size: 14, 
                                                className: `w-3.5 h-3.5 transition-colors duration-fast ${isSelected ? 'text-[var(--fg-accent)]' : ''}` 
                                              })
                                            : <Zap className={`w-3.5 h-3.5 transition-colors duration-fast ${isSelected ? 'fill-[var(--fg-accent)] text-[var(--fg-accent)]' : ''}`} />}
                                        </span>
                                        <span className={`whitespace-nowrap transition-colors duration-fast ${
                                          isLocked ? '' : 'group-hover:text-[var(--text-primary)]'
                                        }`}>
                                          {model.label}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        {isLocked && (
                                          <Lock size={11} className="text-[var(--fg-warning)] shrink-0" />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Analysis Dropdown Chip */}
                    <div ref={toolsMenuRef} className="relative shrink-0">
                      {(() => {
                        const isToolActive = !['chat_fast', 'chat_pro', 'chat_reasoning'].includes(selectedTool);
                        return (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isInputDisabled) {
                                  setIsAdvancedToolsOpen(prev => !prev);
                                  setIsModelMenuOpen(false);
                                }
                              }}
                              className={`w-8 h-8 sm:w-auto sm:px-2.5 sm:h-8 flex items-center justify-center gap-1 sm:gap-1.5 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 transition-all duration-200 active:scale-95 text-xs font-medium cursor-pointer shrink-0 bg-transparent relative before:absolute before:-inset-1.5 sm:before:hidden before:content-[''] box-border ${
                                isToolActive 
                                  ? 'text-[var(--text-primary)]' 
                                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-2xs'
                              }`}
                            >
                              <span className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                                {React.isValidElement(currentTool?.icon) 
                                  ? React.cloneElement(currentTool.icon as React.ReactElement<{ size?: number; className?: string }>, { 
                                      size: 14, 
                                      className: `w-3.5 h-3.5 shrink-0 transition-all duration-300 ${isToolActive ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'}` 
                                    })
                                  : <Search className={`w-3.5 h-3.5 shrink-0 transition-all duration-300 ${isToolActive ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'}`} />}
                              </span>
                              <span className="hidden sm:inline whitespace-nowrap">{currentTool?.label || (dir === 'rtl' ? 'تحليل' : 'Analysis')}</span>
                              <ChevronDown className="w-3 h-3 hidden sm:inline ml-0.5 shrink-0 text-[var(--text-muted)] transition-colors" />
                            </button>

                            {isAdvancedToolsOpen && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.10, ease: [0.16, 1, 0.3, 1] }}
                                style={{ transformOrigin: dir === 'rtl' ? 'bottom right' : 'bottom left' }}
                                className={`absolute bottom-full mb-2 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-52 max-w-[calc(100vw-2rem)] rounded-shape-md border border-[var(--border-default)] shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col z-[200] overflow-hidden bg-[var(--surface-card)] backdrop-blur-2xl p-1.5`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className={`flex flex-col gap-0.5 ${SCROLL_STYLES.limited('70vh')} sm:max-h-[60vh]`}>
                                  {sortedAdvancedTools.map((tool, tIdx) => {
                                    const limit = currentPlan?.limits?.[tool.id];
                                    const isZeroLimit = limit?.daily === 0 && limit?.monthly === 0;
                                    const hasBalance = (balance && balance > 0) || (balanceUSD && balanceUSD > 0);
                                    const isLocked = currentPlan ? isZeroLimit && !hasBalance : false;
                                    const isSelected = selectedTool === tool.id;

                                    return (
                                      <button 
                                        key={`adv-tool-${tool.id}-${tIdx}`} 
                                        onClick={() => {
                                          if (isLocked) return;
                                          if (tool.id === 'code') {
                                            navigate('/app');
                                            setIsAdvancedToolsOpen(false);
                                            return;
                                          }
                                          if (tool.id === 'audio_studio' || tool.isRouter) {
                                            navigate('/audio-studio');
                                            setIsAdvancedToolsOpen(false);
                                            return;
                                          }
                                          setSelectedTool(tool.id);
                                          setActiveDropdown('tool');
                                          setIsAdvancedToolsOpen(false);
                                        }}
                                        className={`group flex items-center justify-between w-full h-[36px] min-h-[36px] px-3 py-2 rounded-shape-sm transition-all duration-fast text-xs font-medium cursor-pointer select-none active:scale-98 ${
                                          isLocked 
                                            ? 'opacity-40 cursor-not-allowed text-[var(--text-disabled)]'
                                            : isSelected 
                                              ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-semibold border border-[var(--border-accent)]/30'
                                              : HOVER_STYLES.dropdownItem + ' border border-transparent'
                                        }`}
                                      >
                                        {/* Tool Label & Icon */}
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className={`shrink-0 flex items-center justify-center w-3.5 h-3.5 transition-colors duration-fast ${
                                            isLocked 
                                              ? 'text-[var(--text-disabled)] opacity-70' 
                                              : isSelected 
                                                ? 'text-[var(--fg-accent)]' 
                                                : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                                          }`}>
                                            {React.isValidElement(tool.icon) 
                                              ? React.cloneElement(tool.icon as React.ReactElement<{ size?: number; className?: string }>, { 
                                                  size: 14, 
                                                  className: `w-3.5 h-3.5 transition-colors duration-fast ${isSelected ? 'text-[var(--fg-accent)]' : ''}` 
                                                })
                                              : <Sparkles className={`w-3.5 h-3.5 transition-colors duration-fast ${isSelected ? 'text-[var(--fg-accent)]' : ''}`} />}
                                          </span>
                                          <span className={`truncate transition-colors duration-fast ${
                                            isLocked ? '' : 'group-hover:text-[var(--text-primary)]'
                                          }`}>
                                            {tool.label}
                                          </span>
                                        </div>

                                        {/* Badges / Router Arrow / Lock */}
                                        <div className="flex items-center gap-1 shrink-0 ms-2">
                                          {tool.isRouter && !isLocked && (
                                            <ArrowUpRight size={13} className="text-[var(--fg-accent)] shrink-0" />
                                          )}
                                          {tool.isNew && !isLocked && !isSelected && !tool.isRouter && (
                                            <span className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[8.5px] font-mono font-bold uppercase tracking-wider">
                                              NEW
                                            </span>
                                          )}
                                          {isLocked && (
                                            <Lock size={11} className="text-[var(--fg-warning)] shrink-0" />
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Voice Input Chip */}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={isInputDisabled}
                      className={`w-8 h-8 sm:w-auto sm:px-2.5 sm:h-8 flex items-center justify-center gap-1 sm:gap-1.5 rounded-shape-sm border transition-all duration-200 active:scale-95 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer bg-transparent relative before:absolute before:-inset-1.5 sm:before:hidden before:content-[''] box-border ${
                        isRecording 
                          ? 'border-[var(--fg-danger)]/60 text-[var(--fg-danger)] animate-pulse' 
                          : 'border-[var(--border-default)] hover:border-[var(--border-accent)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-2xs'
                      }`}
                    >
                      <Mic className={`w-3.5 h-3.5 shrink-0 transition-all duration-300 ${isRecording ? 'text-[var(--fg-danger)]' : 'text-[var(--text-muted)]'}`} />
                      <span className="hidden sm:inline whitespace-nowrap">{isRecording ? (dir === 'rtl' ? 'تسجيل...' : 'Recording...') : (dir === 'rtl' ? 'صوت' : 'Voice')}</span>
                    </button>
              </div>

              {/* Attach File Chip */}
              <button
                type="button"
                onClick={() => {
                  if (!isInputDisabled) {
                    document.getElementById('unified-upload')?.click();
                  }
                }}
                disabled={isInputDisabled}
                className="w-8 h-8 sm:w-auto sm:px-2.5 sm:h-8 flex items-center justify-center gap-1 sm:gap-1.5 rounded-shape-sm border border-[var(--border-default)] bg-transparent hover:border-[var(--border-accent)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-200 active:scale-95 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-2xs relative before:absolute before:-inset-1.5 sm:before:hidden before:content-[''] box-border"
              >
                <Paperclip className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{dir === 'rtl' ? 'إرفاق' : 'Attach'}</span>
              </button>
            </div>

            {/* Right Submit Action Button (Language Button Visual Identity - rounded-shape-sm) */}
            <button
              type="button"
              onClick={() => {
                handleSendOrStop();
              }}
              disabled={!query.trim() && !isGenerating}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center shrink-0 active:scale-95 transition-all duration-fast border cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] box-border ${
                isGenerating
                  ? 'bg-[var(--fg-danger)] text-white border-[var(--fg-danger)] hover:opacity-90 font-bold shadow-md animate-pulse'
                  : query.trim()
                    ? 'bg-[var(--accent)] text-[var(--fg-on-emphasis)] border-[var(--border-accent)] hover:opacity-90 font-bold shadow-xs'
                    : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-default)] opacity-40 cursor-not-allowed'
              }`}
              title={isGenerating ? (dir === 'rtl' ? 'إيقاف التوليد' : 'Stop Generation') : (dir === 'rtl' ? 'إرسال' : 'Send')}
            >
              {isGenerating ? (
                <Square className="w-3.5 h-3.5 fill-current shrink-0 text-white" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>

          </div>
        </motion.div>

        {/* Smooth Absolute Floating Autocomplete Suggestions Box */}
        <AnimatePresence>
          {shouldShowSuggestions && suggestions.length > 0 && (
            <motion.div 
              ref={suggestionsRef}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.10, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full mt-2 left-0 right-0 z-50 pointer-events-auto box-border overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl backdrop-blur-xl p-1.5 space-y-0.5 text-[var(--text-primary)]"
            >
              <div className={`w-full ${SCROLL_STYLES.limited('260px')} space-y-0.5`}>
                {suggestions.map((item, idx) => {
                  const isHighlighted = activeSuggestionIndex === idx;
                  const categoryText = dir === 'rtl' ? item.suggestion.categoryAr : item.suggestion.categoryEn;

                  return (
                    <div
                      key={item.suggestion.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item.suggestion);
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      className={`group flex items-center justify-between h-8 w-full px-2.5 rounded-shape-sm text-xs cursor-pointer transition-colors duration-fast border ${
                        isHighlighted 
                          ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] font-medium border-[var(--border-default)]' 
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <Search className={`w-3.5 h-3.5 shrink-0 transition-colors duration-fast ${isHighlighted ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} />
                        <span className="inline-flex items-center gap-1.5 text-xs truncate">
                          {item.matchedPrefix ? (
                            <span className="text-[var(--text-muted)] font-normal shrink-0">
                              {item.matchedPrefix}
                            </span>
                          ) : null}
                          <span className="truncate text-[var(--text-primary)] transition-colors duration-fast">
                            {item.remainingText}
                          </span>
                        </span>
                      </div>
                      {categoryText ? (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-shape-xs border shrink-0 transition-colors duration-fast ${
                          isHighlighted 
                            ? 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface-card)]' 
                            : 'text-[var(--text-muted)] border-[var(--border-default)]/60 bg-transparent'
                        }`}>
                          {categoryText}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
};
