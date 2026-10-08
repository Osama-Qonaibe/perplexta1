import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '@/design-system';
import {
  ShieldAlert,
  X,
  Lock,
  Send,
  Loader2,
  CheckCircle2,
  Paperclip,
  FileText,
  Camera,
  Wrench,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface ContentSafetyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: number | string;
  assistantResponse?: string;
  userPrompt?: string;
  token: string | null;
  dir: 'ltr' | 'rtl';
}

export const REPORT_CATEGORIES = [
  {
    id: 'safety',
    labelAr: 'سياسات الأمان',
    labelEn: 'Safety Policies',
    icon: <ShieldCheck size={15} />
  },
  {
    id: 'technical',
    labelAr: 'تقني',
    labelEn: 'Technical',
    icon: <Wrench size={15} />
  },
  {
    id: 'general',
    labelAr: 'عام',
    labelEn: 'General',
    icon: <Globe size={15} />
  }
];

export const ContentSafetyReportModal: React.FC<ContentSafetyReportModalProps> = ({
  isOpen,
  onClose,
  messageId,
  assistantResponse,
  userPrompt,
  token,
  dir
}) => {
  const isRtl = dir === 'rtl';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<'safety' | 'technical' | 'general'>('safety');
  const [reportText, setReportText] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(isRtl ? 'حجم الملف يتجاوز 10 ميجابايت' : 'File size exceeds 10MB');
        return;
      }
      setAttachmentName(file.name);
      toast.success(isRtl ? `تم إرفاق: ${file.name}` : `Attached: ${file.name}`);
    }
  };

  const handleExportPDF = () => {
    try {
      const content = `========================================
[Perplexta Content Safety Report Document]
========================================
Date: ${new Date().toLocaleString()}
Message ID: ${messageId}
Category: ${category}

[AI Response Snippet]:
${assistantResponse || 'No response snippet'}
========================================`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Safety_Report_Msg_${messageId}_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(isRtl ? 'تم تصدير مستند الرد كملف جاهز للإرفاق' : 'Report document exported successfully');
    } catch (e) {
      toast.error(isRtl ? 'فشل التصدير' : 'Export failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      toast.error(isRtl ? 'يرجى كتابة سبب الإبلاغ (حتى 100 حرف)' : 'Please enter report reason (up to 100 chars)');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryObj = REPORT_CATEGORIES.find(c => c.id === category) || REPORT_CATEGORIES[0];
      const categoryLabel = isRtl ? categoryObj.labelAr : categoryObj.labelEn;

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId,
          category,
          categoryLabel,
          details: reportText.trim().slice(0, 100),
          contactInfo: contactInfo.trim(),
          attachmentName: attachmentName || '',
          reason: `[${categoryLabel}] ${reportText.trim().slice(0, 100)}`,
          assistantResponse: assistantResponse ? assistantResponse.slice(0, 500) : '',
          userPrompt: userPrompt ? userPrompt.slice(0, 300) : ''
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to submit report');
      }

      setIsSubmitted(true);
      toast.success(isRtl ? 'تم إرسال البلاغ بنجاح' : 'Report submitted successfully');
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'حدث خطأ أثناء إرسال البلاغ' : 'Error submitting report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {/* High Z-Index Modal Covering Full Page (Header, Sidebar, Canvas) */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl overflow-hidden flex flex-col text-start rtl:text-right ltr:text-left"
          dir={dir}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]/40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-shape-sm bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={16} />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isRtl ? 'الإبلاغ عن سياسات أمان المحتوى' : 'Content Safety Policy Report'}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-shape-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Body */}
          {isSubmitted ? (
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/30 flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                {isRtl ? 'تم استلام البلاغ بنجاح' : 'Report Received'}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                {isRtl ? 'تم إرسال بلاغك وتنبيه الإدارة لمراجعته وإجراء المطلوب.' : 'Admin notified for safety review.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              {/* Category Selector Pills */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-muted)] block">
                  {isRtl ? 'فئة الإبلاغ:' : 'Category:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {REPORT_CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-shape-sm text-xs font-bold transition-all border cursor-pointer ${
                          active
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/40 shadow-2xs'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        {cat.icon}
                        <span>{isRtl ? cat.labelAr : cat.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Report Message Field (Max 100 chars) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    {isRtl ? 'سبب الإبلاغ والمخالفة (حتى 100 حرف):' : 'Violation Reason (Max 100 chars):'}
                  </label>
                  <span className={`text-[10px] font-mono ${reportText.length >= 100 ? 'text-rose-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                    {reportText.length} / 100
                  </span>
                </div>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value.slice(0, 100))}
                  maxLength={100}
                  rows={2}
                  placeholder={isRtl ? 'اكتب سبب الإبلاغ المباشر...' : 'Enter direct violation reason...'}
                  className="w-full px-3 py-2 text-xs rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-rose-500 transition-all resize-none font-sans"
                />
              </div>

              {/* Follow-up Contact Info */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-muted)] block">
                  {isRtl ? 'نموذج لمعاودة الاتصال (بريد أو هاتف):' : 'Follow-up Contact (Email or Phone):'}
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={isRtl ? 'البريد أو الهواتف لمعاودة الاتصال عند الضرورة...' : 'Contact info for follow-up if required...'}
                  className="w-full px-3 py-1.5 text-xs rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-rose-500 transition-all font-sans"
                />
              </div>

              {/* Encryption Note & Screen/PDF Attachment Controls */}
              <div className="p-2.5 rounded-shape-sm bg-[var(--surface-subtle)]/70 border border-[var(--border-default)] text-[10px] space-y-2">
                <div className="flex items-start gap-1.5 text-[var(--text-muted)] leading-relaxed">
                  <Lock size={12} className="text-[var(--fg-success)] shrink-0 mt-0.5" />
                  <span>
                    {isRtl 
                      ? 'ملاحظة: نظراً لأننا نستخدم تشفير AES-256 ولا يمكننا الوصول لدردشاتك، يمكنك إرفاق لقطة شاشة أو تصدير ملف PDF للرد المُراد الإبلاغ عنه.'
                      : 'Note: Since messages use AES-256 encryption and cannot be read, you can attach a screenshot or PDF report file.'
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1 px-2 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--text-muted)] text-[var(--text-primary)] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                  >
                    <Camera size={12} className="text-[var(--fg-accent)] shrink-0" />
                    <span className="truncate">
                      {attachmentName ? (isRtl ? `مُرفق: ${attachmentName}` : attachmentName) : (isRtl ? 'إرفاق لقطة شاشة' : 'Attach Screenshot')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="py-1 px-2.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--text-muted)] text-[var(--text-primary)] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <FileText size={12} className="text-[var(--fg-success)]" />
                    <span>{isRtl ? 'تصدير PDF' : 'Export PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 h-8 rounded-shape-sm text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 h-8 rounded-shape-sm bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{isRtl ? 'جاري الإرسال...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} className={isRtl ? 'rotate-180' : ''} />
                      <span>{isRtl ? 'إرسال البلاغ' : 'Submit Report'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
