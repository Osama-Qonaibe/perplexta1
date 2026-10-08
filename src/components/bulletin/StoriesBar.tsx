import React from 'react';
import { Camera, Clapperboard, Plus, Video, CheckCircle2, MapPin, ChevronDown } from 'lucide-react';
import { BulletinAvatar } from '../BulletinAvatar';
import { toast } from '@/design-system';

export interface StoriesBarProps {
  isRtl: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  token: string | null;
  user: any;
  setIsStoryModalOpen: (open: boolean) => void;
  onOpenUploadStory?: (mode?: 'media' | 'text') => void;
  onOpenUploadReel?: () => void;
  representativeStories: any[];
  orderedStories: any[];
  previewingVideoStoryId: any;
  setPreviewingVideoStoryId: (id: any) => void;
  setSelectedStoryIndex: (index: number) => void;
  setIsStoryViewerOpen: (open: boolean) => void;
  storyPressTimerRef: React.MutableRefObject<any>;
  getMediaUrl: (url?: string) => string;
  // Optional Location Props
  selectedCity?: string;
  selectedRadius?: string;
  selectedCities?: string[];
  selectedCountries?: string[];
  setIsLocationFlyoutOpen?: (open: boolean) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  isRtl,
  activeTab,
  setActiveTab,
  token,
  user,
  setIsStoryModalOpen,
  onOpenUploadStory,
  onOpenUploadReel,
  representativeStories,
  orderedStories,
  previewingVideoStoryId,
  setPreviewingVideoStoryId,
  setSelectedStoryIndex,
  setIsStoryViewerOpen,
  storyPressTimerRef,
  getMediaUrl,
  selectedCity,
  selectedRadius,
  selectedCities = [],
  selectedCountries = [],
  setIsLocationFlyoutOpen,
}) => {
  const cityLabel = selectedCities && selectedCities.length > 0
    ? `${selectedCities.length} ${isRtl ? 'مدن' : 'cities'} (${selectedCities.slice(0, 2).join('، ')}${selectedCities.length > 2 ? '...' : ''})`
    : selectedCountries && selectedCountries.length > 0
    ? `${selectedCountries.length} ${isRtl ? 'دول' : 'countries'} (${selectedCountries.slice(0, 2).join('، ')}${selectedCountries.length > 2 ? '...' : ''})`
    : selectedCity === 'all' || !selectedCity
    ? isRtl
      ? 'كافة المدن'
      : 'All Cities'
    : `${selectedCity}${selectedRadius && selectedRadius !== 'all' ? ` (+${selectedRadius}كم)` : ''}`;

  return (
    <div className="p-2 sm:p-3.5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-2 sm:space-y-2.5">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-0.5 border-b border-[var(--border-default)] pb-1.5 sm:pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`h-6.5 sm:h-7 px-2 sm:px-2.5 rounded-shape-sm text-[11px] sm:text-xs font-bold transition-colors duration-fast flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs shrink-0 ${
              activeTab === 'board' ? 'bg-accent/10 text-accent border border-accent/25' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
            }`}
          >
            <Camera size={12} className="sm:size-[13px]" />
            <span>{isRtl ? 'قصص' : 'Stories'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reels')}
            className={`h-6.5 sm:h-7 px-2 sm:px-2.5 rounded-shape-sm text-[11px] sm:text-xs font-bold transition-colors duration-fast flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs shrink-0 ${
              activeTab === 'reels' ? 'bg-accent/10 text-accent border border-accent/25' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
            }`}
          >
            <Clapperboard size={12} className="sm:size-[13px]" />
            <span>{isRtl ? 'ريلز' : 'Reels'}</span>
          </button>

          {/* Location Selector Button placed directly beside Reels button with matching size and professional alignment */}
          {setIsLocationFlyoutOpen && (
            <button
              type="button"
              onClick={() => setIsLocationFlyoutOpen(true)}
              className="h-6.5 sm:h-7 px-2 sm:px-2.5 rounded-shape-sm text-[11px] sm:text-xs font-bold transition-[color,background-color,border-color,transform] duration-fast flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] hover:text-accent border border-[var(--border-default)] hover:border-accent/40 max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] truncate shrink-0 active:scale-95"
              title={isRtl ? 'تصفية حسب المدينة والمنطقة' : 'Filter by City/Region'}
            >
              <MapPin size={11} className="sm:size-[12px] text-accent shrink-0" />
              <span className="truncate">{cityLabel}</span>
              <ChevronDown size={10} className="sm:size-[11px] text-[var(--text-muted)] shrink-0" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-1 pt-0.5 px-0.5 touch-pan-x snap-x snap-mandatory">
        {/* Dual Primary Create Card (2 Sections: Story & Reel) */}
        <div className="relative w-[104px] h-[164px] xs:w-[116px] xs:h-[184px] sm:w-[132px] sm:h-[210px] rounded-shape-md overflow-hidden bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-accent/50 shrink-0 snap-start flex divide-x rtl:divide-x-reverse divide-[var(--border-default)] shadow-2xs transition-[border-color,box-shadow] duration-base ease-[var(--motion-ease)] hover:shadow-md select-none">
          {/* Section 1: رفع قصة (Story upload) */}
          <button
            type="button"
            onClick={() => {
              if (!token) {
                toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                return;
              }
              if (onOpenUploadStory) {
                onOpenUploadStory('media');
              } else {
                setIsStoryModalOpen(true);
              }
            }}
            className="flex-1 h-full flex flex-col items-center justify-center p-1 sm:p-2 hover:bg-accent/10 active:bg-accent/20 transition-colors duration-fast cursor-pointer group/story focus:outline-none"
            title={isRtl ? 'إنشاء قصة (صور أو نص أو فيديو)' : 'Create Story (Photo, text or video)'}
          >
            <div className="w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-10 sm:h-10 rounded-shape-sm xs:rounded-shape-md bg-accent text-[var(--text-primary)] flex items-center justify-center shadow-xs group-hover/story:scale-110 active:scale-95 transition-transform mb-1 sm:mb-2 font-bold">
              <Plus size={15} className="sm:size-[18px] stroke-[2.5]" />
            </div>
            <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-[var(--text-primary)] group-hover/story:text-accent transition-colors text-center leading-tight">
              {isRtl ? 'قصة' : 'Story'}
            </span>
            <span className="text-[8px] xs:text-[8.5px] sm:text-[9.5px] text-[var(--text-muted)] mt-0.5 text-center leading-tight">
              {isRtl ? 'صورة / نص' : 'Story'}
            </span>
          </button>

          {/* Section 2: رفع مقطع ريلز (Reel upload) */}
          <button
            type="button"
            onClick={() => {
              if (!token) {
                toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                return;
              }
              if (onOpenUploadReel) {
                onOpenUploadReel();
              } else {
                setActiveTab('reels');
              }
            }}
            className="flex-1 h-full flex flex-col items-center justify-center p-1 sm:p-2 hover:bg-purple-500/10 active:bg-purple-500/20 transition-colors duration-fast cursor-pointer group/reel focus:outline-none"
            title={isRtl ? 'رفع مقطع ريلز عمودي' : 'Upload Vertical Reel'}
          >
            <div className="w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-10 sm:h-10 rounded-shape-sm xs:rounded-shape-md bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xs group-hover/reel:scale-110 active:scale-95 transition-transform mb-1 sm:mb-2">
              <Clapperboard size={14} className="sm:size-[17px]" />
            </div>
            <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-[var(--text-primary)] group-hover/reel:text-purple-500 transition-colors text-center leading-tight">
              {isRtl ? 'ريلز' : 'Reel'}
            </span>
            <span className="text-[8px] xs:text-[8.5px] sm:text-[9.5px] text-[var(--text-muted)] mt-0.5 text-center leading-tight">
              {isRtl ? 'فيديو' : 'Video'}
            </span>
          </button>
        </div>

        {/* User & Merchant Stories (Full card size without division) */}
        {representativeStories.map((story: any, sIdx: number) => {
          const viewerStartIndex = orderedStories.findIndex((s: any) => s.id === story.id);

          return (
            <div
              key={`rep-story-${story.id || 'st'}-${sIdx}`}
              onClick={() => {
                if (previewingVideoStoryId === story.id) return;
                setSelectedStoryIndex(viewerStartIndex >= 0 ? viewerStartIndex : 0);
                setIsStoryViewerOpen(true);
              }}
              className="relative w-[104px] h-[164px] xs:w-[116px] xs:h-[184px] sm:w-[132px] sm:h-[210px] rounded-shape-md overflow-hidden bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 shrink-0 snap-start cursor-pointer group transition-[border-color,box-shadow] duration-base ease-[var(--motion-ease)] hover:shadow-md flex flex-col justify-center items-center shadow-2xs"
            >
              <div className="relative w-full h-full overflow-hidden bg-[var(--surface-inset)] flex flex-col justify-center items-center">
                {/* Ambient Blurred Background */}
                <img
                  src={getMediaUrl(story.image_url)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 saturate-150"
                />

                {/* Centered Proper Image */}
                <img
                  src={getMediaUrl(story.image_url)}
                  alt={story.title || ''}
                  className="absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-105 duration-media opacity-85 group-hover:opacity-100 z-0"
                />

                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors pointer-events-none z-10" />

                {/* Video icon if it's a video story */}
                {story.video_url && (
                  <div className="absolute top-1.5 end-1.5 sm:top-2 sm:end-2 bg-black/50 p-1 rounded-shape-sm backdrop-blur-md border border-white/10 shadow-xs pointer-events-auto z-20">
                    <Video size={10} className="sm:size-[12px] text-white" />
                  </div>
                )}

                {/* Top-Corner Story Ring Avatar */}
                <div className="absolute top-1.5 start-1.5 sm:top-2 sm:start-2 z-20 pointer-events-auto">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-shape-sm p-[1.5px] sm:p-[2px] bg-gradient-to-tr from-accent via-accent/80 to-accent/60 shadow-md transition-transform group-hover:scale-110"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      storyPressTimerRef.current = setTimeout(() => {
                        if ('vibrate' in navigator) navigator.vibrate([40]);
                        setPreviewingVideoStoryId(story.id);
                      }, 400);
                    }}
                    onPointerUp={(e) => {
                      if (storyPressTimerRef.current) clearTimeout(storyPressTimerRef.current);
                      if (previewingVideoStoryId === story.id) {
                        e.stopPropagation();
                        setPreviewingVideoStoryId(null);
                      }
                    }}
                    onPointerLeave={() => {
                      if (storyPressTimerRef.current) clearTimeout(storyPressTimerRef.current);
                      setPreviewingVideoStoryId(null);
                    }}
                  >
                    <img
                      src={getMediaUrl(story.author_avatar)}
                      alt={story.author_name || ''}
                      className="w-full h-full rounded-shape-xs object-cover border-[1.5px] border-[var(--surface-card)]"
                    />
                  </div>
                </div>

                {/* Name positioned at the very bottom center */}
                <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-20 pointer-events-none flex flex-col justify-end items-center">
                  <div className="flex items-center gap-1 justify-center w-full">
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold text-white truncate drop-shadow text-center max-w-[82px] sm:max-w-[95px]">
                      {story.page_id ? story.page_name : story.author_name}
                    </span>
                    {story.page_id && <CheckCircle2 size={10} className="sm:size-[11px] text-accent fill-accent/20 shrink-0" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
