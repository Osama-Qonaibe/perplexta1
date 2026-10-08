import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  X, 
  Sparkles, 
  Brain, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export interface FeedbackSubmissionData {
  feedback: number; // 1 or -1
  rating: number; // 1 to 5
  reason?: string;
  comment?: string;
  tags?: string[];
  userPrompt?: string;
  assistantResponse?: string;
}

interface MessageFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'like' | 'dislike';
  messageId: number;
  userPrompt?: string;
  assistantResponse?: string;
  dir?: 'ltr' | 'rtl';
  onSubmit: (data: FeedbackSubmissionData) => Promise<void>;
}

const PRAISE_TAGS_AR = [
  'دقة استثنائية',
  'شرح وافٍ ومفصل',
  'كود برمجي متقن',
  'تنظيم وترتيب رائع',
  'سرعة واحترافية'
];

const PRAISE_TAGS_EN = [
  'High Accuracy',
  'Comprehensive Explanation',
  'Clean Code',
  'Great Structure',
  'Fast & Professional'
];

const DISLIKE_REASONS_AR = [
  'معلومات غير دقيقة',
  'لم يتبع التعليمات',
  'إجابة ناقصة أو مبهمة',
  'خطأ برمجي في الكود',
  'أسلوب أو لغة غير ملائمة',
  'سبب آخر'
];

const DISLIKE_REASONS_EN = [
  'Inaccurate Info',
  'Ignored Instructions',
  'Incomplete Answer',
  'Code Bug / Error',
  'Inappropriate Tone',
  'Other Reason'
];

