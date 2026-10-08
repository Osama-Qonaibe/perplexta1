import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '@/design-system';
import { secureStorage } from "@/lib/storage";
import { triggerHaptic } from '../utils/haptics';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Pause,
  Clock,
  Sparkles,
  Loader2,
  Send,
  User,
  Music,
  Scissors,
  Volume2,
  VolumeX,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sliders,
  Sparkle,
  Type,
  Palette,
  AlignCenter,
  AlignRight,
  AlignLeft
} from 'lucide-react';

export interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRtl?: boolean;
  token?: string | null;
  user?: any;
  userPages?: any[];
  onStoryCreated?: (newStory: any) => void;
  preselectedFile?: File | null;
  initialMode?: 'media' | 'text';
}

interface SelectedImageSettings {
  file: File;
  previewUrl: string;
  effect: string; // 'none' | 'vintage' | 'grayscale' | 'cyber' | 'cold' | 'glow'
  music: string; // 'none' | 'lofi' | 'acoustic' | 'pop' | 'piano'
  duration: number; // 5 to 15 seconds
}

// Preset Gradients for Text Stories
export const TEXT_STORY_GRADIENTS = [
  { id: 'sunset', nameAr: 'غروب دافئ', nameEn: 'Sunset', colors: ['#f43f5e', '#fb923c'], bgClass: 'from-rose-500 to-orange-400' },
  { id: 'cyber', nameAr: 'سايبر بنفسجي', nameEn: 'Cyber Violet', colors: ['#8b5cf6', '#ec4899'], bgClass: 'from-violet-500 to-pink-500' },
  { id: 'emerald', nameAr: 'زمردي منعش', nameEn: 'Emerald', colors: ['#059669', '#10b981'], bgClass: 'from-emerald-600 to-teal-500' },
  { id: 'ocean', nameAr: 'أزرق محيطي', nameEn: 'Ocean Deep', colors: ['#1e40af', '#3b82f6'], bgClass: 'from-blue-700 to-sky-500' },
  { id: 'fire', nameAr: 'لهب ناري', nameEn: 'Flame', colors: ['#dc2626', '#f59e0b'], bgClass: 'from-red-600 to-amber-500' },
  { id: 'obsidian', nameAr: 'أسود ليلي', nameEn: 'Obsidian Night', colors: ['#0f172a', '#334155'], bgClass: 'from-slate-900 to-slate-700' },
];

