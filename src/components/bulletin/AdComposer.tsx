import React from 'react';
import { Radio, Video, Clapperboard, Sparkles } from 'lucide-react';
import { BulletinAvatar } from '../BulletinAvatar';
import { toast } from '@/design-system';

export interface AdComposerProps {
  user: any;
  token: string | null;
  isRtl: boolean;
  setIsAdModalOpen: (open: boolean) => void;
  setIsStreamSetupOpen: (open: boolean) => void;
  openPostUploadModal: () => void;
  openReelUploadModal: () => void;
  openStudioModal?: () => void;
}

export const AdComposer: React.FC<AdComposerProps> = ({
  user,
  token,
  isRtl,
  setIsAdModalOpen,
  setIsStreamSetupOpen,
  openPostUploadModal,
  openReelUploadModal,
  openStudioModal
}) => {
  return (
    <div className="p-2.5 sm:p-4 bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-default)] shadow-xs flex flex-col gap-2 sm:gap-3 w-full">
      <div className="flex items-center gap-2 sm:gap-2.5 w-full">
        <BulletinAvatar
          src={user?.avatar}
          alt={user?.name || 'User'}
          size="sm"
        />
        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            setIsAdModalOpen(true);
          }}
          className="flex-1 min-w-0 text-start px-2.5 sm:px-3.5 h-8.5 sm:h-10 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[11px] sm:text-xs text-[var(--text-muted)] font-medium transition-all duration-fast border border-[var(--border-default)] hover:border-accent/40 cursor-pointer truncate flex items-center shadow-2xs"
        >
          {isRtl ? 'بم تفكر اليوم؟' : "What's on your mind?"}
        </button>
      </div>

      <div className="flex items-center justify-around border-t border-[var(--border-default)] pt-1.5 sm:pt-2.5 text-[10px] sm:text-xs text-[var(--text-muted)] gap-0.5 sm:gap-1 w-full">
        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            setIsStreamSetupOpen(true);
          }}
          className="flex-1 h-7 sm:h-8 flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 rounded-shape-sm hover:bg-rose-500/10 font-bold transition-all duration-fast text-rose-500 whitespace-nowrap cursor-pointer shadow-2xs active:scale-95 relative before:absolute before:-inset-2 before:content-['']"
        >
          <Radio size={12} className="sm:size-[14px] text-rose-500 shrink-0" />
          <span className="truncate">{isRtl ? 'بث مباشر' : 'Live'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            openPostUploadModal();
          }}
          className="flex-1 h-7 sm:h-8 flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 rounded-shape-sm hover:bg-accent/10 font-bold transition-all duration-fast text-accent whitespace-nowrap cursor-pointer shadow-2xs active:scale-95 relative before:absolute before:-inset-2 before:content-['']"
        >
          <Video size={12} className="sm:size-[14px] text-accent shrink-0" />
          <span className="truncate">{isRtl ? 'فيديو/صورة' : 'Media'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            if (openStudioModal) {
              openStudioModal();
            } else {
              openReelUploadModal();
            }
          }}
          className="flex-1 h-7 sm:h-8 flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 rounded-shape-sm hover:bg-accent/10 font-bold transition-all duration-fast text-accent whitespace-nowrap cursor-pointer shadow-2xs active:scale-95 relative before:absolute before:-inset-2 before:content-['']"
        >
          <Clapperboard size={12} className="sm:size-[14px] text-accent shrink-0" />
          <span className="truncate">{isRtl ? 'استوديو ريلز' : 'Reels Studio'}</span>
        </button>
      </div>
    </div>
  );
};
