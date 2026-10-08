import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HighlightText } from '../../HighlightText';
import { ThinkingStep } from '../types';
import { AssistantIcon } from '@/design-system';
import { CognitiveOrbitRing } from '../common/CognitiveOrbitRing';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ThinkingStepsProps {
  steps?: ThinkingStep[];
  rawThinking?: string;
  isProcessing?: boolean;
  dir: 'ltr' | 'rtl';
  query?: string;
  thinkingTime?: number | string | null;
  tool?: string;
}

export const ThinkingSteps: React.FC<ThinkingStepsProps> = ({ 
  steps, 
  rawThinking, 
  isProcessing = false, 
  dir, 
  query, 
  thinkingTime,
  tool
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const maxObservedTimeRef = useRef<number>(0);

  // Live timer while processing
  useEffect(() => {
    if (isProcessing) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
          setLiveSeconds(elapsed);
          if (elapsed > maxObservedTimeRef.current) {
            maxObservedTimeRef.current = elapsed;
          }
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      if (liveSeconds > maxObservedTimeRef.current) {
        maxObservedTimeRef.current = liveSeconds;
      }
    }
  }, [isProcessing, liveSeconds]);

  // Check if raw thinking trace is available either via prop or inside steps
  const extractedRaw = rawThinking || (steps && steps.find((s: any) => s.is_raw_trace)?.step);

  const isImageTool = tool === 'image';
  const isVideoTool = tool === 'video';

  const defaultSteps = isImageTool ? [
    { step: dir === 'rtl' ? 'تحليل التوجيه الفني وتحديد التكوين البصري' : 'Prompt & Visual Composition Analysis', status: 'completed' as const },
    { step: dir === 'rtl' ? 'معالجة الترددات والطبقات التوليدية العصبونية' : 'Neural Latent Diffusion & Sampling', status: 'completed' as const },
    { step: dir === 'rtl' ? 'الرندرة النهائية وتطبيق فلاتر الدقة والوضوح' : 'High-Resolution Rendering & Polish', status: 'completed' as const }
  ] : isVideoTool ? [
    { step: dir === 'rtl' ? 'تحليل المشهد الزمني وتوليد الإطارات المفتاحية' : 'Keyframe Synthesis & Temporal Planning', status: 'completed' as const },
    { step: dir === 'rtl' ? 'رندرة وتنعيم الحركة الحركية العصبونية' : 'Motion Flow Interpolation & Physics', status: 'completed' as const },
    { step: dir === 'rtl' ? 'الترميز النهائي للملف عالي الوضوح' : 'High-Definition Video Encoding', status: 'completed' as const }
  ] : [
    { step: dir === 'rtl' ? 'تحليل وسياق الاستفسار وتحديد المتطلبات' : 'Context & Query Requirement Analysis', status: 'completed' as const },
    { step: dir === 'rtl' ? 'البحث والتحقق من المعارف والمصادر المتخصصة' : 'Deep Knowledge & Fact Retrieval', status: 'completed' as const },
    { step: dir === 'rtl' ? 'صياغة الاستجابة الدقيقة وتنظيم التنسيق النهائي' : 'Synthesizing Precise Structured Response', status: 'completed' as const }
  ];

  const hasExplicitSteps = steps && steps.length > 0 && !steps[0]?.is_raw_trace;
  const displaySteps = hasExplicitSteps ? steps : defaultSteps;

  const isCurrentlyProcessing = isProcessing || (steps ? steps.some(s => s.status === 'processing') : false);

  const displayedTimeVal = thinkingTime 
    ? (typeof thinkingTime === 'number' ? thinkingTime.toFixed(1) : String(thinkingTime))
    : (isCurrentlyProcessing
        ? liveSeconds.toFixed(1)
        : (maxObservedTimeRef.current > 0 ? maxObservedTimeRef.current.toFixed(1) : (displaySteps.length * 0.4).toFixed(1)));

  const formattedTime = `${displayedTimeVal}s`;

  const headerLabel = isCurrentlyProcessing
    ? (isImageTool 
        ? (dir === 'rtl' ? 'جاري إنشاء وتوليد الصورة...' : 'Synthesizing & Rendering Image...') 
        : isVideoTool 
          ? (dir === 'rtl' ? 'جاري توليد الفيديو والمشاهد...' : 'Rendering Video Sequences...') 
          : (dir === 'rtl' ? 'جاري التفكير والتحليل...' : 'Reasoning & Analyzing...'))
    : (isImageTool 
        ? (dir === 'rtl' ? 'تم إنشاء وتوليد الصورة بنجاح' : 'Image Generated Successfully') 
        : isVideoTool 
          ? (dir === 'rtl' ? 'تم توليد الفيديو بنجاح' : 'Video Generated Successfully') 
          : (dir === 'rtl' ? 'تم التفكير والتحليل' : 'Reasoning & Analysis'));

  return (
    <div className="mb-3 bg-transparent border-0 overflow-hidden transition-all duration-200 select-none" id="thinking-steps-container">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="group inline-flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-shape-sm text-xs font-medium bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 transition-colors cursor-pointer select-none shadow-2xs"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative flex items-center justify-center shrink-0 w-[22px] h-[22px]">
            <AssistantIcon 
              size={12} 
              fallbackType="cpu"
              isSpinning={false} 
              dir={dir} 
              className="text-accent shrink-0 relative z-10" 
            />
            <CognitiveOrbitRing
              isSpinning={isCurrentlyProcessing}
              dir={dir}
              size={24}
              radius={10}
              strokeWidth={1.5}
              strokeDasharray="4.5 2.5"
            />
          </div>
          <span className="font-bold text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            {headerLabel}
          </span>
          <span className="text-[10.5px] font-mono font-semibold text-[var(--text-muted)]">
            ({formattedTime})
          </span>
        </div>

        <div className="flex items-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors ms-1">
          {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </div>
      </button>

      {/* Steps or Raw Thinking Accordion Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden mt-2 p-3.5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs"
          >
            {extractedRaw ? (
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2 font-mono selection:bg-accent/20">
                <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[var(--border-default)] text-[11px] font-bold text-[var(--fg-accent)] font-sans">
                  <Brain size={13} className="shrink-0" />
                  <span>{dir === 'rtl' ? 'مسار الاستدلال الداخلي (Cognitive Trace)' : 'Internal Reasoning Trace'}</span>
                </div>
                <div className="markdown-body text-xs leading-relaxed opacity-90 overflow-x-auto whitespace-pre-wrap font-sans">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {extractedRaw}
                  </Markdown>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {displaySteps.map((step, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: dir === 'rtl' ? 6 : -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.15 }}
                    key={`step-${step.step || idx}-${idx}`} 
                    className="flex items-center gap-2.5 group"
                  >
                    {step.status === 'completed' || !isCurrentlyProcessing ? (
                      <div className="w-4 h-4 rounded-full bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/30 flex items-center justify-center text-[var(--fg-success)] shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    ) : step.status === 'processing' || isCurrentlyProcessing ? (
                      <div className="w-4 h-4 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                        <Loader2 size={10} className="animate-spin" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                      </div>
                    )}
                    <span className={`text-xs font-semibold leading-normal ${step.status === 'completed' || !isCurrentlyProcessing ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'} transition-theme truncate`}>
                      <HighlightText text={step.step} query={query} />
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
