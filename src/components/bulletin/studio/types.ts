export interface VisualTrack {
  id: string;
  sourceType: 'image' | 'video';
  url: string;
  duration: number; // in seconds
  animation?: 'ken_burns_zoom_in' | 'ken_burns_pan_right' | 'none';
  trim?: { start: number; end: number };
  aspectRatio: '9:16' | '1:1' | '16:9';
  file?: File;
}

export interface AudioTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  author?: string;
  waveformUrl?: string;
  duration: number;
  seekStart: number;    // start offset in seconds
  playDuration: number; // play duration matching target video
  volume: number;       // 0.0 to 1.0
  loop?: boolean;
}

export interface MediaProjectState {
  visual: VisualTrack | null;
  originalAudioVolume: number; // 0.0 to 1.0 (for video original sound)
  musicTrack: AudioTrack | null;
  coverTimestamp: number;      // chosen cover frame timestamp in seconds
  coverDataUrl?: string;       // base64 thumbnail of selected frame
  targetAspectRatio: '9:16' | '1:1' | '16:9';
  outputDuration: number;      // default 15s for images or video length
  caption: string;
  mediaFormat: 'post' | 'reel' | 'story';
}

export interface CompositionSchema {
  projectId: string;
  userId?: string;
  type: 'image_to_video' | 'video_with_audio' | 'video_only' | 'image_only';
  duration: number;
  visual: {
    sourceUrl: string;
    cropMode: '9:16' | '1:1' | '16:9';
    animation: 'ken_burns_zoom_in' | 'ken_burns_pan_right' | 'none';
  };
  audio?: {
    sourceUrl: string;
    title?: string;
    artist?: string;
    startTime: number;
    volume: number;
    originalAudioVolume?: number;
  };
  coverTimestamp?: number;
}
