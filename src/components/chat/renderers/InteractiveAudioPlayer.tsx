import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Volume2, Download, Music, Sliders, 
  Check, Paperclip, Loader2, AlertTriangle, Sparkles 
} from 'lucide-react';
import { toast } from '@/design-system';
import { secureStorage } from '../../../lib/storage';
import { generateProceduralTrack } from '../../../utils/audioGenerator';

interface InteractiveAudioPlayerProps {
  body: string;
  fullContent?: string;
  dir: 'ltr' | 'rtl';
  theme: string;
  coverImageUrl: string | null;
}

export const InteractiveAudioPlayer: React.FC<InteractiveAudioPlayerProps> = ({ 
  body, 
  fullContent, 
  dir, 
  theme, 
  coverImageUrl 
}) => {
  const [status, setStatus] = useState<'idle' | 'rendering' | 'ready' | 'error'>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  const [aiVolume, setAiVolume] = useState(0.85);
  const [uploadedVolume, setUploadedVolume] = useState(0.70);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedDuration, setUploadedDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMixerExpanded, setIsMixerExpanded] = useState(true);

  const [isLyriaGenerating, setIsLyriaGenerating] = useState(false);
  const [lyriaPrompt, setLyriaPrompt] = useState(() => {
    const cleaned = (body || '').replace(/\[.*?\]/g, '').replace(/[#*`_]/g, '').trim();
    return cleaned || (dir === 'rtl' ? 'معزوفة أوركسترا ملحمية بطابع شرقي مميز' : 'Beautiful epic orchestral track');
  });
  const [lyriaLyrics, setLyriaLyrics] = useState('');
  const [lyriaLyricsResponse, setLyriaLyricsResponse] = useState('');
  const [isLyriaActive, setIsLyriaActive] = useState(false);
  const [lyriaError, setLyriaError] = useState<string | null>(null);
  const [isLyriaPanelExpanded, setIsLyriaPanelExpanded] = useState(false);

  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [generatedAudioMime, setGeneratedAudioMime] = useState<string | null>(null);
  const [isSavingTrack, setIsSavingTrack] = useState(false);
  const [isTrackSaved, setIsTrackSaved] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uploadedAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const aiSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const uploadedSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const aiGainNodeRef = useRef<GainNode | null>(null);
  const uploadedGainNodeRef = useRef<GainNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'rendering') {
      setProgressPercent(0);
      const interval = setInterval(() => {
        setProgressPercent(prev => {
          if (prev >= 98) return prev;
          const inc = Math.floor(Math.random() * 8) + 4;
          return Math.min(98, prev + inc);
        });
      }, 150);
      return () => clearInterval(interval);
    } else if (status === 'ready') {
      setProgressPercent(100);
    }
  }, [status]);

  const { styleName, vocalName, durationVal } = useMemo(() => {
    const bodyText = (fullContent || '') + '\n' + (body || '');
    let style = 'Epic';
    let vocal = 'None';
    let dVal = 30;

    if (bodyText.includes('ملحمية') || bodyText.toLowerCase().includes('epic') || bodyText.toLowerCase().includes('orchestra')) {
      style = 'Epic';
    } else if (bodyText.includes('طرب') || bodyText.includes('شرقي') || bodyText.toLowerCase().includes('tarab') || bodyText.toLowerCase().includes('maqam')) {
      style = 'Tarab';
    } else if (bodyText.includes('إلكترونك') || bodyText.includes('دي جي') || bodyText.toLowerCase().includes('edm') || bodyText.toLowerCase().includes('techno') || bodyText.toLowerCase().includes('electronic') || bodyText.toLowerCase().includes('تقنو') || bodyText.toLowerCase().includes('تكنو')) {
      style = 'EDM';
    } else if (bodyText.includes('غيتار') || bodyText.includes('تخت') || bodyText.toLowerCase().includes('acoustic') || bodyText.toLowerCase().includes('guitar') || bodyText.toLowerCase().includes('soft') || bodyText.toLowerCase().includes('كلاسيك') || bodyText.toLowerCase().includes('هادئ')) {
      style = 'Acoustic';
    } else if (bodyText.includes('لو-فاي') || bodyText.includes('لوفاي') || bodyText.toLowerCase().includes('lofi') || bodyText.toLowerCase().includes('lo-fi') || bodyText.toLowerCase().includes('chill')) {
      style = 'LoFi';
    } else if (bodyText.includes('جاز') || bodyText.toLowerCase().includes('jazz') || bodyText.toLowerCase().includes('blues')) {
      style = 'Jazz';
    } else if (bodyText.includes('بوب') || bodyText.toLowerCase().includes('pop') || bodyText.toLowerCase().includes('upbeat')) {
      style = 'Pop';
    }

    if (bodyText.includes('كورال') || bodyText.toLowerCase().includes('choir') || bodyText.toLowerCase().includes('choral')) {
      vocal = 'Choir';
    } else if (bodyText.includes('أنثوي') || bodyText.toLowerCase().includes('female') || bodyText.toLowerCase().includes('soprano')) {
      vocal = 'Female';
    } else if (bodyText.includes('ذكوري') || bodyText.toLowerCase().includes('male') || bodyText.toLowerCase().includes('baritone') || bodyText.toLowerCase().includes('hum') || bodyText.toLowerCase().includes('تينور')) {
      vocal = 'Male';
    } else if (bodyText.includes('روبوت') || bodyText.toLowerCase().includes('vocaloid') || bodyText.toLowerCase().includes('ai synth')) {
      vocal = 'Vocaloid';
    } else if (bodyText.includes('بدون غناء') || bodyText.includes('موسيقى فقط') || bodyText.includes('عزف') || bodyText.toLowerCase().includes('instrumental') || bodyText.toLowerCase().includes('none')) {
      vocal = 'None';
    }

    const normalizedBody = bodyText
      .replace(/[٠0]/g, '0')
      .replace(/[١1]/g, '1')
      .replace(/[٢2]/g, '2')
      .replace(/[٣3]/g, '3')
      .replace(/[٤4]/g, '4')
      .replace(/[٥٥]/g, '5')
      .replace(/[٦6]/g, '6')
      .replace(/[٧7]/g, '7')
      .replace(/[٨8]/g, '8')
      .replace(/[٩9]/g, '9');

    const durationMatch = normalizedBody.match(/(?:المدة|Duration|المدة الزمنية|طول)\s*:\s*\*?(\d+)/i) || normalizedBody.match(/(\d+)\s*(?:ثانية|ثوانٍ|seconds|secs|s)/i);
    if (durationMatch) {
      dVal = parseInt(durationMatch[1], 10);
      if (isNaN(dVal) || dVal < 10) dVal = 30;
    }

    return { styleName: style, vocalName: vocal, durationVal: dVal };
  }, [fullContent, body]);

  const mixDuration = uploadedFile ? Math.max(duration, uploadedDuration) : duration;

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    const renderTrack = async () => {
      setStatus('rendering');
      try {
        const trackBlob = await generateProceduralTrack(styleName, vocalName, durationVal);
        if (!active) return;
        const url = URL.createObjectURL(trackBlob);
        createdUrl = url;
        setAudioUrl(url);
        setDuration(durationVal);
        setStatus('ready');
      } catch (err) {
        if (active) setStatus('error');
      }
    };
    renderTrack();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [styleName, vocalName, durationVal]);

  const updateProgress = () => {
    if (audioRef.current) {
      const mainTime = audioRef.current.currentTime;
      let displayTime = mainTime;

      if (audioRef.current.ended) {
        if (uploadedAudioRef.current && !uploadedAudioRef.current.ended && uploadedUrl) {
          displayTime = uploadedAudioRef.current.currentTime;
          setCurrentTime(displayTime);
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
          if (uploadedAudioRef.current) {
            uploadedAudioRef.current.currentTime = 0;
          }
        }
      } else {
        if (uploadedAudioRef.current && !uploadedAudioRef.current.paused && uploadedUrl) {
          const diff = Math.abs(uploadedAudioRef.current.currentTime - mainTime);
          if (diff > 0.22) {
            uploadedAudioRef.current.currentTime = Math.min(mainTime, uploadedAudioRef.current.duration || 0);
          }
        }
        setCurrentTime(displayTime);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || status !== 'ready') return;

    let ctx = audioCtxRef.current;
    if (!ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
        masterGain.connect(ctx.destination);
        masterGainNodeRef.current = masterGain;
      } catch (e) {}
    }

    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (ctx && !aiSourceRef.current && masterGainNodeRef.current) {
      try {
        const aiSrc = ctx.createMediaElementSource(audioRef.current);
        const aiGain = ctx.createGain();
        aiGain.gain.setValueAtTime(aiVolume, ctx.currentTime);
        aiSrc.connect(aiGain);
        aiGain.connect(masterGainNodeRef.current);

        aiSourceRef.current = aiSrc;
        aiGainNodeRef.current = aiGain;
      } catch (err) {}
    }

    if (ctx && uploadedAudioRef.current && uploadedUrl && !uploadedSourceRef.current && masterGainNodeRef.current) {
      try {
        const uplSrc = ctx.createMediaElementSource(uploadedAudioRef.current);
        const uplGain = ctx.createGain();
        uplGain.gain.setValueAtTime(uploadedVolume, ctx.currentTime);
        uplSrc.connect(uplGain);
        uplGain.connect(masterGainNodeRef.current);

        uploadedSourceRef.current = uplSrc;
        uploadedGainNodeRef.current = uplGain;
      } catch (err) {}
    }

    if (isPlaying) {
      audioRef.current.pause();
      if (uploadedAudioRef.current && uploadedUrl) {
        uploadedAudioRef.current.pause();
      }
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      if (uploadedAudioRef.current && uploadedUrl) {
        uploadedAudioRef.current.currentTime = Math.min(audioRef.current.currentTime, uploadedAudioRef.current.duration || 0);
      }

      try {
        const playPromises = [];
        playPromises.push(audioRef.current.play());
        if (uploadedAudioRef.current && uploadedUrl) {
          playPromises.push(uploadedAudioRef.current.play());
        }

        await Promise.all(playPromises);
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } catch (err) {}
    }
  };

  const handleGenerateLyria = async () => {
    setIsLyriaGenerating(true);
    setLyriaError(null);
    setGeneratedAudioBase64(null);
    setGeneratedAudioMime(null);
    setIsTrackSaved(false);
    try {
      const token = secureStorage.getSync('token');
      const response = await fetch('/api/tools/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: lyriaPrompt || 'Beautiful epic orchestral track',
          lyrics: lyriaLyrics
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(dir === 'rtl' ? (data.error_ar || data.error) : data.error);
      }
      
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      setIsPlaying(false);
      setStatus('ready');
      setCurrentTime(0);
      setDuration(60);
      setIsLyriaActive(true);
      setGeneratedAudioBase64(data.audioBase64);
      setGeneratedAudioMime(data.mimeType);
      if (data.lyrics) {
        setLyriaLyricsResponse(data.lyrics);
      }
      toast.success(dir === 'rtl' ? 'تم توليد الموسيقى بالذكاء الاصطناعي بنجاح!' : 'AI Music generated successfully!');
    } catch (err: any) {
      console.error('Lyria generation failed:', err);
      setLyriaError(err.message || 'Failed to generate AI music.');
      toast.error(err.message || 'Failed to generate AI music.');
    } finally {
      setIsLyriaGenerating(false);
    }
  };

  const handleSaveTrackToLibrary = async () => {
    if (!generatedAudioBase64) return;
    setIsSavingTrack(true);
    try {
      const token = secureStorage.getSync('token');
      const response = await fetch('/api/tools/save-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          audioBase64: generatedAudioBase64,
          mimeType: generatedAudioMime,
          prompt: lyriaPrompt,
          lyrics: lyriaLyricsResponse || lyriaLyrics
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save track.');
      }

      setIsTrackSaved(true);
      toast.success(dir === 'rtl' ? 'تم حفظ المقطوعة بنجاح في مكتبة ملفاتك!' : 'Track successfully saved to your storage library!');
    } catch (err: any) {
      console.error('[SaveTrack] Error:', err);
      toast.error(err.message || 'Failed to save track.');
    } finally {
      setIsSavingTrack(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || status !== 'ready') return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = percentage * mixDuration;

    audioRef.current.currentTime = targetTime;
    if (uploadedAudioRef.current && uploadedUrl) {
      uploadedAudioRef.current.currentTime = Math.min(targetTime, uploadedAudioRef.current.duration || 0);
    }
    setCurrentTime(targetTime);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error(dir === 'rtl' ? 'يرجى تحميل ملف صوتي صالح.' : 'Please upload a valid audio file.');
      return;
    }

    if (uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
    }

    const url = URL.createObjectURL(file);
    setUploadedFile(file);
    setUploadedUrl(url);

    if (isPlaying) {
      audioRef.current?.pause();
      if (uploadedAudioRef.current) {
        uploadedAudioRef.current.pause();
      }
      setIsPlaying(false);
    }

    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    toast.success(dir === 'rtl' ? 'تم جلب الملف الصوتي المساعد للمزج!' : 'Companion file imported successfully!');
  };

  const removeUploadedFile = () => {
    if (uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
    }
    setUploadedFile(null);
    setUploadedUrl(null);
    setUploadedDuration(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (timeInSecs: number) => {
    const min = Math.floor(timeInSecs / 60);
    const sec = Math.floor(timeInSecs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const styleDisplayMap: Record<string, { ar: string; en: string }> = {
    'Epic': { ar: 'أوركسترا ملحمية', en: 'Epic Orchestral' },
    'Tarab': { ar: 'طرب ومقام شرقي', en: 'Arabic Tarab' },
    'EDM': { ar: 'إلكترونك ودي جي', en: 'EDM & Techno' },
    'Acoustic': { ar: 'غيتار وتخت هادئ', en: 'Acoustic & Soft' },
    'LoFi': { ar: 'لو-فاي مريح', en: 'Chill Lo-Fi' },
    'Jazz': { ar: 'جاز بلوز', en: 'Jazz & Blues' },
    'Pop': { ar: 'بوب حماسي', en: 'Energetic Pop' }
  };

  const vocalDisplayMap: Record<string, { ar: string; en: string }> = {
    'None': { ar: 'مقطوعة موسيقية', en: 'Instrumental Only' },
    'Choir': { ar: 'صوت كورال سينمائي', en: 'Cinematic Choir vocal' },
    'Female': { ar: 'أداء سوبرانو نسائي', en: 'Soprano Female vocal' },
    'Male': { ar: 'غناء تينور ذكوري', en: 'Tenor Male vocal' },
    'Vocaloid': { ar: 'سنتسيزر ذكاء اصطناعي', en: 'AI Vocal Synthesizer' }
  };

  const styleLabel = styleDisplayMap[styleName] || { ar: styleName, en: styleName };
  const vocalLabel = vocalDisplayMap[vocalName] || { ar: vocalName, en: vocalName };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)} 
        />
      )}

      {uploadedUrl && (
        <audio
          ref={uploadedAudioRef}
          src={uploadedUrl}
          onLoadedMetadata={() => {
            if (uploadedAudioRef.current) {
              setUploadedDuration(uploadedAudioRef.current.duration);
            }
          }}
        />
      )}

      <div className="relative w-full aspect-video rounded-shape-md overflow-hidden border border-accent/15 shadow-2xl bg-black">
        {coverImageUrl ? (
          <img 
            src={coverImageUrl} 
            className={`w-full h-full object-cover opacity-50 transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`} 
            referrerPolicy="no-referrer" 
            alt="Orchestra Cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0b0c10] via-gray-950 to-black flex items-center justify-center">
             <Music className={`text-accent/10 transition-transform duration-1000 ${isPlaying ? 'rotate-6 scale-110' : ''}`} size={140} />
          </div>
        )}

        <div className={`absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex flex-col gap-1 z-10`}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-shape-xs bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black tracking-widest text-accent">
            <span className="w-1.5 h-1.5 rounded-shape-full bg-accent animate-ping" />
            {dir === 'rtl' ? styleLabel.ar : styleLabel.en}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-medium px-1">
            {dir === 'rtl' ? vocalLabel.ar : vocalLabel.en}
          </p>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/30 backdrop-blur-[2px]">
          {status === 'rendering' || status === 'idle' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-shape-xs border-2 border-t-accent-500 border-r-accent-500/30 border-b-accent-500/10 border-l-transparent shadow-[0_0_30px_rgba(156,163,175,0.15)]" 
                />
                <div className="absolute w-14 h-14 rounded-shape-xs bg-accent/10 border border-accent/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-[11px] font-mono font-black text-accent">
                    {progressPercent}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[11px] font-black text-accent uppercase tracking-widest animate-pulse leading-none mb-1">
                  {dir === 'rtl' ? 'جاري التوليف الابتكاري والهندسة الفنية...' : 'SYNTHESIZING & ORCHESTRATING SOUNDWAVE...'}
                </span>
                <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                  {dir === 'rtl' ? 'جودة فائقة الدقة استوديو 24 بت' : 'ULTRA-RES 24-BIT DIGITAL SIGNAL PROCESSING'}
                </span>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center gap-2 text-rose-500">
               <AlertTriangle size={32} className="animate-bounce" />
               <span className="text-xs font-black uppercase tracking-wider">
                 {dir === 'rtl' ? 'فشل إعداد المسار الصوتي' : 'SOUND GENERATION ERROR'}
               </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={handlePlayPause}
                className="w-20 h-20 rounded-shape-sm bg-accent/20 backdrop-blur-md border-2 border-accent/40 hover:border-accent hover:bg-accent/30 text-accent shadow-[0_0_40px_rgba(156,163,175,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer transition-theme"
                title={isPlaying ? (dir === 'rtl' ? 'إيقاف مؤقت' : 'Pause') : (dir === 'rtl' ? 'تشغيل' : 'Play')}
              >
                {isPlaying ? (
                  <Pause size={30} className="fill-accent text-accent " />
                ) : (
                  <Play size={30} className="ml-1.5 fill-accent text-accent " />
                )}
              </button>

              <div className="text-center px-6">
                <h4 className="text-sm font-black text-white tracking-[0.2em] uppercase mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {dir === 'rtl' ? 'تحفة الأوركسترا من بيربليكستا' : 'PERPLEXTA ORCHESTRA MASTERPIECE'}
                </h4>
                <p className="text-[9px] text-accent font-black tracking-widest uppercase">
                  {dir === 'rtl' ? 'أصلية بالكامل • جودة استوديو 24 بت' : 'FULLY ORIGINAL • 24-BIT CUSTOM SYNTH'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full h-12 flex items-end justify-center gap-1 sm:gap-1.5 px-6 pb-4 opacity-65 pointer-events-none">
          {Array.from({ length: 36 }).map((_, i) => {
            let scaleVal = 4;
            if (status === 'ready' && isPlaying) {
              const indexFactor = Math.sin(i * 0.4 + currentTime * 8);
              const volumeFactor = 16 + indexFactor * 12;
              scaleVal = Math.max(4, Math.min(26, volumeFactor));
              return (
                <div 
                  key={`audio-vis-bar-${i}`}
                  style={{ height: `${scaleVal}px` }}
                  className="w-1 bg-accent/70 rounded-shape-xs transition-theme shadow-[0_0_8px_rgba(156,163,175,0.4)]"
                />
              );
            } else if (status === 'rendering' || status === 'idle') {
              return (
                <motion.div 
                  key={`audio-vis-motion-${i}`}
                  animate={{ 
                    height: [4, 18 + Math.sin(i * 0.5) * 10, 4] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: i * 0.05 
                  }}
                  className="w-1 bg-accent/60 rounded-shape-xs shadow-[0_0_8px_rgba(156,163,175,0.3)]"
                />
              );
            } else {
              scaleVal = 4 + Math.sin(i * 0.3) * 3;
              return (
                <div 
                  key={`audio-vis-idle-${i}`}
                  style={{ height: `${scaleVal}px` }}
                  className="w-1 bg-accent/40 rounded-shape-xs transition-theme shadow-[0_0_4px_rgba(156,163,175,0.1)]"
                />
              );
            }
          })}
        </div>
      </div>

      <div className="w-full px-5 py-4 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col gap-3 transition-theme">
        <div className="flex items-center justify-between gap-4 w-full">
          <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] min-w-[34px]">
            {formatTime(currentTime)}
          </span>

          <div 
            ref={progressBarRef}
            onClick={handleTimelineClick}
            className="flex-1 h-2 relative rounded-shape-xs bg-[var(--surface-subtle)] overflow-hidden cursor-pointer group"
          >
            <div 
              style={{ width: `${(currentTime / mixDuration) * 100}%` }}
              className="absolute left-0 top-0 h-full bg-accent rounded-shape-xs shadow-[0_0_10px_rgba(156,163,175,0.7)]"
            />
            <div 
              style={{ left: `calc(${(currentTime / mixDuration) * 100}% - 4px)` }}
              className="absolute top-0 w-2 h-2 rounded-shape-xs bg-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            />
          </div>

          <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] min-w-[34px]">
            {formatTime(mixDuration)}
          </span>
        </div>

        <div className="flex items-center justify-between w-full pt-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMute}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-shape-sm bg-transparent border border-transparent transition-theme hover:bg-[var(--surface-inset)] flex items-center justify-center text-[var(--text-muted)] hover:text-accent touch-target-44"
              title={isMuted ? (dir === 'rtl' ? 'إلغاء كتم الصوت' : 'Unmute') : (dir === 'rtl' ? 'كتم الصوت' : 'Mute')}
            >
              <Volume2 size={16} className={isMuted ? 'text-[var(--text-muted)] line-through' : 'text-accent'} />
            </button>

            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1 rounded-shape-sm accent-accent bg-[var(--surface-subtle)] cursor-pointer"
            />
          </div>

          <div className="hidden sm:flex flex-col text-center">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest leading-none">
              {styleName} • {vocalName}
            </span>
            <span className="text-[8px] text-[var(--text-muted)] font-mono mt-0.5">
              {durationVal} SECONDS / 16-BIT PCM WAV
            </span>
          </div>

          {audioUrl && status === 'ready' ? (
            <a 
              href={audioUrl}
              download={`perplexta_song_${styleName.toLowerCase()}_${durationVal}s.wav`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-shape-sm bg-accent/10 border border-accent/20 text-[10px] font-black uppercase text-accent hover:bg-accent hover:text-white transition-theme group/down shadow-md"
              title={dir === 'rtl' ? 'تنزيل الأغنية بصيغة WAV' : 'Download fully-mastered WAV track'}
            >
              <Download size={12} className="group-hover/down:translate-y-0.5 transition-transform duration-300" />
              <span>{dir === 'rtl' ? 'تنزيل المسار الرئيسي' : 'DOWNLOAD MASTER'}</span>
            </a>
          ) : (
            <button 
              disabled
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-shape-sm bg-transparent border border-[var(--border-default)] text-[10px] font-black uppercase text-[var(--text-muted)] opacity-50"
            >
              <Loader2 size={12} className="animate-spin" />
              <span>{dir === 'rtl' ? 'تجهيز التحميل' : 'COMPILING...'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full px-5 py-4 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm flex flex-col gap-4 transition-theme">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute inset-0 bg-accent rounded-shape-xs blur-[6px] opacity-15 animate-pulse" />
              <Sliders size={16} className="text-accent relative " />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-1">
                {dir === 'rtl' ? 'مستودع هندسة وتوليف الصوت' : 'STUDIO PRODUCTION MIXER'}
              </span>
              <h5 className="text-[12px] font-bold text-[var(--text-primary)] leading-none">
                {dir === 'rtl' ? 'دمج المسارات والملفات المحلية' : 'Multi-Channel Live Web Audio Console'}
              </h5>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsMixerExpanded(!isMixerExpanded)}
            className="text-[10px] font-black text-[var(--text-muted)] hover:text-accent uppercase tracking-wider transition-colors pt-1"
          >
            {isMixerExpanded 
              ? (dir === 'rtl' ? 'طي اللوحة' : 'COLLAPSE PANEL') 
              : (dir === 'rtl' ? 'توسيع ومزج الملفات' : 'EXPAND & MIX')}
          </button>
        </div>

        {isMixerExpanded && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {dir === 'rtl' ? 'تحميل مسار خارجي / صوت مضاف' : 'UPLOAD COMPANION/VOCAL TRACK'}
                </span>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-shape-md p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-theme ${
                    uploadedFile 
                      ? 'border-accent/30 bg-accent/[0.02]' 
                      : isDragging 
                        ? 'border-accent bg-accent/[0.04]' 
                        : 'border-[var(--border-default)] hover:border-accent/40 hover:bg-accent/[0.01]'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="audio/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden" 
                  />

                  {uploadedFile ? (
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      <div className="flex items-center gap-2 text-accent">
                        <Check size={16} />
                        <span className="text-[11px] font-bold truncate max-w-[180px]">{uploadedFile.name}</span>
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {formatTime(uploadedDuration)} • {uploadedFile.type.split('/')[1]?.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUploadedFile();
                        }}
                        className="mt-1.5 px-2 py-1 rounded-shape-xs bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 hover:bg-red-500 hover:text-white transition-theme uppercase"
                      >
                        {dir === 'rtl' ? 'إزالة الملف' : 'REMOVE TRACK'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Paperclip 
                        size={18} 
                        className={`transition-theme ${
                          isDragging ? 'text-accent ' : 'text-gray-400'
                        }`} 
                      />
                      <div className="flex flex-col gap-0.5 animate-pulse">
                        <span className="text-[11px] font-bold text-[var(--text-primary)]">
                          {dir === 'rtl' ? 'اسحب وأفلت الملف الصوتي هنا' : 'Drag & drop companion audio'}
                        </span>
                        <span className="text-[9px] text-[var(--text-muted)]">
                          {dir === 'rtl' ? 'أو انقر للتصفح من جهازك (MP3, WAV, M4A)' : 'or click to browse local files (MP3, WAV, M4A)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 justify-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {dir === 'rtl' ? 'لوحة التحكم بمستويات الصوت (دمج حي)' : 'CHANNEL MIXER CONTROLS'}
                </span>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                      <Sparkles size={11} className="text-accent" />
                      {dir === 'rtl' ? 'قناة الذكاء الاصطناعي (مورث)' : 'AI Synthesized Stem'}
                    </span>
                    <span className="font-mono text-accent font-bold">
                      {Math.round(aiVolume * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    disabled={status !== 'ready'}
                    value={aiVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAiVolume(val);
                      if (aiGainNodeRef.current) {
                        aiGainNodeRef.current.gain.setValueAtTime(val, audioCtxRef.current?.currentTime || 0);
                      }
                    }}
                    className="w-full h-1.5 rounded-shape-sm accent-accent bg-[var(--surface-subtle)] cursor-pointer disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                      <Paperclip size={11} className={uploadedFile ? 'text-accent' : 'text-gray-500'} />
                      {dir === 'rtl' ? 'القناة المضافة الخارجية' : 'External Companion Stem'}
                    </span>
                    <span className={`font-mono font-bold ${uploadedFile ? 'text-accent' : 'text-gray-500'}`}>
                      {uploadedFile ? `${Math.round(uploadedVolume * 100)}%` : (dir === 'rtl' ? 'غير نشط' : 'INACTIVE')}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    disabled={!uploadedFile}
                    value={uploadedVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setUploadedVolume(val);
                      if (uploadedGainNodeRef.current) {
                        uploadedGainNodeRef.current.gain.setValueAtTime(val, audioCtxRef.current?.currentTime || 0);
                      }
                    }}
                    className="w-full h-1.5 rounded-shape-sm accent-accent bg-[var(--surface-subtle)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] text-[10px] text-[var(--text-muted)] font-medium leading-normal">
              <div className="w-1.5 h-1.5 rounded-shape-full bg-accent animate-pulse shrink-0" />
              <span>
                {dir === 'rtl' 
                  ? 'بروتوكول ويب أوديو (Web Audio API) يقوم بدمج المسارين في بث واحد فائق الدقة ٢٤ بت بالوقت الفعلي.' 
                  : 'High-fidelity 24-bit real-time digital mixing pipeline driven entirely by your browser Web Audio API.'
                }
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full px-5 py-4 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm flex flex-col gap-4 transition-theme">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute inset-0 bg-accent rounded-shape-xs blur-[6px] opacity-15 animate-pulse" />
              <Music size={16} className="text-accent relative " />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-1">
                {dir === 'rtl' ? 'توليد الموسيقى الذكي عبر Google Lyria' : 'GOOGLE LYRIA AI MUSIC GENERATOR'}
              </span>
              <h5 className="text-[12px] font-bold text-[var(--text-primary)] leading-none">
                {dir === 'rtl' ? 'إنتاج مقاطع موسيقية حقيقية بالذكاء الاصطناعي' : 'Generate Real Professional Music and Audio Tracks'}
              </h5>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsLyriaPanelExpanded(!isLyriaPanelExpanded)}
            className="text-[10px] font-black text-[var(--text-muted)] hover:text-accent uppercase tracking-wider transition-colors pt-1"
          >
            {isLyriaPanelExpanded 
              ? (dir === 'rtl' ? 'إغلاق اللوحة' : 'CLOSE STUDIO') 
              : (dir === 'rtl' ? 'افتح أستوديو التوليد' : 'OPEN AI STUDIO')}
          </button>
        </div>

        {isLyriaPanelExpanded && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {dir === 'rtl' ? 'المطالبة الصوتية الإبداعية' : 'SONIC PROMPT INSTRUCTIONS'}
              </label>
              <textarea
                value={lyriaPrompt}
                onChange={(e) => setLyriaPrompt(e.target.value)}
                placeholder={dir === 'rtl' ? 'مثال: معزوفة عود هادئة مع قانون وإيقاع شرقي كلاسيكي...' : 'e.g. A serene acoustic guitar track with soft violin ambient backing...'}
                className="w-full min-h-[70px] rounded-shape-sm border border-[var(--border-default)] bg-transparent py-2.5 px-3 text-xs focus:outline-none focus:border-accent transition-colors leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {dir === 'rtl' ? 'الكلمات المرافقة (اختياري)' : 'SONG LYRICS (OPTIONAL)'}
              </label>
              <textarea
                value={lyriaLyrics}
                onChange={(e) => setLyriaLyrics(e.target.value)}
                placeholder={dir === 'rtl' ? 'اكتب كلمات الأغنية ليقوم الذكاء الاصطناعي بغنائها أو دمجها...' : 'Write lyrics for the AI model to sing or voice...'}
                className="w-full min-h-[50px] rounded-shape-sm border border-[var(--border-default)] bg-transparent py-2.5 px-3 text-xs focus:outline-none focus:border-accent transition-colors leading-relaxed"
              />
            </div>

            {lyriaError && (
              <div className="p-3 rounded-shape-sm border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{lyriaError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-1">
              {generatedAudioBase64 && (
                <button
                  type="button"
                  onClick={handleSaveTrackToLibrary}
                  disabled={isSavingTrack || isTrackSaved}
                  className="py-2 px-3.5 rounded-shape-xs border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
                >
                  {isSavingTrack ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{dir === 'rtl' ? 'جاري الحفظ...' : 'SAVING...'}</span>
                    </>
                  ) : isTrackSaved ? (
                    <>
                      <Check size={13} className="text-[var(--fg-success)]" />
                      <span>{dir === 'rtl' ? 'تم الحفظ في مكتبتك' : 'SAVED TO LIBRARY'}</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      <span>{dir === 'rtl' ? 'حفظ في مكتبة الملفات' : 'SAVE TO LIBRARY'}</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateLyria}
                disabled={isLyriaGenerating || !lyriaPrompt.trim()}
                className={`py-2 px-4 rounded-shape-xs bg-[var(--comp-button-primary-bg)] hover:bg-[var(--comp-button-primary-bg)]/90 text-[var(--comp-button-primary-fg)] border border-[var(--border-default)] font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs active:scale-98 touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-[''] ${
                  isLyriaGenerating ? 'animate-pulse' : ''
                }`}
              >
                {isLyriaGenerating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{dir === 'rtl' ? 'جاري توليد اللحن الفني...' : 'ORCHESTRATING MUSIC...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>{dir === 'rtl' ? 'توليد المسار الفني بالذكاء الاصطناعي' : 'GENERATE AI TRACK NOW'}</span>
                  </>
                )}
              </button>
            </div>

            {lyriaLyricsResponse && (
              <div className="mt-2 p-4 rounded-shape-sm border border-accent/10 bg-accent/[0.01] flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">{dir === 'rtl' ? 'كلمات الأغنية المولدة من الذكاء الاصطناعي' : 'AI GENERATED LYRICS & TRANSCRIPT'}</span>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans italic">
                  {lyriaLyricsResponse}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
