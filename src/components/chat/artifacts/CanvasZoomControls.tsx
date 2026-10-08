import React, { useState, useRef, useEffect } from 'react';
import { useArtifact } from '../../../context/ArtifactContext';
import { useAppContext } from '../../../context/AppContext';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  Maximize,
  Compass,
  Keyboard,
  Check,
  ChevronUp,
} from 'lucide-react';

interface CanvasZoomControlsProps {
  dragModeActive: boolean;
  onToggleDragMode: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onFitToScreen: () => void;
}

const ZOOM_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0, isDefault: true },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2.0 },
  { label: '300%', value: 3.0 },
  { label: '500%', value: 5.0 },
];

export function CanvasZoomControls({
  dragModeActive,
  onToggleDragMode,
  showMinimap,
  onToggleMinimap,
  onFitToScreen,
}: CanvasZoomControlsProps) {
  const {
    zoom,
    pan,
    zoomIn,
    zoomOut,
    setZoom,
    resetTransform,
  } = useArtifact();
  const { dir, language } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showHelpPopover, setShowHelpPopover] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  const isTransformed = zoom !== 1.0 || pan.x !== 0 || pan.y !== 0;

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPresetMenu(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelpPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (value: number) => {
    setZoom(value);
    setShowPresetMenu(false);
  };

  return (
    <div
      className="absolute bottom-4 start-4 z-30 flex items-center gap-1 p-1 bg-[var(--surface-card)]/90 backdrop-blur-md border border-[var(--border-default)] rounded-shape-md shadow-lg select-none transition-theme max-w-[calc(100%-32px)] overflow-visible"
    >
      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={zoomOut}
        disabled={zoom <= 0.1}
        className="w-8 h-8 rounded-shape-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-theme flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none relative before:absolute before:-inset-1.5"
        title={isAr ? 'تصغير (-)' : 'Zoom Out (-)'}
        aria-label={isAr ? 'تصغير' : 'Zoom Out'}
      >
        <ZoomOut size={14} />
      </button>

      {/* Preset / Percentage Trigger */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            setShowPresetMenu(v => !v);
            setShowHelpPopover(false);
          }}
          className={`px-2 h-8 rounded-shape-sm text-[11px] font-mono font-bold transition-colors duration-200 flex items-center gap-1 cursor-pointer active:scale-95 relative before:absolute before:-inset-1.5 bg-transparent border ${
            showPresetMenu 
              ? 'border-[var(--border-default)] text-[var(--fg-accent)]' 
              : 'border-transparent hover:border-[var(--border-accent)]/50 text-[var(--text-primary)]'
          }`}
          title={isAr ? 'قائمة نسب التكبير' : 'Zoom Presets'}
          aria-expanded={showPresetMenu}
        >
          <span>{Math.round(zoom * 100)}%</span>
          <ChevronUp
            size={11}
            className={`text-[var(--text-muted)] transition-transform duration-fast ${
              showPresetMenu ? 'rotate-180 text-[var(--fg-accent)]' : ''
            }`}
          />
        </button>

        {/* Quick Presets Dropdown */}
        {showPresetMenu && (
          <div
            className="absolute bottom-full mb-2 start-0 w-max min-w-[160px] p-1 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-0.5"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase border-b border-[var(--border-default)]/50 mb-0.5 flex items-center justify-between">
              <span>{isAr ? 'نسب التكبير' : 'Zoom Presets'}</span>
              <span className="font-mono text-[9px] text-[var(--fg-accent)] font-bold">{Math.round(zoom * 100)}%</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onFitToScreen();
                setShowPresetMenu(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold text-[var(--text-primary)] bg-transparent group transition-all duration-200 cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Maximize size={12} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-colors duration-200 shrink-0" />
                <span className="truncate group-hover:text-[var(--text-primary)] transition-colors duration-200">{isAr ? 'ملاءمة الشاشة' : 'Fit to View'}</span>
              </div>
              <kbd className="text-[10px] font-mono text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-colors ms-2">F</kbd>
            </button>

            <div className="h-px bg-[var(--border-default)] my-0.5" />

            {ZOOM_PRESETS.map(preset => {
              const isActive = Math.abs(zoom - preset.value) < 0.04;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold transition-all duration-200 cursor-pointer select-none group bg-transparent text-[var(--text-primary)]"
                >
                  <span className={`font-mono transition-colors duration-200 ${isActive ? 'text-[var(--fg-accent)] font-bold' : 'group-hover:text-[var(--text-primary)]'}`}>{preset.label}</span>
                  {isActive && <Check size={12} className="text-[var(--fg-accent)] shrink-0 ms-1.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={zoomIn}
        disabled={zoom >= 5.0}
        className="w-8 h-8 rounded-shape-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-theme flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none relative before:absolute before:-inset-1.5"
        title={isAr ? 'تكبير (+)' : 'Zoom In (+)'}
        aria-label={isAr ? 'تكبير' : 'Zoom In'}
      >
        <ZoomIn size={14} />
      </button>

      <div className="w-px h-4 bg-[var(--border-default)] mx-0.5" />

      {/* Hand Tool / Pan Mode Toggle */}
      <button
        type="button"
        onClick={onToggleDragMode}
        className={`w-8 h-8 rounded-shape-sm transition-theme flex items-center justify-center cursor-pointer active:scale-95 relative before:absolute before:-inset-1.5 ${
          dragModeActive
            ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-2xs font-bold'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)]'
        }`}
        title={isAr ? 'أداة التحريك اليدوي (المسافة + سحب)' : 'Hand Tool (Space + Drag)'}
        aria-label={isAr ? 'أداة التحريك اليدوي' : 'Hand Tool'}
      >
        <Hand size={14} />
      </button>

      {/* Fit to View Button */}
      <button
        type="button"
        onClick={onFitToScreen}
        className="w-8 h-8 rounded-shape-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-theme flex items-center justify-center cursor-pointer active:scale-95 relative before:absolute before:-inset-1.5"
        title={isAr ? 'ملاءمة الحجم داخل النافذة (F)' : 'Fit to View (F)'}
        aria-label={isAr ? 'ملاءمة الحجم' : 'Fit to View'}
      >
        <Maximize size={13} />
      </button>

      {/* Minimap Radar Toggle */}
      <button
        type="button"
        onClick={onToggleMinimap}
        className={`w-8 h-8 rounded-shape-sm transition-theme flex items-center justify-center cursor-pointer active:scale-95 relative before:absolute before:-inset-1.5 ${
          showMinimap
            ? 'bg-[var(--surface-subtle)] text-[var(--fg-accent)] border border-[var(--border-default)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)]'
        }`}
        title={isAr ? 'رادار الملاحة' : 'Minimap Navigator'}
        aria-label={isAr ? 'رادار الملاحة' : 'Minimap Navigator'}
      >
        <Compass size={14} />
      </button>

      {/* Reset Transform Button (if altered) */}
      {isTransformed && (
        <button
          type="button"
          onClick={resetTransform}
          className="w-8 h-8 rounded-shape-sm text-amber-500 hover:bg-amber-500/10 transition-theme flex items-center justify-center cursor-pointer active:scale-95 relative before:absolute before:-inset-1.5"
          title={isAr ? 'إعادة ضبط المحاذاة والتكبير (0)' : 'Reset Transform (0)'}
          aria-label={isAr ? 'إعادة ضبط المحاذاة والتكبير' : 'Reset Transform'}
        >
          <RotateCcw size={13} />
        </button>
      )}

      {/* Keyboard Shortcuts Helper */}
      <div className="relative" ref={helpRef}>
        <button
          type="button"
          onClick={() => {
            setShowHelpPopover(v => !v);
            setShowPresetMenu(false);
          }}
          className={`w-7 h-8 rounded-shape-sm transition-colors duration-200 flex items-center justify-center cursor-pointer active:scale-95 relative before:absolute before:-inset-1.5 bg-transparent border ${
            showHelpPopover
              ? 'border-[var(--border-default)] text-[var(--fg-accent)]'
              : 'border-transparent hover:border-[var(--border-accent)]/50 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title={isAr ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
          aria-label={isAr ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
        >
          <Keyboard size={13} className={showHelpPopover ? 'text-[var(--fg-accent)]' : ''} />
        </button>

        {showHelpPopover && (
          <div
            className="absolute bottom-full mb-2 end-0 w-64 p-3 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-default)]">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isAr ? 'اختصارات التحكم والتكبير' : 'Canvas Shortcuts'}
              </span>
              <Keyboard size={13} className="text-[var(--fg-accent)]" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>{isAr ? 'تكبير دقيق حول المؤشر' : 'Focal Zoom at cursor'}</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <kbd className="px-1 py-0.2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">Ctrl</kbd>
                  <span>+</span>
                  <span className="text-[var(--text-muted)]">{isAr ? 'عجلة الفأرة' : 'Wheel'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>{isAr ? 'التحريك الحر (بان)' : 'Pan Canvas'}</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <kbd className="px-1 py-0.2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">Space</kbd>
                  <span>+</span>
                  <span className="text-[var(--text-muted)]">{isAr ? 'سحب' : 'Drag'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>{isAr ? 'تكبير / تصغير' : 'Zoom In / Out'}</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <kbd className="px-1 py-0.2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">+</kbd>
                  <kbd className="px-1 py-0.2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">-</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>{isAr ? 'إعادة ضبط 100%' : 'Reset 100%'}</span>
                <kbd className="px-1.5 py-0.2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-[10px]">0</kbd>
              </div>

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>{isAr ? 'ملاءمة النافذة' : 'Fit to View'}</span>
                <kbd className="px-1.5 py-0.2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-[10px]">F</kbd>
              </div>

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>{isAr ? 'تحريك دقيق (بيكسل)' : 'Nudge Position'}</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{isAr ? 'الأسهم' : 'Arrow keys'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Numerical Coordinate & Zoom Pill (shown on hover or when transformed) */}
      {isTransformed && (
        <div className="hidden sm:flex items-center gap-1.5 ps-1.5 pe-2 py-0.5 text-[10px] font-mono tabular-nums text-[var(--text-muted)] border-s border-[var(--border-default)]">
          <span>X:{pan.x > 0 ? `+${pan.x}` : pan.x}</span>
          <span>Y:{pan.y > 0 ? `+${pan.y}` : pan.y}</span>
        </div>
      )}
    </div>
  );
}
