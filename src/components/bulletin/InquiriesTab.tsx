import React from 'react';
import { MessageSquare, ArrowRight, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { AdMessengerHub } from '../AdMessengerHub';
import { BulletinAd } from '../../../server/db/types';

export interface InquiriesTabProps {
  isRtl: boolean;
  setActiveTab: (tab: any) => void;
  selectedInboxAd: BulletinAd | null;
  setSelectedInboxAd: (ad: BulletinAd | null) => void;
  inquiriesSearchTerm: string;
  setInquiriesSearchTerm: (term: string) => void;
  inquiriesLoading: boolean;
  inquiriesList: any[];
  filteredInquiriesList: any[];
  fetchInquiries: () => void;
}

export const InquiriesTab: React.FC<InquiriesTabProps> = ({
  isRtl,
  setActiveTab,
  selectedInboxAd,
  setSelectedInboxAd,
  inquiriesSearchTerm,
  setInquiriesSearchTerm,
  inquiriesLoading,
  inquiriesList,
  filteredInquiriesList,
  fetchInquiries,
}) => {
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {/* Header Bar */}
      <div className="rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] p-3 shadow-xs transition-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('board')}
              className="w-8 h-8 shrink-0 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/40 hover:bg-accent/10 flex items-center justify-center text-[var(--text-primary)] hover:text-accent transition-[color,background-color,border-color,transform] duration-fast active:scale-95 cursor-pointer shadow-2xs"
              title={isRtl ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
            >
              {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            </button>
            <h2 className="text-sm font-extrabold flex items-center gap-2 truncate text-[var(--text-primary)]">
              <MessageSquare size={16} className="text-accent shrink-0" />
              <span className="truncate">{isRtl ? 'صندوق الرسائل والمحادثات' : 'Messenger & Inquiries'}</span>
            </h2>
          </div>

          {!selectedInboxAd && (
            <div className="relative w-full sm:w-60 shrink-0">
              <input
                type="text"
                value={inquiriesSearchTerm}
                onChange={e => setInquiriesSearchTerm(e.target.value)}
                placeholder={isRtl ? 'بحث في الرسائل...' : 'Search messages...'}
                className={`w-full h-8 ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'} bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/40 focus:border-accent/40 rounded-shape-sm text-xs outline-none transition-colors duration-fast text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-2xs`}
              />
              <Search size={13} className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none`} />
            </div>
          )}

          {selectedInboxAd && (
            <button
              onClick={() => setSelectedInboxAd(null)}
              className="h-8 px-3 shrink-0 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/40 hover:bg-accent/10 text-xs font-bold text-[var(--text-primary)] hover:text-accent transition-[color,background-color,border-color,transform] duration-fast flex items-center gap-1.5 w-full sm:w-auto justify-center cursor-pointer shadow-2xs active:scale-95"
            >
              {isRtl ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
              <span>{isRtl ? 'رجوع للقائمة' : 'Back to List'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Section */}
      {inquiriesLoading ? (
        <div className="text-center py-16 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs flex items-center justify-center gap-3 transition-theme">
          <Loader2 size={18} className="animate-spin text-accent" />
          <span className="text-xs font-bold text-[var(--text-muted)]">
            {isRtl ? 'جاري تحميل صندوق الرسائل...' : 'Loading messenger...'}
          </span>
        </div>
      ) : inquiriesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-3 text-center transition-theme">
          <div className="w-12 h-12 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)]">
            <MessageSquare size={22} />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {isRtl ? 'لا توجد رسائل حالياً' : 'No Messages Yet'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isRtl
                ? 'ستظهر هنا الرسائل والمحادثات حول إعلاناتك ومنشوراتك.'
                : 'Incoming messages and inquiries about your posts will appear here.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('board')}
            className="mt-1 h-8 px-3.5 rounded-shape-sm bg-accent text-[var(--text-primary)] hover:opacity-90 font-bold text-xs transition-[opacity,transform] duration-fast flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            {isRtl ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
            <span>{isRtl ? 'العودة للخلاصة' : 'Back to Feed'}</span>
          </button>
        </div>
      ) : (
        <AdMessengerHub
          inquiries={filteredInquiriesList}
          onRefresh={fetchInquiries}
          isRtl={isRtl}
        />
      )}
    </div>
  );
};