export const MessageFeedbackModal: React.FC<MessageFeedbackModalProps> = ({
  isOpen,
  onClose,
  type,
  messageId,
  userPrompt,
  assistantResponse,
  dir = 'rtl',
  onSubmit
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>(
    type === 'dislike' ? (dir === 'rtl' ? DISLIKE_REASONS_AR[0] : DISLIKE_REASONS_EN[0]) : ''
  );
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const tagsList = dir === 'rtl' ? PRAISE_TAGS_AR : PRAISE_TAGS_EN;
  const reasonsList = dir === 'rtl' ? DISLIKE_REASONS_AR : DISLIKE_REASONS_EN;

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        feedback: type === 'like' ? 1 : -1,
        rating: rating || (type === 'like' ? 5 : 1),
        reason: type === 'dislike' ? selectedReason : undefined,
        comment: comment.trim() || undefined,
        tags: type === 'like' ? selectedTags : undefined,
        userPrompt,
        assistantResponse
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
        onClick={onClose}
        dir={dir}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl overflow-hidden flex flex-col text-start rtl:text-right ltr:text-left max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]/40 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className={`w-7 h-7 rounded-shape-sm flex items-center justify-center shrink-0 border ${
                  type === 'like' 
                    ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/30' 
                    : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                }`}
              >
                {type === 'like' ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                  {type === 'like' 
                    ? (dir === 'rtl' ? 'تقييمك للمساعد يعزز قدراته' : 'Your rating reinforces assistant capabilities')
                    : (dir === 'rtl' ? 'ملاحظتك للمساعد تصحح مساره' : 'Your feedback corrects assistant path')
                  }
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-shape-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            {type === 'like' ? (
              <>
                {/* Star Rating Section */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center justify-between">
                    <span>{dir === 'rtl' ? 'درجة التقييم:' : 'Rating Score:'}</span>
                    <span className="text-amber-500 font-mono text-[11px] font-semibold">
                      {(hoverRating || rating)} / 5 {dir === 'rtl' ? 'نجوم' : 'stars'}
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5 py-0.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = (hoverRating || rating) >= starVal;
                      return (
                        <button
                          key={`star-${starVal}`}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(starVal)}
                          className="p-0.5 transition-transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
                        >
                          <Star
                            size={20}
                            className={`${
                              isActive
                                ? 'text-amber-400 fill-amber-400 drop-shadow-2xs'
                                : 'text-[var(--text-muted)] opacity-35'
                            } transition-colors`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Praise Tags */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    {dir === 'rtl' ? 'ما الذي نال إعجابك بالتحديد؟ (اختياري)' : 'What did you like most? (Optional)'}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {tagsList.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 h-8 rounded-shape-sm text-[11px] font-medium transition-theme cursor-pointer border ${
                            isSelected
                              ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border-[var(--fg-success)]/30 font-semibold'
                              : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-accent)]'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment / Praise Text */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    {dir === 'rtl' ? 'تعليق أو إشادة إضافية للمساعد:' : 'Additional comments or praise:'}
                  </label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      dir === 'rtl'
                        ? 'اكتب رأيك أو إشادتك بجودة التحليل هنا...'
                        : 'Write your comments on the quality of analysis...'
                    }
                    className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-accent transition-theme resize-none font-sans"
                  />
                </div>

                {/* Model Reinforcement & Email Notice Banner */}
                <div className="p-2.5 rounded-shape-sm bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--fg-success)] dark:text-[var(--fg-success)] font-bold text-[11px]">
                    <Sparkles size={13} className="shrink-0" />
                    <span>{dir === 'rtl' ? 'تثبيت القدرات وإشعار الإدارة' : 'Capability Reinforcement & Admin Notice'}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    {dir === 'rtl'
                      ? 'سيتم تسجيل هذا التقييم في ذاكرة المساعد لتعزيز أسلوبه وقدراته في الإجابات التالية، مع إرسال بريد مباشر للإدارة.'
                      : 'This rating will be registered in memory to reinforce strengths in future turns, and an email will be dispatched to administration.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Dislike Reason Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    {dir === 'rtl' ? 'سبب عدم الإعجاب:' : 'Reason for Dislike:'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {reasonsList.map((reason) => {
                      const isSelected = selectedReason === reason;
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setSelectedReason(reason)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-shape-sm text-[11px] font-medium text-start transition-theme cursor-pointer border ${
                            isSelected
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold'
                              : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-rose-500/20'
                          }`}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-rose-500 bg-rose-500' : 'border-[var(--border-default)]'
                            }`}
                          >
                            {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                          </div>
                          <span className="truncate">{reason}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Correction Guidance Textarea */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    {dir === 'rtl'
                      ? 'ما الخطأ وكيف يمكن للمساعد تصحيحه؟'
                      : 'What was the issue and how to correct it?'}
                  </label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    placeholder={
                      dir === 'rtl'
                        ? 'وضح الخطأ كي يتعلم النموذج منه ويتفاداه في الردود القادمة...'
                        : 'Specify the issue clearly so the assistant learns from it...'
                    }
                    className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-rose-500 transition-theme resize-none font-sans"
                  />
                </div>

                {/* Model Continuous Learning & Email Notice Banner */}
                <div className="p-2.5 rounded-shape-sm bg-rose-500/8 border border-rose-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                    <Brain size={13} className="shrink-0" />
                    <span>{dir === 'rtl' ? 'التعلّم النشط وتنبيه الإدارة' : 'Active Learning & Admin Alert'}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    {dir === 'rtl'
                      ? 'سيتم تزويد المساعد بالسبب لتعديل سلوكه وتفادي الخطأ، مع إرسال تقرير ببريد الإدارة.'
                      : 'The assistant will receive this feedback to correct behavior, and an alert will be sent to admin.'}
                  </p>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 h-8 rounded-shape-sm text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 h-8 rounded-shape-sm text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-2xs transition-theme cursor-pointer ${
                  type === 'like'
                    ? 'bg-[var(--comp-button-primary-bg)] hover:opacity-90 active:scale-98'
                    : 'bg-rose-600 hover:bg-rose-700 active:scale-98'
                } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
                    <span>
                      {type === 'like'
                        ? (dir === 'rtl' ? 'إرسال التقييم والإشادة' : 'Submit Praise')
                        : (dir === 'rtl' ? 'إرسال الملاحظة والتعلّم' : 'Submit Correction')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
