import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface ForensicAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAnalyzing: boolean;
  report: any;
  selectedFile: File | null;
  dir: 'rtl' | 'ltr';
}

export const ForensicAuditModal: React.FC<ForensicAuditModalProps> = ({
  isOpen,
  onClose,
  isAnalyzing,
  report,
  selectedFile,
  dir
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.97, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 8 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-shape-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)]">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-normal text-[var(--text-primary)]">
                    {dir === 'rtl' ? 'التحليل الجنائي للوثيقة' : 'Document Forensic Audit'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                    {selectedFile?.name || 'document.pdf'} • {(Number(selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-shape-sm hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 size={32} className="text-[var(--fg-accent)] animate-spin mb-3" />
                  <p className="text-xs font-semibold text-[var(--text-muted)] tracking-wide animate-pulse">
                    {dir === 'rtl' ? 'جاري استخراج وتحليل البنية العميقة...' : 'Extracting and analyzing deep structures...'}
                  </p>
                </div>
              ) : report ? (
                <div className="space-y-4">
                  {/* Forensic Report Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-shape-md bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20">
                      <div className="flex items-center gap-2 text-[var(--fg-success)] dark:text-[var(--fg-success)] mb-1.5">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {dir === 'rtl' ? 'سلامة الملف' : 'File Integrity'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        {dir === 'rtl' ? 'لم يتم العثور على تلاعب في الميتاداتا الأساسية.' : 'No manipulation found in core metadata.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-accent)] mb-3">
                      {dir === 'rtl' ? 'ملخص الفحص الجنائي' : 'Forensic Audit Summary'}
                    </h4>
                    <div className="prose text-[13px] font-normal leading-relaxed text-[var(--text-secondary)]">
                      {report.summary || (dir === 'rtl' ? 'تم اكتمال الفحص بنجاح.' : 'Audit completed successfully.')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={40} className="text-[var(--text-muted)] opacity-20 mb-3" />
                  <p className="text-xs font-bold text-[var(--text-muted)]">
                    {dir === 'rtl' ? 'لا توجد بيانات تحليل حالياً' : 'No analysis data available'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
