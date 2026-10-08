import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music,
  Upload,
  Search,
  Play,
  Flame,
  Check,
  X,
  Loader2,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Scissors
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AppModal } from '@/design-system';
import { secureStorage } from '@/lib/storage';

export interface AudioTrackItem {
  id: string;
  title: string;
  artist?: string | null;
  duration?: number;
  audio_url: string;
  file_url?: string;
  audio_type?: 'music' | 'sfx' | 'voice' | 'effect';
  category?: string;
  user_name?: string | null;
  user_avatar?: string | null;
  usage_count?: number;
  is_trending?: boolean;
  start_time?: number;
  clip_duration?: number;
}

interface AudioLibraryPickerModalProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSelectTrack: (track: AudioTrackItem) => void;
  selectedTrackUrl?: string | null;
  selectedTrackId?: string | null;
  token?: string | null;
  isRtl?: boolean;
}

const FAV_STORAGE_KEY = 'perplexta_fav_audio_tracks';

function cleanTrackTitle(title: string | undefined | null, isRtl: boolean): string {
  if (!title) return isRtl ? 'مقطع صوتي' : 'Audio Track';
  const trimmed = title.trim();
  const match = trimmed.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (match) {
    return isRtl ? match[1].trim() : match[2].trim();
  }
  return trimmed;
}

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return '0:15';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const AudioLibraryPickerModal: React.FC<AudioLibraryPickerModalProps> = ({
  open,
  onClose,
  onBack,
  onSelectTrack,
  selectedTrackUrl,
  selectedTrackId,
  token,
  isRtl = true
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my_uploads' | 'trending' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<AudioTrackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Helper to load user uploaded audio tracks from localStorage
  const getStoredUploadedTracks = (): AudioTrackItem[] => {
    try {
      const saved = localStorage.getItem('perplexta_user_uploaded_audio');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Favorites state persisted locally
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAV_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track currently being trimmed (trackId -> startSec)
  const [trimmingTrackId, setTrimmingTrackId] = useState<string | null>(null);
  const [trackStartSecs, setTrackStartSecs] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deviceFileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop audio on close or unmount
  useEffect(() => {
    if (!open) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingTrackId(null);
      }
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
      }
      setTrimmingTrackId(null);
    }
  }, [open]);

  // Save favorites to localStorage
  const toggleFavorite = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds(prev => {
      const next = prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId];
      try {
        localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Fetch tracks & merge with locally uploaded tracks
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (activeTab === 'trending') {
      params.set('filter', 'trending');
    }

    const headers: Record<string, string> = {};
    const authToken = token || secureStorage.getSync('app_token') || (typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token')) : '') || '';
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    fetch(`/api/audio/library?${params.toString()}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          let fetched: AudioTrackItem[] = [];
          if (data && data.success && Array.isArray(data.tracks)) {
            fetched = data.tracks;
          }
          
          // Merge locally uploaded tracks from localStorage at the top
          const localUploaded = getStoredUploadedTracks();
          const fetchedIds = new Set(fetched.map(t => String(t.id)));
          const missingLocal = localUploaded.filter(t => !fetchedIds.has(String(t.id)));
          
          setTracks([...missingLocal, ...fetched]);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('[AudioPicker] Fetch tracks failed:', err);
          setTracks(getStoredUploadedTracks());
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, activeTab, searchQuery, token]);

  // Filtered tracks list based on active tab
  const displayedTracks = tracks.filter(t => {
    if (activeTab === 'favorites') {
      return favoriteIds.includes(String(t.id));
    }
    if (activeTab === 'my_uploads') {
      const storedLocalIds = new Set(getStoredUploadedTracks().map(ut => String(ut.id)));
      return t.audio_type === 'music' && (storedLocalIds.has(String(t.id)) || (t as any).source === 'manual_upload' || t.user_name === 'مبدع بيربليكستا' || t.artist === 'صوت مخصص');
    }
    if (activeTab === 'trending') {
      return t.is_trending || (t.usage_count && t.usage_count > 0);
    }
    return true;
  });

  // Audio Playback toggle
  const togglePlayTrack = (track: AudioTrackItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (loopTimerRef.current) {
      clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    }

    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const trackUrl = track.file_url || track.audio_url;
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = trackUrl;
      audioRef.current = audio;

      const startOffset = trackStartSecs[track.id] || 0;
      audio.currentTime = startOffset;

      // Keep looping inside standard 15s reel/story window if trimming
      if (trimmingTrackId === track.id) {
        const totalDur = track.duration || 15;
        const windowEnd = Math.min(totalDur, startOffset + 15);
        loopTimerRef.current = setInterval(() => {
          if (audio.currentTime >= windowEnd) {
            audio.currentTime = startOffset;
          }
        }, 200);
      }

      setPlayingTrackId(track.id);
      audio.play().catch(err => {
        console.warn('Playback error:', err);
        setPlayingTrackId(null);
      });
      audio.onended = () => {
        setPlayingTrackId(null);
      };
    }
  };

  const handleSelectTrack = (track: AudioTrackItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    }
    if (loopTimerRef.current) {
      clearInterval(loopTimerRef.current);
    }

    const startSec = trackStartSecs[track.id] || track.start_time || 0;
    const totalDur = track.duration || 15;
    const clipDur = Math.min(15, Math.max(1, totalDur - startSec));
    const resolvedUrl = track.file_url || track.audio_url || '';

    onSelectTrack({
      ...track,
      id: String(track.id),
      audio_url: resolvedUrl,
      file_url: resolvedUrl,
      start_time: startSec,
      clip_duration: clipDur
    });
    onClose();
  };

  // Direct 1-Click Upload from Device
  const handleDirectDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading(isRtl ? 'جاري قراءة ورفع الملف الصوتي...' : 'Reading & uploading audio...');

    try {
      // 1. Calculate duration on the client side using HTML5 Audio
      let audioDuration = 15;
      try {
        const audioObj = document.createElement('audio');
        const objectUrl = URL.createObjectURL(file);
        audioObj.src = objectUrl;
        await new Promise<void>((resolve) => {
          audioObj.onloadedmetadata = () => {
            if (audioObj.duration && !isNaN(audioObj.duration)) {
              audioDuration = Math.max(1, Math.round(audioObj.duration));
            }
            URL.revokeObjectURL(objectUrl);
            resolve();
          };
          audioObj.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve();
          };
          // Timeout fallback
          setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            resolve();
          }, 1500);
        });
      } catch (_) {}

      const rawTitle = file.name.replace(/\.[^/.]+$/, '').trim() || (isRtl ? 'صوت من جهازي' : 'Device Audio');
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', rawTitle);
      formData.append('artist', isRtl ? 'صوت مخصص' : 'Custom Audio');
      formData.append('duration', String(audioDuration));
      formData.append('audio_type', 'music');
      formData.append('category', 'trending');

      const headers: Record<string, string> = {};
      const authToken = token || secureStorage.getSync('app_token') || (typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token')) : '') || '';
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الملف الصوتي');
      }

      toast.success(isRtl ? 'تم رفع الصوت واختياره بنجاح! 🎵' : 'Audio uploaded & selected! 🎵', { id: toastId });

      if (data.track) {
        const fullTrack: AudioTrackItem = {
          ...data.track,
          id: String(data.track.id),
          audio_url: data.track.audio_url || data.track.file_url,
          file_url: data.track.file_url || data.track.audio_url,
          duration: data.track.duration || audioDuration,
          title: data.track.title || rawTitle,
          artist: data.track.artist || (isRtl ? 'صوت مخصص' : 'Custom Audio')
        };

        // Save to localStorage so it persists across refreshes and modal reopens
        try {
          const prevUploaded = getStoredUploadedTracks();
          const updatedUploaded = [fullTrack, ...prevUploaded.filter(t => String(t.id) !== String(fullTrack.id))];
          localStorage.setItem('perplexta_user_uploaded_audio', JSON.stringify(updatedUploaded.slice(0, 50)));
        } catch (_) {}

        setTracks(prev => [fullTrack, ...prev.filter(t => String(t.id) !== String(fullTrack.id))]);
        handleSelectTrack(fullTrack);
      }
    } catch (err: any) {
      console.error('[AudioPicker Upload Error]:', err);
      toast.error(err.message || (isRtl ? 'فشل رفع الملف' : 'Upload failed'), { id: toastId });
    } finally {
      setIsUploading(false);
      if (deviceFileInputRef.current) {
        deviceFileInputRef.current.value = '';
      }
    }
  };

  return (
    <AppModal
      open={open}
      onClose={() => {
        if (audioRef.current) audioRef.current.pause();
        onClose();
      }}
      size="sm"
      layer="nested"
      contentClassName="!p-0 !space-y-0 max-w-[315px] sm:max-w-[335px] w-[90vw] overflow-hidden rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl"
    >
      {/* Hidden File Input for Device Upload */}
      <input
        ref={deviceFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
        className="hidden"
        onChange={handleDirectDeviceUpload}
      />

      <div className="flex flex-col bg-[var(--surface-card)] text-[var(--text-primary)] select-none">
        
        {/* 1. Header: Back, Title, Upload Icon, Close Icon */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)] bg-[var(--surface-card)] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  onBack();
                }}
                className="w-6 h-6 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
                title={isRtl ? 'رجوع' : 'Back'}
              >
                {isRtl ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
              </button>
            )}
            <div className="w-6 h-6 rounded-shape-xs bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <Music size={13} />
            </div>
            <h3 className="text-xs font-extrabold text-[var(--text-primary)] tracking-tight truncate">
              {isRtl ? 'الموسيقى' : 'Audio Library'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Device Upload Button */}
            <button
              type="button"
              onClick={() => deviceFileInputRef.current?.click()}
              disabled={isUploading}
              className="h-6 px-2 rounded-shape-xs bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title={isRtl ? 'رفع صوت من سطح المكتب / الجهاز' : 'Upload audio from desktop / device'}
            >
              {isUploading ? (
                <Loader2 size={11} className="animate-spin text-purple-400" />
              ) : (
                <Upload size={11} className="text-purple-400" />
              )}
              <span>{isUploading ? (isRtl ? 'رفع...' : 'Uploading...') : (isRtl ? 'رفع' : 'Upload')}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* 2. Top Bar: Search Input & 4 Simple Tabs (الكل / مرفوعاتي / رائج / المفضل) */}
        <div className="p-2 space-y-1.5 border-b border-[var(--border-default)]/60 bg-[var(--surface-subtle)]/30 shrink-0">
          {/* Compact Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث في المقاطع الصوتية...' : 'Search audio tracks...'}
              className="w-full ps-7 pe-7 py-1 text-xs rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-accent focus:outline-none transition-colors"
            />
            <Search size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* 4 Tabs: All / My Uploads / Trending / Favorites */}
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-1 rounded-shape-xs text-[11px] font-bold transition-all cursor-pointer text-center ${
                activeTab === 'all'
                  ? 'bg-accent text-slate-950 shadow-2xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isRtl ? 'الكل' : 'All'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my_uploads')}
              className={`py-1 rounded-shape-xs text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'my_uploads'
                  ? 'bg-accent text-slate-950 shadow-2xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{isRtl ? 'مرفوعاتي' : 'Mine'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trending')}
              className={`py-1 rounded-shape-xs text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'trending'
                  ? 'bg-accent text-slate-950 shadow-2xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Flame size={10} className={activeTab === 'trending' ? 'text-slate-950' : 'text-amber-500'} />
              <span>{isRtl ? 'رائج' : 'Hot'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`py-1 rounded-shape-xs text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'favorites'
                  ? 'bg-accent text-slate-950 shadow-2xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Bookmark size={10} className={activeTab === 'favorites' ? 'text-slate-950 fill-current' : 'text-purple-400'} />
              <span>{isRtl ? 'المفضل' : 'Saved'}</span>
            </button>
          </div>
        </div>

        {/* 3. Track List (Compact, Inline Waveform Scrubber) */}
        <div className="max-h-[50vh] sm:max-h-[340px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-[var(--text-muted)] gap-1">
              <Loader2 size={16} className="animate-spin text-accent" />
            </div>
          ) : displayedTracks.length === 0 ? (
            <div className="text-center py-6 text-[var(--text-muted)]">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {activeTab === 'favorites'
                  ? (isRtl ? 'لا توجد مقاطع مفضلة بعد' : 'No favorites yet')
                  : activeTab === 'my_uploads'
                  ? (isRtl ? 'لم تقم برفع أي مقطع صوتي بعد. اضغط زر الرفع أعلاه 🎵' : 'No uploaded tracks yet. Click upload above.')
                  : (isRtl ? 'لا توجد نتائج' : 'No tracks found')}
              </p>
            </div>
          ) : (
            displayedTracks.map(track => {
              const trackUrl = track.file_url || track.audio_url;
              const isSelected = selectedTrackUrl === trackUrl || (selectedTrackId && String(selectedTrackId) === String(track.id));
              const isPlaying = playingTrackId === track.id;
              const isFav = favoriteIds.includes(String(track.id));
              const isTrimming = trimmingTrackId === track.id;
              const cleanTitle = cleanTrackTitle(track.title, isRtl);
              const totalDuration = track.duration || 15;
              const startOffset = trackStartSecs[track.id] || 0;
              const maxStart = Math.max(0, totalDuration - 5);

              return (
                <div
                  key={track.id}
                  className={`p-1.5 rounded-shape-xs border transition-all flex flex-col gap-1 select-none ${
                    isSelected
                      ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                      : 'border-transparent bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-subtle)] hover:border-[var(--border-default)]'
                  }`}
                >
                  {/* Row: Play Button, Title & Meta, Action Icons */}
                  <div className="flex items-center gap-1.5">
                    {/* Play / Pause Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => togglePlayTrack(track, e)}
                      className={`w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        isPlaying
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-500/15 text-purple-400 hover:scale-105'
                      }`}
                      title={isPlaying ? (isRtl ? 'إيقاف' : 'Pause') : (isRtl ? 'تشغيل' : 'Play')}
                    >
                      {isPlaying ? (
                        <div className="flex items-center gap-0.5">
                          <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce" />
                        </div>
                      ) : (
                        <Play size={11} className="ms-0.5 fill-current" />
                      )}
                    </button>

                    {/* Track Info */}
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={(e) => handleSelectTrack(track, e)}>
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] hover:text-accent transition-colors truncate">
                          {cleanTitle}
                        </h4>
                        {track.is_trending && (
                          <span className="text-[8px] bg-amber-500/15 text-amber-500 px-1 rounded-shape-xs font-bold shrink-0">
                            {isRtl ? 'رائج' : 'Hot'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] font-medium truncate">
                        <span>{formatDuration(totalDuration)}</span>
                        {startOffset > 0 && (
                          <span className="text-purple-400 font-bold font-mono">
                            ({startOffset}s+)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trailing Icon-Only Buttons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Waveform Scrubber Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrimmingTrackId(prev => (prev === track.id ? null : track.id));
                        }}
                        className={`w-6 h-6 rounded-shape-xs flex items-center justify-center transition-colors cursor-pointer ${
                          isTrimming
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]'
                        }`}
                        title={isRtl ? 'تحديد نقطة البداية' : 'Slide start point'}
                      >
                        <Scissors size={11} />
                      </button>

                      {/* Favorite / Bookmark Icon Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(String(track.id), e)}
                        className={`w-6 h-6 rounded-shape-xs flex items-center justify-center transition-colors cursor-pointer ${
                          isFav
                            ? 'text-purple-400 hover:text-purple-300'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]'
                        }`}
                        title={isFav ? (isRtl ? 'إزالة من المفضلة' : 'Unfavorite') : (isRtl ? 'إضافة للمفضلة' : 'Favorite')}
                      >
                        <Bookmark size={11} className={isFav ? 'fill-current text-purple-400' : ''} />
                      </button>

                      {/* Use / Select Icon Button (Single Source of Truth) */}
                      <button
                        type="button"
                        onClick={(e) => handleSelectTrack(track, e)}
                        className={`w-6 h-6 rounded-shape-xs flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent text-slate-950 font-bold shadow-2xs'
                            : 'bg-[var(--surface-card)] hover:bg-accent hover:text-slate-950 text-[var(--text-secondary)] border border-[var(--border-default)]'
                        }`}
                        title={isSelected ? (isRtl ? 'محدد' : 'Selected') : (isRtl ? 'استخدام' : 'Use')}
                      >
                        {isSelected ? <Check size={11} strokeWidth={3} /> : <Plus size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Inline Sleek Horizontal Waveform Scrubber (Zero Clutter, 24px Height) */}
                  {isTrimming && (
                    <div
                      className="pt-1 pb-0.5 px-1 border-t border-[var(--border-default)]/60 flex flex-col gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Scrubber Info & Position */}
                      <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] font-mono font-bold">
                        <span className="text-purple-400">{startOffset}s → {Math.min(totalDuration, startOffset + 15)}s</span>
                        <span>{formatDuration(totalDuration)}</span>
                      </div>

                      {/* Interactive Horizontal Wave Slider */}
                      <div className="relative h-6 bg-[var(--surface-card)] rounded-shape-xs border border-purple-500/30 overflow-hidden flex items-center px-1">
                        {/* Simulated Audio Waveform Bars */}
                        <div className="absolute inset-0 flex items-center justify-between px-1.5 gap-0.5 opacity-60 pointer-events-none">
                          {Array.from({ length: 36 }).map((_, i) => {
                            const barPercent = (i / 36) * maxStart;
                            const isInside = barPercent >= startOffset && barPercent <= startOffset + 15;
                            const h = 25 + 65 * Math.abs(Math.sin((i + 1) * 0.45));
                            return (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-colors ${
                                  isInside ? 'bg-purple-400' : 'bg-[var(--text-muted)]/30'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            );
                          })}
                        </div>

                        {/* Native Range Slider on top */}
                        <input
                          type="range"
                          min={0}
                          max={maxStart}
                          step={1}
                          value={startOffset}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTrackStartSecs(prev => ({
                              ...prev,
                              [track.id]: val
                            }));
                            if (audioRef.current && playingTrackId === track.id) {
                              audioRef.current.currentTime = val;
                            }
                          }}
                          className="w-full h-full opacity-0 cursor-ew-resize relative z-10"
                        />

                        {/* Position Indicator Needle */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-purple-500 rounded-full shadow-sm pointer-events-none transition-all"
                          style={{
                            left: `${maxStart > 0 ? (startOffset / maxStart) * 94 + 3 : 3}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4. Sleek Minimal Footer: Delete Audio Button if selected */}
        {selectedTrackUrl && (
          <div className="p-2 border-t border-[var(--border-default)] flex items-center justify-end shrink-0 bg-[var(--surface-subtle)]/20">
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                onSelectTrack({ id: '', title: '', audio_url: '' });
                onClose();
              }}
              className="text-rose-500 hover:text-rose-600 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 size={11} />
              <span>{isRtl ? 'إزالة الصوت' : 'Remove'}</span>
            </button>
          </div>
        )}

      </div>
    </AppModal>
  );
};
