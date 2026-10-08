import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Music,
  Sliders,
  Image as ImageIcon,
  Check,
  Film,
  Layers,
  Loader2,
  ZoomIn,
  MoveHorizontal,
  Pause,
  Plus
} from 'lucide-react';
import { AppModal } from '@/design-system';
import { toast } from '@/design-system';
import { MediaProjectState, CompositionSchema } from './types';
import { MediaCanvasPreview } from './MediaCanvasPreview';
import { AudioWaveformTrimmer } from './AudioWaveformTrimmer';
import { DualAudioSlider } from './DualAudioSlider';
import { CoverFrameSelector } from './CoverFrameSelector';
import { AudioLibraryPickerModal, AudioTrackItem } from '../AudioLibraryPickerModal';

export interface ViralMediaStudioModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  initialVisualUrl?: string;
  initialVisualType?: 'image' | 'video';
  initialVisualFile?: File;
  initialAudioTrack?: AudioTrackItem | null;
  onComplete?: (composition: CompositionSchema, projectState: MediaProjectState) => void;
  onPublish?: (project: MediaProjectState, renderedVideoUrl?: string, thumbnail?: string) => void | Promise<void>;
  token?: string | null;
  user?: any;
  isRtl?: boolean;
}

export const ViralMediaStudioModal: React.FC<ViralMediaStudioModalProps> = ({
  open,
  isOpen,
  onClose,
  initialVisualUrl,
  initialVisualType = 'video',
  initialVisualFile,
  initialAudioTrack,
  onComplete,
  onPublish,
  token,
  user,
  isRtl = true
}) => {
  const isModalOpen = open ?? isOpen ?? false;
  const [projectState, setProjectState] = useState<MediaProjectState>({
    visual: initialVisualUrl ? {
      id: crypto.randomUUID(),
      sourceType: initialVisualType,
      url: initialVisualUrl,
      duration: 15,
      animation: 'ken_burns_zoom_in',
      aspectRatio: '9:16',
      file: initialVisualFile
    } : null,
    originalAudioVolume: 0.8,
    musicTrack: initialAudioTrack ? {
      id: initialAudioTrack.id,
      url: initialAudioTrack.audio_url || initialAudioTrack.file_url || '',
      title: initialAudioTrack.title,
      artist: initialAudioTrack.artist || '',
      duration: initialAudioTrack.duration || 60,
      seekStart: initialAudioTrack.start_time || 0,
      playDuration: 15,
      volume: 0.8
    } : null,
    coverTimestamp: 0,
    targetAspectRatio: '9:16',
    outputDuration: 15,
    caption: '',
    mediaFormat: initialVisualType === 'video' ? 'reel' : 'post'
  });

  const [activeTab, setActiveTab] = useState<'format' | 'music' | 'motion' | 'cover' | 'mixer'>('format');
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isImage = projectState.visual?.sourceType === 'image';
  const isVideo = projectState.visual?.sourceType === 'video';

  // Update visual when initialVisualUrl changes
  useEffect(() => {
    if (initialVisualUrl) {
      setProjectState((prev) => ({
        ...prev,
        visual: {
          id: crypto.randomUUID(),
          sourceType: initialVisualType,
          url: initialVisualUrl,
          duration: 15,
          animation: 'ken_burns_zoom_in',
          aspectRatio: '9:16',
          file: initialVisualFile
        }
      }));
    }
  }, [initialVisualUrl, initialVisualType, initialVisualFile]);

  // Sync music when initialAudioTrack changes
  useEffect(() => {
    if (initialAudioTrack) {
      setProjectState((prev) => ({
        ...prev,
        musicTrack: {
          id: initialAudioTrack.id,
          url: initialAudioTrack.audio_url || initialAudioTrack.file_url || '',
          title: initialAudioTrack.title,
          artist: initialAudioTrack.artist || '',
          duration: initialAudioTrack.duration || 60,
          seekStart: initialAudioTrack.start_time || 0,
          playDuration: 15,
          volume: 0.8
        }
      }));
    }
  }, [initialAudioTrack]);

  // Handle music track selection from Library
  const handleSelectMusicTrack = (track: AudioTrackItem) => {
    setProjectState((prev) => ({
      ...prev,
      musicTrack: {
        id: track.id,
        url: track.audio_url || track.file_url || '',
        title: track.title,
        artist: track.artist || '',
        duration: track.duration || 60,
        seekStart: track.start_time || 0,
        playDuration: 15,
        volume: 0.8
      }
    }));
    setIsAudioPickerOpen(false);
    toast.success(isRtl ? 'تمت إضافة المقطع الموسيقي' : 'Music track attached');
  };

  // Build Composition Schema & Export
  const handleApply = () => {
    if (!projectState.visual?.url) {
      toast.error(isRtl ? 'يرجى اختيار ملف وسائط أولاً' : 'Please select media file first');
      return;
    }

    let compType: 'image_to_video' | 'video_with_audio' | 'video_only' | 'image_only' = 'video_only';
    if (isImage) {
      compType = projectState.musicTrack ? 'image_to_video' : 'image_only';
    } else if (isVideo) {
      compType = projectState.musicTrack ? 'video_with_audio' : 'video_only';
    }

    const schema: CompositionSchema = {
      projectId: crypto.randomUUID(),
      type: compType,
      duration: projectState.outputDuration || 15,
      visual: {
        sourceUrl: projectState.visual.url,
        cropMode: projectState.targetAspectRatio,
        animation: projectState.visual.animation || 'ken_burns_zoom_in'
      },
      audio: projectState.musicTrack ? {
        sourceUrl: projectState.musicTrack.url,
        title: projectState.musicTrack.title,
        artist: projectState.musicTrack.artist,
        startTime: projectState.musicTrack.seekStart,
        volume: projectState.musicTrack.volume,
        originalAudioVolume: isVideo ? projectState.originalAudioVolume : undefined
      } : undefined,
      coverTimestamp: projectState.coverTimestamp
    };

    if (onComplete) {
      onComplete(schema, projectState);
    }
    if (onPublish) {
      onPublish(projectState, undefined, projectState.coverDataUrl);
    }
    onClose();
  };

  return (
    <AppModal
      open={isModalOpen}
      onClose={onClose}
      size="md"
    >
      {/* Mobile-First Single-Column Studio Container */}
      <div className="w-full max-w-md mx-auto flex flex-col h-full max-h-[88vh] overflow-hidden bg-[var(--surface-page)] text-[var(--text-primary)] select-none">
        
        {/* 1. Sleek Top Header with Iconography-Only Action Buttons */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border-default)] bg-[var(--surface-card)]">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            title={isRtl ? 'إغلاق' : 'Close'}
            aria-label={isRtl ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>

          <span className="text-xs font-bold tracking-tight text-[var(--text-primary)]">
            {isRtl ? 'استوديو وسائط فايرال بوك' : 'ViralMedia Studio'}
          </span>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-[var(--accent-foreground)] text-white hover:opacity-90 flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            title={isRtl ? 'حفظ واعتماد' : 'Apply & Save'}
            aria-label={isRtl ? 'حفظ واعتماد' : 'Apply & Save'}
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* 2. Scrollable Single-Column Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-3">
          
          {/* Centered Canvas Viewport Preview */}
          <div className="w-full flex items-center justify-center bg-[var(--surface-subtle)] rounded-shape-lg p-2 border border-[var(--border-default)]">
            <MediaCanvasPreview
              projectState={projectState}
              isRtl={isRtl}
              autoPlay
              className="max-h-[38vh] w-auto aspect-[9/16]"
            />
          </div>

          {/* Iconography-Only Segmented Navigation Bar */}
          <div className="flex items-center justify-around p-1 bg-[var(--surface-subtle)] rounded-shape-md border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => setActiveTab('format')}
              className={`p-2 rounded-shape-xs transition-all flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                activeTab === 'format'
                  ? 'bg-[var(--surface-card)] text-[var(--accent-foreground)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isRtl ? 'أبعاد العرض' : 'Format & Aspect Ratio'}
              aria-label={isRtl ? 'أبعاد العرض' : 'Format & Aspect Ratio'}
            >
              <Film size={18} />
            </button>

            {isImage && (
              <button
                type="button"
                onClick={() => setActiveTab('motion')}
                className={`p-2 rounded-shape-xs transition-all flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                  activeTab === 'motion'
                    ? 'bg-[var(--surface-card)] text-amber-500 shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title={isRtl ? 'حركة الكاميرا' : 'Camera Motion'}
                aria-label={isRtl ? 'حركة الكاميرا' : 'Camera Motion'}
              >
                <Sparkles size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('music')}
              className={`p-2 rounded-shape-xs transition-all flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                activeTab === 'music'
                  ? 'bg-[var(--surface-card)] text-accent shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isRtl ? 'الموسيقى والصوتيات' : 'Music & Audio'}
              aria-label={isRtl ? 'الموسيقى والصوتيات' : 'Music & Audio'}
            >
              <Music size={18} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mixer')}
              className={`p-2 rounded-shape-xs transition-all flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                activeTab === 'mixer'
                  ? 'bg-[var(--surface-card)] text-[var(--accent-foreground)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isRtl ? 'ميكسر الصوت' : 'Audio Mixer'}
              aria-label={isRtl ? 'ميكسر الصوت' : 'Audio Mixer'}
            >
              <Sliders size={18} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cover')}
              className={`p-2 rounded-shape-xs transition-all flex items-center justify-center cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                activeTab === 'cover'
                  ? 'bg-[var(--surface-card)] text-[var(--accent-foreground)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isRtl ? 'صورة الغلاف' : 'Cover Frame'}
              aria-label={isRtl ? 'صورة الغلاف' : 'Cover Frame'}
            >
              <Layers size={18} />
            </button>
          </div>

          {/* 3. Active Tool Dynamic Panel */}
          <div className="flex flex-col gap-2">
            
            {/* Format Selector Tab */}
            {activeTab === 'format' && (
              <div className="flex items-center gap-2 p-2.5 bg-[var(--surface-card)] rounded-shape-lg border border-[var(--border-default)] shadow-xs">
                <button
                  type="button"
                  onClick={() => setProjectState((p) => ({ ...p, mediaFormat: 'reel', targetAspectRatio: '9:16' }))}
                  className={`flex-1 py-2 px-3 rounded-shape-sm border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    projectState.mediaFormat === 'reel'
                      ? 'bg-[var(--accent-foreground)] text-white border-transparent shadow-xs'
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]'
                  }`}
                  title={isRtl ? 'ريلز عمودي 9:16' : 'Reel 9:16'}
                  aria-label={isRtl ? 'ريلز عمودي 9:16' : 'Reel 9:16'}
                >
                  <Film size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setProjectState((p) => ({ ...p, mediaFormat: 'post', targetAspectRatio: '1:1' }))}
                  className={`flex-1 py-2 px-3 rounded-shape-sm border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    projectState.mediaFormat === 'post'
                      ? 'bg-[var(--accent-foreground)] text-white border-transparent shadow-xs'
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]'
                  }`}
                  title={isRtl ? 'منشور مربع 1:1' : 'Post 1:1'}
                  aria-label={isRtl ? 'منشور مربع 1:1' : 'Post 1:1'}
                >
                  <ImageIcon size={16} />
                </button>
              </div>
            )}

            {/* Camera Motion Selector Tab (For Images) */}
            {activeTab === 'motion' && isImage && (
              <div className="flex items-center gap-2 p-2.5 bg-[var(--surface-card)] rounded-shape-lg border border-[var(--border-default)] shadow-xs">
                <button
                  type="button"
                  onClick={() =>
                    setProjectState((p) => ({
                      ...p,
                      visual: p.visual ? { ...p.visual, animation: 'ken_burns_zoom_in' } : null
                    }))
                  }
                  className={`flex-1 py-2 px-3 rounded-shape-sm border flex items-center justify-center transition-all cursor-pointer ${
                    projectState.visual?.animation === 'ken_burns_zoom_in'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-500 shadow-xs'
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]'
                  }`}
                  title={isRtl ? 'زووم تدريجي' : 'Zoom In'}
                  aria-label={isRtl ? 'زووم تدريجي' : 'Zoom In'}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setProjectState((p) => ({
                      ...p,
                      visual: p.visual ? { ...p.visual, animation: 'ken_burns_pan_right' } : null
                    }))
                  }
                  className={`flex-1 py-2 px-3 rounded-shape-sm border flex items-center justify-center transition-all cursor-pointer ${
                    projectState.visual?.animation === 'ken_burns_pan_right'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-500 shadow-xs'
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]'
                  }`}
                  title={isRtl ? 'تحريك أفقي' : 'Pan Right'}
                  aria-label={isRtl ? 'تحريك أفقي' : 'Pan Right'}
                >
                  <MoveHorizontal size={16} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setProjectState((p) => ({
                      ...p,
                      visual: p.visual ? { ...p.visual, animation: 'none' } : null
                    }))
                  }
                  className={`flex-1 py-2 px-3 rounded-shape-sm border flex items-center justify-center transition-all cursor-pointer ${
                    projectState.visual?.animation === 'none'
                      ? 'bg-[var(--surface-subtle)] border-[var(--accent-foreground)] text-[var(--accent-foreground)] shadow-xs'
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]'
                  }`}
                  title={isRtl ? 'ثابت' : 'Static'}
                  aria-label={isRtl ? 'ثابت' : 'Static'}
                >
                  <Pause size={16} />
                </button>
              </div>
            )}

            {/* Music Picker & Trimmer Tab */}
            {activeTab === 'music' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2.5 bg-[var(--surface-card)] rounded-shape-lg border border-[var(--border-default)] shadow-xs">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {isRtl ? 'المسار الصوتي' : 'Soundtrack'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAudioPickerOpen(true)}
                    className="p-1.5 rounded-shape-xs bg-accent/15 hover:bg-accent/25 text-accent transition-colors cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
                    title={projectState.musicTrack ? (isRtl ? 'تغيير المقطع' : 'Change Track') : (isRtl ? 'إضافة مقطع' : 'Add Track')}
                    aria-label={projectState.musicTrack ? (isRtl ? 'تغيير المقطع' : 'Change Track') : (isRtl ? 'إضافة مقطع' : 'Add Track')}
                  >
                    {projectState.musicTrack ? <Music size={15} /> : <Plus size={15} />}
                  </button>
                </div>

                {projectState.musicTrack && (
                  <AudioWaveformTrimmer
                    track={projectState.musicTrack}
                    targetDuration={projectState.outputDuration || 15}
                    onChangeSeekStart={(newStart) =>
                      setProjectState((p) => ({
                        ...p,
                        musicTrack: p.musicTrack ? { ...p.musicTrack, seekStart: newStart } : null
                      }))
                    }
                    isRtl={isRtl}
                  />
                )}
              </div>
            )}

            {/* Mixer Tab */}
            {activeTab === 'mixer' && (
              <DualAudioSlider
                originalVolume={projectState.originalAudioVolume}
                musicVolume={projectState.musicTrack?.volume ?? 0.8}
                hasVideoAudio={isVideo}
                hasMusicTrack={!!projectState.musicTrack}
                onChangeOriginalVolume={(vol) =>
                  setProjectState((p) => ({ ...p, originalAudioVolume: vol }))
                }
                onChangeMusicVolume={(vol) =>
                  setProjectState((p) => ({
                    ...p,
                    musicTrack: p.musicTrack ? { ...p.musicTrack, volume: vol } : null
                  }))
                }
                isRtl={isRtl}
              />
            )}

            {/* Cover Frame Tab */}
            {activeTab === 'cover' && (
              <CoverFrameSelector
                videoUrl={isVideo ? projectState.visual?.url : undefined}
                imageUrl={isImage ? projectState.visual?.url : undefined}
                duration={projectState.outputDuration}
                selectedTimestamp={projectState.coverTimestamp}
                onSelectTimestamp={(sec, dataUrl) =>
                  setProjectState((p) => ({
                    ...p,
                    coverTimestamp: sec,
                    coverDataUrl: dataUrl
                  }))
                }
                isRtl={isRtl}
              />
            )}

          </div>
        </div>

      </div>

      {/* Audio Library Picker Modal */}
      {isAudioPickerOpen && (
        <AudioLibraryPickerModal
          open={isAudioPickerOpen}
          onClose={() => setIsAudioPickerOpen(false)}
          onSelectTrack={handleSelectMusicTrack}
          selectedTrackId={projectState.musicTrack?.id}
          token={token}
          isRtl={isRtl}
        />
      )}
    </AppModal>
  );
};