// Preset Music tracks with preview mp3 urls
const MUSIC_TRACKS = [
  { id: 'none', labelAr: 'بدون موسيقى', labelEn: 'No Music', url: '' },
  { id: 'lofi', labelAr: 'لوفي هادئ', labelEn: 'Lofi Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'acoustic', labelAr: 'جيتار كلاسيكي', labelEn: 'Acoustic Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'pop', labelAr: 'بوب حماسي', labelEn: 'Energetic Pop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'piano', labelAr: 'بيانو سينمائي', labelEn: 'Cinematic Piano', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

// Preset Effects/Filters with Tailwind classes
const EFFECTS = [
  { id: 'none', labelAr: 'بدون تأثير', labelEn: 'Original', class: '' },
  { id: 'vintage', labelAr: 'كلاسيكي دافئ', labelEn: 'Vintage Warm', class: 'sepia contrast-125 saturate-110 brightness-95' },
  { id: 'grayscale', labelAr: 'أبيض وأسود', labelEn: 'Noir B&W', class: 'grayscale contrast-115' },
  { id: 'cyber', labelAr: 'سايبر ملون', labelEn: 'Cyberpunk', class: 'hue-rotate-90 saturate-150' },
  { id: 'cold', labelAr: 'أزرق سينمائي', labelEn: 'Cold Cinematic', class: 'saturate-120 hue-rotate-15 contrast-105' },
  { id: 'glow', labelAr: 'توهج مشرق', labelEn: 'Dreamy Glow', class: 'brightness-105 saturate-125 contrast-95 sepia-[15%]' }
];

export const StoryUploadModal: React.FC<StoryUploadModalProps> = ({
  isOpen,
  onClose,
  isRtl = true,
  token,
  user,
  userPages = [],
  onStoryCreated,
  preselectedFile = null,
  initialMode = 'media'
}) => {
  // Creation mode tab ('media' or 'text')
  const [creationTab, setCreationTab] = useState<'media' | 'text'>(initialMode);

  // Text Story States
  const [textContent, setTextContent] = useState<string>('');
  const [textGradientIndex, setTextGradientIndex] = useState<number>(0);
  const [textAlign, setTextAlign] = useState<'center' | 'right' | 'left'>('center');
  const [textFontSize, setTextFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Cycle Gradients (Swipe or Button)
  const cycleGradient = (direction: 'next' | 'prev' = 'next') => {
    setTextGradientIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % TEXT_STORY_GRADIENTS.length;
      } else {
        return (prev - 1 + TEXT_STORY_GRADIENTS.length) % TEXT_STORY_GRADIENTS.length;
      }
    });
  };

  const cycleFontSize = () => {
    setTextFontSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'huge';
      return 'normal';
    });
  };

  const cycleAlignment = () => {
    setTextAlign((prev) => {
      if (prev === 'center') return isRtl ? 'right' : 'left';
      if (prev === 'right') return 'left';
      if (prev === 'left') return 'center';
      return 'center';
    });
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        cycleGradient(isRtl ? 'prev' : 'next');
      } else {
        cycleGradient(isRtl ? 'next' : 'prev');
      }
    }
    setTouchStartX(null);
  };

  // General State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>('');
  const [isStoryDragging, setIsStoryDragging] = useState<boolean>(false);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Multiple Images State
  const [imageStories, setImageStories] = useState<SelectedImageSettings[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Video Specific Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [startTimeOffset, setStartTimeOffset] = useState<number>(0);
  const [videoDurationLimit, setVideoDurationLimit] = useState<number>(30);

  // Video Cover / Thumbnails States
  const [recommendedCovers, setRecommendedCovers] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [isGeneratingCovers, setIsGeneratingCovers] = useState<boolean>(false);

  // Background Audio Preview Element for Images
  const [activeMusicTrack, setActiveMusicTrack] = useState<string>('none');
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [availableMusicTracks, setAvailableMusicTracks] = useState(MUSIC_TRACKS);

  // Fetch online audio provider tracks on modal open
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/audio/search?type=music&limit=15')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          const providerTracks = data.tracks.map((t: any) => ({
            id: t.id,
            labelAr: `${t.title} (${t.provider || 'مزود آلي'})`,
            labelEn: `${t.title} (${t.provider || 'Audio Provider'})`,
            url: t.audio_url || t.url || ''
          })).filter((t: any) => Boolean(t.url));

          setAvailableMusicTracks(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newTracks = providerTracks.filter((t: any) => !existingIds.has(t.id));
            return [...prev, ...newTracks];
          });
        }
      })
      .catch(err => {
        console.warn('Audio provider fetch skipped, using native tracks:', err);
      });
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customCoverInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setRecommendedCovers(prev => [dataUrl, ...prev]);
      setSelectedCoverIndex(0);
    };
    reader.readAsDataURL(file);
  };

  // Auto handle preselected files
  useEffect(() => {
    if (preselectedFile) {
      handleFilesSelected([preselectedFile]);
    }
  }, [preselectedFile]);

  // Clean up Object URLs when closed
  useEffect(() => {
    if (!isOpen) {
      // Revoke general preview URL
      if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
      // Revoke multiple image URLs
      imageStories.forEach(story => {
        if (story.previewUrl && story.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(story.previewUrl);
        }
      });

      setSelectedFile(null);
      setMediaPreviewUrl('');
      setIsVideo(false);
      setVideoDuration(0);
      setImageStories([]);
      setActiveImageIndex(0);
      setIsUploading(false);
      setRecommendedCovers([]);
      setSelectedCoverIndex(0);
      setStartTimeOffset(0);
      stopAudioPreview();
    }
  }, [isOpen]);

  // Sync initial mode whenever modal opens
  useEffect(() => {
    if (isOpen && initialMode) {
      setCreationTab(initialMode);
    }
  }, [isOpen, initialMode]);
  useEffect(() => {
    if (isVideo) {
      stopAudioPreview();
      return;
    }

    if (imageStories.length > 0) {
      const currentStory = imageStories[activeImageIndex];
      const selectedMusic = currentStory?.music || 'none';
      
      if (selectedMusic !== activeMusicTrack) {
        setActiveMusicTrack(selectedMusic);
        if (selectedMusic === 'none') {
          stopAudioPreview();
        } else {
          playAudioTrack(selectedMusic);
        }
      }
    }
  }, [activeImageIndex, imageStories, isVideo]);

  const playAudioTrack = (trackId: string) => {
    const track = availableMusicTracks.find(t => t.id === trackId);
    if (!track || !track.url) {
      stopAudioPreview();
      return;
    }

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
      audioPreviewRef.current.loop = true;
    }

    try {
      audioPreviewRef.current.src = track.url;
      audioPreviewRef.current.volume = isMuted ? 0 : 0.5;
      audioPreviewRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(err => {
        console.warn('Audio play auto-blocked:', err);
        setIsMusicPlaying(false);
      });
    } catch (e) {
      console.error('Audio setup failed:', e);
    }
  };

  const stopAudioPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.src = '';
    }
    setIsMusicPlaying(false);
    setActiveMusicTrack('none');
  };

  const toggleMusicMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.volume = nextMute ? 0 : 0.5;
    }
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  // Extract recommended cover thumbnails from video
  const generateVideoCovers = (fileUrl: string, durationSecs: number) => {
    if (!fileUrl || durationSecs <= 0) return;
    setIsGeneratingCovers(true);

    const video = document.createElement('video');
    video.src = fileUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';

    const covers: string[] = [];
    const timestamps = [
      Math.min(1, durationSecs * 0.1),
      Math.min(durationSecs - 0.5, durationSecs * 0.4),
      Math.min(durationSecs - 0.5, durationSecs * 0.7),
      Math.min(durationSecs - 0.5, durationSecs * 0.9)
    ];

    let currentIndex = 0;

    const captureNext = () => {
      if (currentIndex >= timestamps.length) {
        setRecommendedCovers(covers);
        setIsGeneratingCovers(false);
        video.remove();
        return;
      }
      video.currentTime = timestamps[currentIndex];
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 320; // vertical ratio
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          covers.push(dataUrl);
        }
      } catch (e) {
        console.error('[StoryUpload] Video cover grab failed:', e);
      }
      currentIndex++;
      captureNext();
    };

    video.onloadedmetadata = () => {
      captureNext();
    };

    video.onerror = () => {
      setIsGeneratingCovers(false);
      video.remove();
    };
  };

  // Handles multiple files selected via input or drag-and-drop
  const handleFilesSelected = (filesList: File[], append = false) => {
    if (!filesList || filesList.length === 0) return;
    triggerHaptic('medium');

    // Check if the first file is a video
    const firstFile = filesList[0];
    const isVid = firstFile.type.startsWith('video/') || 
                  ['mp4', 'mov', 'avi', 'webm', 'mkv', 'wmv', 'flv', '3gp'].some(ext => firstFile.name.toLowerCase().endsWith('.' + ext));

    if (isVid) {
      // Videos must be uploaded singly
      if (filesList.length > 1) {
        toast.info(isRtl 
          ? 'تنبيه: لا يمكن اختيار أكثر من فيديو واحد للقصة، سيتم معالجة الفيديو الأول فقط.' 
          : 'Note: You can only upload one video at a time. Processing the first video only.');
      }

      const MAX_SIZE = 100 * 1024 * 1024; // 100MB max limit
      if (firstFile.size > MAX_SIZE) {
        toast.error(isRtl ? 'حجم مقطع الفيديو كبير جداً (الأقصى 100 ميجابايت)' : 'Video file too large (Max 100MB)');
        return;
      }

      const objectUrl = URL.createObjectURL(firstFile);
      setIsVideo(true);
      setSelectedFile(firstFile);
      setMediaPreviewUrl(objectUrl);
      setImageStories([]);
      toast.success(isRtl ? 'تم تحميل مقطع الفيديو بنجاح!' : 'Video clip loaded successfully!');

      const tempVid = document.createElement('video');
      tempVid.preload = 'metadata';
      tempVid.muted = true;
      tempVid.src = objectUrl;

      tempVid.onloadedmetadata = () => {
        const duration = tempVid.duration;
        setVideoDuration(duration);
        generateVideoCovers(objectUrl, duration);
        if (duration > 30.5) {
          toast.info(isRtl 
            ? 'سيتم تفعيل محدد القص التلقائي لمقاطع الفيديو الطويلة حتى 30 ثانية.' 
            : 'Long video trimmer enabled automatically to loop up to 30 seconds.');
        }
        tempVid.remove();
      };

      tempVid.onerror = () => {
        setVideoDuration(0);
        tempVid.remove();
      };
    } else {
      // Handle multiple images up to 10 photos max
      setIsVideo(false);
      setVideoDuration(0);
      setRecommendedCovers([]);

      const imgFiles = filesList.filter(f => f.type.startsWith('image/'));
      
      if (imgFiles.length === 0) {
        toast.error(isRtl ? 'يرجى اختيار صور صالحة فقط' : 'Please select valid image files only');
        return;
      }

      if (append && imageStories.length > 0) {
        const availableSlots = Math.max(0, 10 - imageStories.length);
        if (availableSlots <= 0) {
          toast.info(isRtl ? 'تم الوصول للحد الأقصى (10 صور للقصة)' : 'Max 10 photos reached for this story');
          return;
        }

        const toAdd = imgFiles.slice(0, availableSlots);
        const addedStories: SelectedImageSettings[] = toAdd.map(file => ({
          file,
          previewUrl: URL.createObjectURL(file),
          effect: 'none',
          music: 'none',
          duration: 15
        }));

        const combined = [...imageStories, ...addedStories];
        setImageStories(combined);
        toast.success(isRtl ? `تمت إضافة ${toAdd.length} صور بنجاح!` : `Added ${toAdd.length} photos successfully!`);
      } else {
        const selected = imgFiles.slice(0, 10);
        if (filesList.length > 10) {
          toast.info(isRtl 
            ? 'الحد الأقصى هو 10 صور للقصص المتعددة تلقائياً. تم اختيار أول 10 صور فقط.' 
            : 'Max limit is 10 photos for auto-split stories. Selected the first 10 photos only.');
        }

        const newImageStories: SelectedImageSettings[] = selected.map(file => ({
          file,
          previewUrl: URL.createObjectURL(file),
          effect: 'none',
          music: 'none',
          duration: 15
        }));

        setImageStories(newImageStories);
        setActiveImageIndex(0);
        setSelectedFile(selected[0]);
        setMediaPreviewUrl(newImageStories[0].previewUrl);
        toast.success(isRtl ? `تم تحميل ${newImageStories.length} صور بنجاح!` : `Loaded ${newImageStories.length} photos successfully!`);
      }
    }
  };

  const updateActiveImageSettings = (key: 'effect' | 'music' | 'duration', value: any) => {
    if (imageStories.length === 0) return;
    const updated = [...imageStories];
    updated[activeImageIndex] = {
      ...updated[activeImageIndex],
      [key]: value
    };
    setImageStories(updated);
  };

  const removeImageFromStories = (idx: number) => {
    if (imageStories.length <= 1) {
      // Clear all
      setImageStories([]);
      setSelectedFile(null);
      setMediaPreviewUrl('');
      return;
    }

    const updated = [...imageStories];
    const removedUrl = updated[idx].previewUrl;
    if (removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl);
    }
    updated.splice(idx, 1);
    
    let nextIndex = activeImageIndex;
    if (idx <= activeImageIndex && activeImageIndex > 0) {
      nextIndex = activeImageIndex - 1;
    }

    setImageStories(updated);
    setActiveImageIndex(nextIndex);
    setSelectedFile(updated[nextIndex].file);
    setMediaPreviewUrl(updated[nextIndex].previewUrl);
  };

  const handlePublish = async () => {
    const authToken = token || secureStorage.getSync('app_token') || '';
    if (!authToken) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    setIsUploading(true);
    stopAudioPreview();

    try {
      if (isVideo) {
        // Publish Single Video Story
        setUploadProgressText(isRtl ? 'جاري رفع مقطع الفيديو القصير...' : 'Uploading short video clip...');
        
        const formData = new FormData();
        formData.append('file', selectedFile!);

        // Pass startTimeOffset and trim limit query parameters (up to 30 seconds)
        const uploadRes = await fetch(`/api/files/upload?maxDuration=30&startOffset=${startTimeOffset}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || (!uploadData.url && !uploadData.file_url && !uploadData.file?.url)) {
          throw new Error(uploadData.error || (isRtl ? 'فشل رفع مقطع الفيديو' : 'Video upload failed'));
        }

        const videoUrl = uploadData.url || uploadData.file_url || uploadData.file?.url;
        const coverThumbnailUrl = recommendedCovers[selectedCoverIndex] || '';

        setUploadProgressText(isRtl ? 'جاري توثيق ونشر قصة الفيديو...' : 'Publishing video story...');
        const res = await fetch('/api/bulletin/stories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            title: isRtl ? 'قصة مرئية' : 'Video Story',
            description: isRtl ? 'شاهد قصة مرئية بالكامل 🎥' : 'Watch video story live 🎥',
            video_url: videoUrl,
            image_url: coverThumbnailUrl || undefined,
            page_id: null
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || (isRtl ? 'فشل نشر قصة الفيديو' : 'Failed to publish video story'));
        }

        if (onStoryCreated) {
          toast.clear();
          onStoryCreated(data.story);
        } else {
          toast.success(isRtl ? 'تم نشر قصة الفيديو بنجاح! 🎥' : 'Video story published successfully! 🎥');
        }
        onClose();

      } else if (imageStories.length > 0) {
        // Publish Multiple Image Stories (Auto split)
        toast.info(isRtl 
          ? `جاري تقسيم ومعالجة عدد (${imageStories.length}) قصص تلقائياً...` 
          : `Processing and auto-splitting (${imageStories.length}) stories sequentially...`);

        let lastStory: any = null;

        for (let i = 0; i < imageStories.length; i++) {
          const item = imageStories[i];
          setUploadProgressText(isRtl 
            ? `جاري رفع القصة (${i + 1} من ${imageStories.length})...` 
            : `Uploading story (${i + 1} of ${imageStories.length})...`
          );

          const formData = new FormData();
          formData.append('file', item.file);

          const uploadRes = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`
            },
            body: formData
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || (!uploadData.url && !uploadData.file_url && !uploadData.file?.url)) {
            throw new Error(`Failed story #${i+1} upload: ` + (uploadData.error || 'Server upload error'));
          }

          const imageUrl = uploadData.url || uploadData.file_url || uploadData.file?.url;

          // Assemble meta tags inside description for display styling
          const effectObj = EFFECTS.find(e => e.id === item.effect);
          const musicObj = MUSIC_TRACKS.find(m => m.id === item.music);
          
          const tags: string[] = [];
          if (effectObj && effectObj.id !== 'none') tags.push(`✨ ${isRtl ? effectObj.labelAr : effectObj.labelEn}`);
          if (musicObj && musicObj.id !== 'none') tags.push(`🎵 ${isRtl ? musicObj.labelAr : musicObj.labelEn}`);
          tags.push(`⏱️ ${item.duration}s`);

          const res = await fetch('/api/bulletin/stories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
              title: isRtl ? `قصة مصورة #${i + 1}` : `Photo Story #${i + 1}`,
              description: tags.join(' | '),
              image_url: imageUrl,
              page_id: null
            })
          });

          const storyData = await res.json();
          if (res.ok && storyData.success) {
            lastStory = storyData.story;
          }
        }

        if (onStoryCreated && lastStory) {
          toast.clear();
          onStoryCreated(lastStory);
        } else {
          toast.clear();
          toast.success(isRtl 
            ? `تهانينا! تم نشر عدد (${imageStories.length}) قصص مقسمة بنجاح! 🎉` 
            : `Successfully published (${imageStories.length}) split stories! 🎉`
          );
        }
        onClose();
      }
    } catch (err: any) {
      console.error('[StoryUpload] Processing failed:', err);
      toast.error(err.message || (isRtl ? 'حدث خطأ أثناء معالجة ونشر القصص' : 'Error publishing stories'));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Publishing Text Story via 1080x1920 Canvas
  const handlePublishTextStory = async () => {
    if (!textContent.trim()) {
      toast.error(isRtl ? 'يرجى كتابة نص للقصة' : 'Please enter text for the story');
      return;
    }
    setIsUploading(true);
    setUploadProgressText(isRtl ? 'جاري توليد القصة النصية بدقة عالية...' : 'Rendering high-resolution story image...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const grad = TEXT_STORY_GRADIENTS[textGradientIndex] || TEXT_STORY_GRADIENTS[0];

      // Linear Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      gradient.addColorStop(0, grad.colors[0]);
      gradient.addColorStop(1, grad.colors[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Vignette shadows top & bottom
      const topVignette = ctx.createLinearGradient(0, 0, 0, 360);
      topVignette.addColorStop(0, 'rgba(0,0,0,0.45)');
      topVignette.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topVignette;
      ctx.fillRect(0, 0, 1080, 360);

      const botVignette = ctx.createLinearGradient(0, 1560, 0, 1920);
      botVignette.addColorStop(0, 'rgba(0,0,0,0)');
      botVignette.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = botVignette;
      ctx.fillRect(0, 1560, 1080, 360);

      // Header on canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      const authorName = user?.name || (isRtl ? 'مستخدم بيربليكستا' : 'User');
      ctx.fillText(authorName, 540, 160);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '24px sans-serif';
      ctx.fillText(isRtl ? 'قصة نصية • تختفي تلقائياً بعد 24 ساعة' : 'Text Story • Disappears after 24h', 540, 210);

      // Body text measurement & wrapping
      const fontSize = textFontSize === 'huge' ? 66 : textFontSize === 'large' ? 50 : 38;
      const lineHeight = fontSize * 1.5;
      ctx.font = `bold ${fontSize}px Tajawal, Cairo, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      const maxWidth = 880;
      const paragraphs = textContent.trim().split('\n');
      const lines: string[] = [];

      for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/);
        let pLine = '';
        for (const word of words) {
          if (!word) continue;
          const testLine = pLine ? `${pLine} ${word}` : word;
          const testWidth = ctx.measureText(testLine).width;
          if (testWidth > maxWidth && pLine) {
            lines.push(pLine);
            pLine = word;
          } else {
            pLine = testLine;
          }
        }
        if (pLine) lines.push(pLine);
      }

      const totalHeight = lines.length * lineHeight;
      let startY = (1920 - totalHeight) / 2 + fontSize * 0.8;

      let textX = 540;
      if (textAlign === 'right') {
        textX = 960;
        ctx.textAlign = 'right';
      } else if (textAlign === 'left') {
        textX = 120;
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'center';
      }

      for (const line of lines) {
        ctx.fillText(line, textX, startY);
        startY += lineHeight;
      }

      // Convert to blob
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas blob generation failed'));
        }, 'image/jpeg', 0.92);
      });

      setUploadProgressText(isRtl ? 'جاري رفع القصة النصية...' : 'Uploading story image...');

      const authToken = token || secureStorage.getSync('app_token') || '';
      const file = new File([blob], `text_story_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || (!uploadData.url && !uploadData.file_url && !uploadData.file?.url)) {
        throw new Error(uploadData.error || (isRtl ? 'فشل رفع القصة النصية' : 'Story upload failed'));
      }

      const imageUrl = uploadData.url || uploadData.file_url || uploadData.file?.url;

      setUploadProgressText(isRtl ? 'جاري نشر القصة (صلاحية 24 ساعة)...' : 'Publishing story (24h)...');
      const res = await fetch('/api/bulletin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: textContent.slice(0, 40),
          description: textContent,
          image_url: imageUrl,
          page_id: null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create story');
      }

      if (onStoryCreated) {
        toast.clear();
        onStoryCreated({
          ...(data.story || data),
          gradientClass: TEXT_STORY_GRADIENTS[textGradientIndex]?.bgClass,
          description: textContent,
          image_url: imageUrl,
        });
      } else {
        toast.success(isRtl ? 'تم نشر القصة النصية بنجاح لمدة 24 ساعة!' : 'Text story published for 24 hours!');
      }
      onClose();
    } catch (err: any) {
      console.error('Error publishing text story:', err);
      toast.error(err.message || (isRtl ? 'تعذر نشر القصة' : 'Failed to publish text story'));
    } finally {
      setIsUploading(false);
    }
  };

  // Safe duration display formatting
  const formatTime = (secs: number) => {
    const s = Math.floor(secs % 60);
    return `${s < 10 ? '0' : ''}${s}`;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-[var(--surface-overlay)] backdrop-blur-md"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isStoryDragging) setIsStoryDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only set false if leaving modal container
            if (e.currentTarget === e.target) {
              setIsStoryDragging(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsStoryDragging(false);
            const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
            if (files.length > 0) {
              handleFilesSelected(files, imageStories.length > 0 && !isVideo);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-sm md:max-w-[440px] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-sans"
          >
          {/* Active Drag & Drop Global Overlay */}
          <AnimatePresence>
            {isStoryDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[90] bg-[var(--surface-card)]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-[var(--fg-accent)] rounded-shape-lg select-none"
              >
                <div className="w-16 h-16 rounded-shape-md bg-[var(--surface-subtle)] text-[var(--fg-accent)] flex items-center justify-center shadow-lg border border-[var(--border-accent)]/40 animate-bounce">
                  <Upload size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-[var(--text-primary)]">
                    {isRtl ? 'أفلت الملفات هنا للرفع الفوري' : 'Drop files here to upload instantly'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] max-w-xs">
                    {isRtl 
                      ? 'يمكنك إفلات حتى 10 صور أو مقطع فيديو واحد'
                      : 'You can drop up to 10 images or 1 video clip'}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--fg-accent)] text-[10px] font-bold border border-[var(--border-accent)]/30 flex items-center gap-1">
                    <ImageIcon size={12} />
                    {isRtl ? 'صور' : 'Images'}
                  </span>
                  <span className="px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--fg-accent)] text-[10px] font-bold border border-[var(--border-accent)]/30 flex items-center gap-1">
                    <VideoIcon size={12} />
                    {isRtl ? 'فيديو' : 'Video'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Title Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--fg-accent)] flex items-center justify-center font-bold">
                <Sparkles size={15} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-extrabold text-[var(--text-primary)]">
                  {isRtl ? 'إنشاء قصة' : 'Create Story'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isUploading}
              aria-label="Close"
              className="w-8 h-8 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Creation Tab Switcher: Photos/Video vs Text Story */}
          <div className="flex items-center gap-1 p-1 mx-4 mt-3 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm">
            <button
              type="button"
              onClick={() => {
                if (isUploading) return;
                setCreationTab('media');
              }}
              className={`flex-1 py-1.5 px-3 rounded-shape-xs text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                creationTab === 'media'
                  ? 'bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-2xs border border-[var(--border-accent)]/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <ImageIcon size={13} />
              <span>{isRtl ? 'صور وفيديو' : 'Photos & Video'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isUploading) return;
                setCreationTab('text');
              }}
              className={`flex-1 py-1.5 px-3 rounded-shape-xs text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                creationTab === 'text'
                  ? 'bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-2xs border border-[var(--border-accent)]/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Type size={13} />
              <span>{isRtl ? 'قصة نصية' : 'Text Story'}</span>
            </button>
          </div>

          {/* Loader Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-[var(--surface-overlay)] z-[80] flex flex-col items-center justify-center gap-3 text-center p-6 backdrop-blur-sm">
              <div className="relative">
                <Loader2 size={36} className="animate-spin text-[var(--fg-accent)]" />
                <Sparkle size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--fg-accent)]" />
              </div>
              <div className="space-y-1">
                <p className="text-white text-xs font-extrabold">{isRtl ? 'جاري معالجة ونشر القصة...' : 'Processing story...'}</p>
                <p className="text-[10px] text-white/70 max-w-sm">{uploadProgressText}</p>
              </div>
            </div>
          )}

          {/* Dialog Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {creationTab === 'text' ? (
              /* Immersive Direct-on-Background Text Story Playground */
              <div className="flex flex-col items-center justify-center py-1">
                {/* 9:16 Vertical Story Canvas with Navigation Arrows */}
                <div className="relative flex items-center justify-center w-full max-w-sm">
                  {/* Previous Gradient Arrow (Desktop & Quick Tap) */}
                  <button
                    type="button"
                    onClick={() => cycleGradient('prev')}
                    className="absolute -left-2 sm:-left-5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-shape-sm bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all duration-fast shadow-md border border-white/20 active:scale-95 cursor-pointer"
                    title={isRtl ? 'اللون السابق (أو اسحب على الخلفية)' : 'Previous Color (or swipe background)'}
                  >
                    <ChevronLeft size={18} className={isRtl ? 'rotate-180' : ''} />
                  </button>

                  {/* Main Story Canvas */}
                  <div
                    onTouchStart={handleCanvasTouchStart}
                    onTouchEnd={handleCanvasTouchEnd}
                    className={`relative w-[215px] h-[350px] xs:w-[245px] xs:h-[400px] sm:w-[285px] sm:h-[465px] rounded-shape-lg overflow-hidden shadow-2xl border-2 border-white/25 flex flex-col justify-between p-3.5 sm:p-4 bg-gradient-to-br ${
                      TEXT_STORY_GRADIENTS[textGradientIndex]?.bgClass || 'from-rose-500 to-orange-400'
                    } text-white select-none transition-all duration-500 ease-out`}
                  >
                    {/* Top Canvas Bar: Author + Floating Minimal Controls */}
                    <div className="flex items-center justify-between gap-2 z-10">
                      {/* Author Info */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                          alt="Avatar"
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-shape-xs border border-white/40 object-cover shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-[11px] font-bold truncate leading-tight drop-shadow-sm">
                            {user?.name || (isRtl ? 'أنا' : 'Me')}
                          </p>
                          <span className="text-[7.5px] sm:text-[8px] text-white/80 flex items-center gap-0.5 drop-shadow-sm">
                            <Clock size={8} />
                            {isRtl ? '24 ساعة' : '24h'}
                          </span>
                        </div>
                      </div>

                      {/* On-Canvas Minimal Toolbar */}
                      <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md p-1 rounded-shape-sm border border-white/20 shadow-xs">
                        {/* Font Size Cycle */}
                        <button
                          type="button"
                          onClick={cycleFontSize}
                          className="px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-extrabold text-white hover:bg-white/20 rounded-shape-xs transition-colors cursor-pointer"
                          title={isRtl ? 'تغيير حجم الخط' : 'Cycle Font Size'}
                        >
                          {textFontSize === 'huge' ? 'A++' : textFontSize === 'large' ? 'A+' : 'A'}
                        </button>

                        {/* Text Alignment Cycle */}
                        <button
                          type="button"
                          onClick={cycleAlignment}
                          className="p-1.5 text-white hover:bg-white/20 rounded-shape-xs transition-colors cursor-pointer"
                          title={isRtl ? 'تغيير المحاذاة' : 'Cycle Alignment'}
                        >
                          {textAlign === 'right' ? <AlignRight size={12} /> : textAlign === 'left' ? <AlignLeft size={12} /> : <AlignCenter size={12} />}
                        </button>

                        {/* Palette / Gradient Cycle Button */}
                        <button
                          type="button"
                          onClick={() => cycleGradient('next')}
                          className="p-1.5 text-white hover:bg-white/20 rounded-shape-xs transition-colors cursor-pointer"
                          title={isRtl ? 'تبديل لون الخلفية' : 'Change Background Color'}
                        >
                          <Palette size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Direct Typing Canvas Area */}
                    <div className="my-auto w-full px-2 py-4 z-10 flex items-center justify-center">
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value.slice(0, 280))}
                        placeholder={isRtl ? 'اكتب ما يدور في ذهنك هنا...' : 'Type your story here...'}
                        rows={5}
                        autoFocus
                        className={`w-full bg-transparent text-white font-black placeholder:text-white/65 focus:placeholder:text-white/35 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] resize-none outline-none border-none p-0 overflow-y-auto scrollbar-none transition-all duration-fast ${
                          textFontSize === 'huge' 
                            ? 'text-lg sm:text-2xl leading-snug' 
                            : textFontSize === 'large' 
                              ? 'text-base sm:text-xl leading-relaxed' 
                              : 'text-sm sm:text-base leading-relaxed'
                        } ${
                          textAlign === 'right' ? 'text-right' : textAlign === 'left' ? 'text-left' : 'text-center'
                        }`}
                      />
                    </div>

                    {/* Bottom Canvas Footer: Gradient Info & Character Count */}
                    <div className="flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-white/85 font-bold z-10 px-1">
                      <div 
                        onClick={() => cycleGradient('next')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-shape-xs bg-black/30 backdrop-blur-md border border-white/20 cursor-pointer hover:bg-black/45 active:scale-95 transition-all"
                        title={isRtl ? 'انقر أو اسحب للتبديل' : 'Tap or swipe to cycle'}
                      >
                        <span>🎨 {isRtl ? TEXT_STORY_GRADIENTS[textGradientIndex]?.nameAr : TEXT_STORY_GRADIENTS[textGradientIndex]?.nameEn}</span>
                        <span className="opacity-70 text-[8px] ms-1 hidden xs:inline">{isRtl ? '• اسحب للتغيير' : '• Swipe'}</span>
                      </div>

                      <span className="px-2 py-1 rounded-shape-xs bg-black/30 backdrop-blur-md border border-white/20 font-mono text-[8px] sm:text-[9px]">
                        {textContent.length}/280
                      </span>
                    </div>

                    {/* Ambient subtle vignette overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />
                  </div>

                  {/* Next Gradient Arrow (Desktop & Quick Tap) */}
                  <button
                    type="button"
                    onClick={() => cycleGradient('next')}
                    className="absolute -right-2 sm:-right-5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-shape-sm bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all duration-fast shadow-md border border-white/20 active:scale-95 cursor-pointer"
                    title={isRtl ? 'اللون التالي (أو اسحب على الخلفية)' : 'Next Color (or swipe background)'}
                  >
                    <ChevronRight size={18} className={isRtl ? 'rotate-180' : ''} />
                  </button>
                </div>
              </div>
            ) : !selectedFile ? (
              /* Drag & Drop Upload Portal */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsStoryDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsStoryDragging(false);
                  const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                  if (files.length > 0) handleFilesSelected(files);
                }}
                className={`border-2 border-dashed rounded-shape-md p-4 sm:p-10 flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer transition-all bg-[var(--surface-subtle)] group text-center select-none ${
                  isStoryDragging
                    ? 'border-[var(--fg-accent)] bg-[var(--surface-subtle)] scale-[1.01]'
                    : 'border-[var(--border-default)] hover:border-[var(--border-accent)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                     const files = e.target.files ? Array.from(e.target.files) : [];
                     if (files.length > 0) handleFilesSelected(files);
                  }}
                />

                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-shape-md bg-[var(--surface-card)] text-[var(--fg-accent)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm border border-[var(--border-default)]">
                  <Upload size={20} className="sm:size-[28px] group-hover:translate-y-[-2px] transition-transform" />
                </div>

                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                    {isRtl ? 'اسحب الملفات هنا أو انقر للتصفح' : 'Drag & Drop files here or click to browse'}
                  </p>
                  <p className="text-[9.5px] sm:text-xs text-[var(--text-secondary)] max-w-md mx-auto line-clamp-2 sm:line-clamp-none">
                    {isRtl 
                      ? 'يمكنك اختيار حتى 10 صور ليتم تقسيمها تلقائياً إلى قصص ممتالية، أو اختيار مقطع فيديو واحد ليتم تشغيله وقصه ذكياً'
                      : 'Upload up to 10 photos to split them automatically into separate stories, or choose a video clip to trim'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-shape-xs bg-[var(--surface-card)] text-[var(--fg-accent)] text-[9.5px] sm:text-[10.5px] font-bold border border-[var(--border-accent)]/20">
                    <ImageIcon size={11} className="sm:size-[12px]" />
                    {isRtl ? 'رفع حتى 10 صور' : 'Up to 10 Images'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-shape-xs bg-[var(--surface-card)] text-[var(--text-primary)] text-[9.5px] sm:text-[10.5px] font-bold border border-[var(--border-default)]">
                    <VideoIcon size={11} className="sm:size-[12px]" />
                    {isRtl ? 'فيديو (حتى 30 ثانية)' : 'Video (Up to 30s)'}
                  </span>
                </div>
              </div>
            ) : (
              /* Design Studio Playground */
              <div className="flex flex-col gap-4 items-stretch">
                
                {/* 1. Immersive 9:16 Vertical Story Live Preview */}
                <div className="flex flex-col gap-2">
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                      if (files.length > 0) {
                        handleFilesSelected(files, false);
                      }
                    }}
                    className="relative w-36 sm:w-40 mx-auto aspect-[9/16] bg-black rounded-shape-md overflow-hidden shadow-2xl border border-[var(--border-default)] flex items-center justify-center group"
                  >
                    
                    {/* Video Player Render */}
                    {isVideo ? (
                      <video
                        ref={videoRef}
                        src={mediaPreviewUrl}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        onTimeUpdate={() => {
                          if (videoRef.current) {
                            const cur = videoRef.current.currentTime;
                            setCurrentTime(cur);
                            if (cur > startTimeOffset + 30) {
                              videoRef.current.currentTime = startTimeOffset;
                            } else if (cur < startTimeOffset) {
                              videoRef.current.currentTime = startTimeOffset;
                            }
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Image Render with Live Filter CSS Classes applied */
                      <img
                        src={mediaPreviewUrl}
                        alt="Preview"
                        className={`w-full h-full object-cover transition-all duration-media ${
                          EFFECTS.find(e => e.id === (imageStories[activeImageIndex]?.effect || 'none'))?.class || ''
                        }`}
                      />
                    )}

                    {/* Gradient Top & Bottom Bars */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                    {/* Header Overlay (User metadata + Expiration) */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between text-white z-15">
                      <div className="flex items-center gap-2">
                        <img
                          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                          alt="Avatar"
                          className="w-7 h-7 rounded-shape-xs border border-white/20 object-cover"
                        />
                        <div>
                          <p className="text-[10px] font-extrabold leading-tight">
                            {user?.name || (isRtl ? 'مستكشف المنصة' : 'User')}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[8px] text-white/70">
                            <Clock size={8} />
                            {isRtl ? 'تختفي بعد 24 ساعة' : 'Expires in 24h'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setMediaPreviewUrl('');
                          setImageStories([]);
                          stopAudioPreview();
                        }}
                        className="px-2.5 py-1 rounded-shape-xs bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold border border-white/10 backdrop-blur-md transition-all cursor-pointer"
                      >
                        {isRtl ? 'تغيير' : 'Change'}
                      </button>
                    </div>

                    {/* Active Audio Indicator Notes for Image */}
                    {!isVideo && activeMusicTrack !== 'none' && isMusicPlaying && (
                      <div className="absolute top-14 right-3 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[var(--fg-accent)] text-[8px] font-bold backdrop-blur-md border border-white/10">
                        <Music size={8} className="animate-bounce" />
                        <span>{MUSIC_TRACKS.find(m => m.id === activeMusicTrack)?.labelAr}</span>
                      </div>
                    )}

                    {/* Controls Overlay (Mute, Play/Pause) */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-15 text-white">
                      
                      {/* Media Playback Controls */}
                      <div className="flex items-center gap-1">
                        {isVideo && (
                          <button
                            onClick={() => {
                              if (videoRef.current) {
                                if (isPlaying) {
                                  videoRef.current.pause();
                                } else {
                                  videoRef.current.play().catch(console.error);
                                }
                                setIsPlaying(!isPlaying);
                              }
                            }}
                            className="p-1.5 rounded-shape-xs bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                          >
                            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                          </button>
                        )}

                        {/* Mute/Unmute sound track */}
                        <button
                          onClick={toggleMusicMute}
                          className="p-1.5 rounded-shape-xs bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX size={10} className="text-[var(--fg-danger)]" /> : <Volume2 size={10} className="text-[var(--fg-accent)]" />}
                        </button>
                      </div>

                      {/* Video Clip Duration Badge / Track Duration */}
                      <div className="px-2 py-0.5 rounded-shape-xs bg-black/60 border border-white/10 backdrop-blur-md text-[9px] font-bold flex items-center gap-1">
                        <Clock size={10} className="text-[var(--fg-accent)]" />
                        <span>
                          {isVideo 
                            ? `00:${formatTime(currentTime)} / 00:30`
                            : `${imageStories[activeImageIndex]?.duration || 15}s`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Multi-photo pagination badge */}
                    {imageStories.length > 1 && (
                      <div className="absolute top-14 left-3 bg-black/65 px-2 py-0.5 rounded border border-white/10 text-[8px] font-bold text-white backdrop-blur-md">
                        {isRtl ? 'القصة' : 'Story'} {activeImageIndex + 1} / {imageStories.length}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Controls Board (Effects, Music, Trimming, Multi-image layout) */}
                <div className="space-y-4">
                  
                  {/* Grid layout for Multiple Photos Selection if active */}
                  {imageStories.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] block uppercase tracking-wider">
                        {isRtl ? `الصور المختارة (${imageStories.length} من 10)` : `Selected Images (${imageStories.length} of 10)`}
                      </span>
                      
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                          if (files.length > 0) {
                            handleFilesSelected(files, true);
                          }
                        }}
                        className="flex flex-wrap items-center gap-1 bg-[var(--surface-subtle)] p-2 rounded-shape-sm border border-[var(--border-default)] max-h-[110px] overflow-y-auto"
                      >
                        {imageStories.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setActiveImageIndex(idx);
                              setMediaPreviewUrl(item.previewUrl);
                            }}
                            className={`relative w-10 h-14 rounded-shape-xs overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                              activeImageIndex === idx ? 'border-[var(--border-accent)] scale-105 shadow-md' : 'border-[var(--border-default)] hover:opacity-80'
                            }`}
                          >
                            <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImageFromStories(idx);
                              }}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-shape-xs bg-[var(--fg-danger)] text-white shadow cursor-pointer"
                            >
                              <X size={8} />
                            </button>
                            
                            {(item.effect !== 'none' || item.music !== 'none') && (
                              <div className="absolute bottom-0.5 inset-x-0 flex justify-center gap-0.5 bg-black/40 py-0.5">
                                {item.effect !== 'none' && <Sparkles size={6} className="text-[var(--fg-accent)]" />}
                                {item.music !== 'none' && <Music size={6} className="text-[var(--fg-accent)]" />}
                              </div>
                            )}
                          </div>
                        ))}

                        {imageStories.length < 10 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                              if (files.length > 0) handleFilesSelected(files, true);
                            }}
                            className="w-10 h-14 rounded-shape-xs border border-dashed border-[var(--border-default)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--fg-accent)] transition-colors shrink-0 cursor-pointer"
                            title={isRtl ? 'اسحب صوراً إضافية هنا' : 'Drop more photos here'}
                          >
                            <Upload size={12} />
                            <span className="text-[8px] font-bold mt-0.5">{isRtl ? 'إضافة' : 'Add'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VIDEO TRIMMER CARD & CHOOSE RECOMMENDED COVER */}
                  {isVideo && (
                    <div className="space-y-3">
                      {videoDuration > 30.5 && (
                        <div className="bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1">
                              <Scissors size={12} className="text-[var(--fg-accent)]" />
                              {isRtl ? 'قص ذكي للمقطع (30 ثانية):' : 'Crop segment loop (30s):'}
                            </span>
                            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-mono">
                              {isRtl ? 'يبدأ من:' : 'Starts at:'} {formatTime(startTimeOffset)}s
                            </span>
                          </div>

                          <div className="space-y-1">
                            <input
                              type="range"
                              min="0"
                              max={Math.max(0, videoDuration - 30)}
                              step="0.5"
                              value={startTimeOffset}
                              onChange={(e) => {
                                const offset = parseFloat(e.target.value);
                                setStartTimeOffset(offset);
                                if (videoRef.current) {
                                  videoRef.current.currentTime = offset;
                                }
                              }}
                              className="w-full accent-[var(--accent)] h-1 bg-[var(--surface-inset)] rounded-lg cursor-pointer"
                            />
                            <div className="flex items-center justify-between text-[8px] text-[var(--text-muted)]">
                              <span>00:00</span>
                              <span>{isRtl ? 'نهاية المقطع:' : 'Video End:'} {formatTime(videoDuration)}s</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cover selection panel */}
                      <div className="bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                            {isRtl ? 'توصيات المقطع' : 'Clip Recommendations'}
                          </span>
                          <button
                            type="button"
                            onClick={() => customCoverInputRef.current?.click()}
                            className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] hover:opacity-85 text-[var(--fg-accent)] text-[9px] font-bold border border-[var(--border-accent)]/25 transition-colors cursor-pointer"
                          >
                            <Upload size={9} />
                            <span>{isRtl ? 'رفع صورة غلاف' : 'Upload cover'}</span>
                          </button>
                          <input
                            ref={customCoverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCustomCoverUpload}
                            className="hidden"
                          />
                        </div>
                        
                        {isGeneratingCovers ? (
                          <div className="flex items-center gap-1 justify-center py-3 text-[10px] text-[var(--text-muted)]">
                            <Loader2 size={12} className="animate-spin text-[var(--fg-accent)]" />
                            <span>{isRtl ? 'جاري استخراج صور غلاف ممتازة...' : 'Generating cover previews...'}</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1">
                            {recommendedCovers.map((thumb, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedCoverIndex(idx)}
                                className={`relative aspect-[9/16] rounded-[var(--radius-xs)] overflow-hidden border-2 cursor-pointer transition-all hover:opacity-90 ${
                                  selectedCoverIndex === idx ? 'border-[var(--border-accent)] scale-[1.03] shadow-md' : 'border-[var(--border-default)]'
                                }`}
                              >
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                                {selectedCoverIndex === idx && (
                                  <div className="absolute inset-0 bg-[var(--bg-accent-muted)] flex items-center justify-center text-[var(--fg-accent)]">
                                    <Check size={12} className="bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] rounded-shape-xs p-0.5" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PROFESSIONAL FACEBOOK/INSTAGRAM CREATIVE CONTROLS PANEL */}
                  {!isVideo && (
                    <div className="bg-[var(--surface-card)] border border-[var(--border-main)] p-3.5 rounded-shape-sm shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                        <span className="text-[11px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[var(--fg-accent)]" />
                          {isRtl ? 'إعدادات لمسات القصة الإبداعية' : 'Creative Story Enhancements'}
                        </span>
                        {imageStories[activeImageIndex]?.music !== 'none' && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-shape-xs bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/20 flex items-center gap-1 animate-pulse">
                            <Music size={10} />
                            {isRtl ? 'موسيقى نشطة' : 'Music Active'}
                          </span>
                        )}
                      </div>

                      {/* Dropdowns Grid: Filters, Music, and Duration */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* 1. Filter Dropdown Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] flex items-center gap-1">
                            <Palette size={11} className="text-[var(--fg-accent)]" />
                            {isRtl ? 'الفلتر والتأثير' : 'Filter Effect'}
                          </label>
                          <div className="relative">
                            <select
                              value={imageStories[activeImageIndex]?.effect || 'none'}
                              onChange={(e) => updateActiveImageSettings('effect', e.target.value)}
                              className="w-full h-8 py-1 ps-7 pe-6 text-[10.5px] font-bold rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none appearance-none cursor-pointer transition-colors truncate"
                            >
                              {EFFECTS.map((eff) => (
                                <option key={eff.id} value={eff.id} className="bg-[var(--surface-card)] text-[var(--text-primary)] truncate">
                                  {isRtl ? eff.labelAr : eff.labelEn}
                                </option>
                              ))}
                            </select>
                            <Sparkles size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-[var(--fg-accent)] pointer-events-none" />
                            <ChevronLeft size={12} className="absolute end-2 top-1/2 -translate-y-1/2 -rotate-90 text-[var(--text-muted)] pointer-events-none" />
                          </div>
                        </div>

                        {/* 2. Music Track Dropdown Selector + Live Preview Button */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] flex items-center gap-1">
                              <Music size={11} className="text-[var(--fg-accent)]" />
                              {isRtl ? 'الموسيقى والصوت' : 'Background Audio'}
                            </label>
                            {imageStories[activeImageIndex]?.music !== 'none' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentTrack = imageStories[activeImageIndex]?.music || 'none';
                                  if (isMusicPlaying) {
                                    stopAudioPreview();
                                  } else {
                                    playAudioTrack(currentTrack);
                                  }
                                }}
                                className="text-[9.5px] font-black text-[var(--fg-success)] hover:text-[var(--fg-success)] flex items-center gap-1 bg-[var(--status-success-subtle)] hover:bg-[var(--status-success-subtle)] px-1.5 py-0.5 rounded-shape-xs border border-[var(--fg-success)]/30 transition-all cursor-pointer"
                                title={isRtl ? 'معاينة تجربة الصوت مباشرة' : 'Preview Audio Live'}
                              >
                                {isMusicPlaying ? (
                                  <>
                                    <Volume2 size={10} className="animate-pulse text-[var(--fg-success)]" />
                                    <span>{isRtl ? 'إيقاف' : 'Pause'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 size={10} />
                                    <span>{isRtl ? 'معاينة' : 'Preview'}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <select
                              value={imageStories[activeImageIndex]?.music || 'none'}
                              onChange={(e) => updateActiveImageSettings('music', e.target.value)}
                              className="w-full h-8 py-1 ps-7 pe-6 text-[10.5px] font-bold rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none appearance-none cursor-pointer transition-colors truncate"
                            >
                              {availableMusicTracks.map((track) => (
                                <option key={track.id} value={track.id} className="bg-[var(--surface-card)] text-[var(--text-primary)] truncate">
                                  {isRtl ? track.labelAr : track.labelEn}
                                </option>
                              ))}
                            </select>
                            <Music size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-[var(--fg-accent)] pointer-events-none" />
                            <ChevronLeft size={12} className="absolute end-2 top-1/2 -translate-y-1/2 -rotate-90 text-[var(--text-muted)] pointer-events-none" />
                          </div>
                        </div>

                        {/* 3. Duration Dropdown Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] flex items-center gap-1">
                            <Clock size={11} className="text-[var(--fg-accent)]" />
                            {isRtl ? 'مدة العرض' : 'Story Duration'}
                          </label>
                          <div className="relative">
                            <select
                              value={imageStories[activeImageIndex]?.duration || 15}
                              onChange={(e) => updateActiveImageSettings('duration', parseInt(e.target.value))}
                              className="w-full h-8 py-1 ps-7 pe-6 text-[10.5px] font-bold rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none appearance-none cursor-pointer transition-colors truncate"
                            >
                              <option value={5} className="bg-[var(--surface-card)] text-[var(--text-primary)] truncate">
                                {isRtl ? '5 ثوانٍ (سريع)' : '5s (Fast)'}
                              </option>
                              <option value={10} className="bg-[var(--surface-card)] text-[var(--text-primary)] truncate">
                                {isRtl ? '10 ثوانٍ (متوسط)' : '10s (Medium)'}
                              </option>
                              <option value={15} className="bg-[var(--surface-card)] text-[var(--text-primary)] truncate">
                                {isRtl ? '15 ثانية (افتراضي)' : '15s (Full)'}
                              </option>
                            </select>
                            <Clock size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-[var(--fg-accent)] pointer-events-none" />
                            <ChevronLeft size={12} className="absolute end-2 top-1/2 -translate-y-1/2 -rotate-90 text-[var(--text-muted)] pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Facebook/Instagram Style Compact Action Footer */}
          <div className="px-3.5 py-2.5 border-t border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between gap-2.5">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="h-8.5 px-3.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>

            {creationTab === 'text' ? (
              <button
                onClick={handlePublishTextStory}
                disabled={!textContent.trim() || isUploading}
                className="flex-1 max-w-[220px] h-8.5 flex items-center justify-center gap-1.5 px-3.5 rounded-shape-xs bg-[var(--comp-button-primary-bg)] hover:bg-[var(--fg-success)] disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition-all border border-[var(--fg-success)]/40 cursor-pointer active:scale-98"
              >
                <Send size={13} />
                <span>{isRtl ? 'نشر القصة النصية الآن' : 'Publish Text Story'}</span>
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={(!selectedFile && imageStories.length === 0) || isUploading}
                className="flex-1 max-w-[220px] h-8.5 flex items-center justify-center gap-1.5 px-3.5 rounded-shape-xs bg-[var(--bg-accent-emphasis)] hover:opacity-90 disabled:opacity-50 text-[var(--fg-on-emphasis)] text-xs font-extrabold shadow-md transition-all border border-[var(--border-accent)] cursor-pointer active:scale-98"
              >
                <Send size={14} />
                <span>
                  {imageStories.length > 1 
                    ? (isRtl ? `مشاركة (${imageStories.length}) قصص الآن` : `Share (${imageStories.length}) stories`)
                    : (isRtl ? 'مشاركة في القصة الآن' : 'Share to Story Now')
                  }
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
export default StoryUploadModal;
