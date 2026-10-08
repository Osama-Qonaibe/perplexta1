// Sovereign RATAQ Studio Comprehensive Design Catalog
// Massive Self-Hosted Embedded Assets: Fonts, Stock Media, Backgrounds, Color Harmonies, Elements, Badges & Animations

export interface StudioFontItem {
  id: string;
  name: string;
  fontFamily: string;
  category: 'arabic' | 'english' | 'kufi' | 'naskh' | 'display' | 'modern';
  previewAr: string;
  previewEn: string;
  badge?: string;
  isPopular?: boolean;
}

export interface StudioPhotoItem {
  id: string;
  titleAr: string;
  titleEn: string;
  url: string;
  category: 'business' | 'nature' | 'tech' | 'marketing' | 'abstract' | 'people' | 'food' | 'luxury';
}

export interface StudioBackgroundItem {
  id: string;
  titleAr: string;
  titleEn: string;
  type: 'color' | 'gradient' | 'texture' | 'image';
  category: 'tech' | 'ai' | 'wallpaper' | 'abstract' | 'gradient' | 'nature' | 'solid' | 'luxury' | 'texture' | 'trending';
  value: string; // Hex, linear-gradient, or image URL
  previewBg: string;
  thumbnailUrl?: string;
  isTrending?: boolean;
  tags?: string[];
}

export interface StudioPaletteItem {
  id: string;
  titleAr: string;
  titleEn: string;
  colors: string[];
}

export interface StudioElementItem {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'social' | 'frames' | 'app_icons' | 'shapes' | 'badges' | 'stickers';
  type: 'svg' | 'sticker' | 'shape';
  svgPath?: string;
  viewBox?: string;
  defaultColor?: string;
  imgUrl?: string;
}

export interface StudioEffectPreset {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  descriptionAr: string;
}

export interface StudioAnimationPreset {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  previewClass: string;
  descriptionAr: string;
}

// 1. Comprehensive Professional Fonts Catalog (Arabic & Global)
export const STUDIO_FONTS: StudioFontItem[] = [
  // Arabic Modern & Geometric
  { id: 'tajawal', name: 'Tajawal', fontFamily: 'Tajawal, sans-serif', category: 'arabic', previewAr: 'أبجد هوز حطي كلمن', previewEn: 'Modern Tajawal Typography', badge: 'شائع', isPopular: true },
  { id: 'cairo', name: 'Cairo', fontFamily: 'Cairo, sans-serif', category: 'arabic', previewAr: 'رينكس للإبداع والتصميم', previewEn: 'Bold Geometric Cairo', badge: 'هندسي', isPopular: true },
  { id: 'alexandria', name: 'Alexandria', fontFamily: 'Alexandria, sans-serif', category: 'modern', previewAr: 'تصميم عصري فائق الدقة', previewEn: 'Ultra Clean Alexandria', badge: 'عصري', isPopular: true },
  { id: 'almarai', name: 'Almarai', fontFamily: 'Almarai, sans-serif', category: 'arabic', previewAr: 'الخط الرسمي للأعمال', previewEn: 'Corporate Clear Almarai', badge: 'رسمي', isPopular: true },
  { id: 'readex-pro', name: 'Readex Pro', fontFamily: "'Readex Pro', sans-serif", category: 'modern', previewAr: 'مقروئية ذكية متقدمة للواجهات', previewEn: 'Next-Gen Readex Pro', badge: 'تقني', isPopular: true },
  { id: 'ibm-plex', name: 'IBM Plex Arabic', fontFamily: "'IBM Plex Sans Arabic', sans-serif", category: 'modern', previewAr: 'معايير تقنية عالمية للشركات', previewEn: 'Enterprise Grade Plex', badge: 'احترافي', isPopular: true },
  { id: 'rubik', name: 'Rubik', fontFamily: 'Rubik, sans-serif', category: 'modern', previewAr: 'حواف مستديرة ناعمة ومريحة', previewEn: 'Soft Rounded Rubik', badge: 'ناعم' },

  // Arabic Kufic Heritage
  { id: 'reem-kufi', name: 'Reem Kufi', fontFamily: "'Reem Kufi', sans-serif", category: 'kufi', previewAr: 'الخط الكوفي التراثي المطور', previewEn: 'Heritage Kufic Structure', badge: 'كوفي', isPopular: true },
  { id: 'noto-kufi', name: 'Noto Kufi Arabic', fontFamily: "'Noto Kufi Arabic', sans-serif", category: 'kufi', previewAr: 'كوفي رقمي حديث للعناوين', previewEn: 'Digital Clean Kufi', badge: 'كوفي' },
  { id: 'el-messiri', name: 'El Messiri', fontFamily: "'El Messiri', sans-serif", category: 'kufi', previewAr: 'لمسات فنية راقية للمناسبات', previewEn: 'Elegant Curves El Messiri', badge: 'فني' },

  // Arabic Naskh & Calligraphy Heritage
  { id: 'amiri', name: 'Amiri', fontFamily: 'Amiri, serif', category: 'naskh', previewAr: 'خط النسخ والقرآن الأصيل', previewEn: 'Authentic Classical Amiri', badge: 'نَسخ', isPopular: true },
  { id: 'aref-ruqaa', name: 'Aref Ruqaa', fontFamily: "'Aref Ruqaa', serif", category: 'naskh', previewAr: 'فن الرقعة العربي الكلاسيكي', previewEn: 'Artistic Ruqaa Script', badge: 'رُقعة', isPopular: true },
  { id: 'lateef', name: 'Lateef', fontFamily: 'Lateef, cursive', category: 'naskh', previewAr: 'خط عربي كلاسيكي شاعري', previewEn: 'Poetic Fluid Lateef', badge: 'شاعري' },
  { id: 'noto-sans', name: 'Noto Sans Arabic', fontFamily: "'Noto Sans Arabic', sans-serif", category: 'arabic', previewAr: 'وضوح فائق لكافة الشاشات', previewEn: 'Crisp Global Noto', badge: 'واضح' },

  // Arabic Display & Bold Posters
  { id: 'changa', name: 'Changa', fontFamily: 'Changa, sans-serif', category: 'display', previewAr: 'عناوين بارزة وقوية للبوسترات', previewEn: 'Ultra Heavy Changa', badge: 'عريض', isPopular: true },
  { id: 'lalezar', name: 'Lalezar', fontFamily: 'Lalezar, cursive', category: 'display', previewAr: 'طابع إعلاني جذاب وملصقات', previewEn: 'Bold Poster Lalezar', badge: 'إعلاني', isPopular: true },
  { id: 'marhey', name: 'Marhey', fontFamily: 'Marhey, cursive', category: 'display', previewAr: 'خط مرح وعفوي للمحتوى', previewEn: 'Playful Modern Marhey', badge: 'مرح' },

  // English & Global Typography
  { id: 'inter', name: 'Inter', fontFamily: 'Inter, sans-serif', category: 'english', previewAr: 'Inter Global Sans', previewEn: 'The Standard Modern Interface', badge: 'Modern', isPopular: true },
  { id: 'montserrat', name: 'Montserrat', fontFamily: 'Montserrat, sans-serif', category: 'english', previewAr: 'Montserrat Heavy', previewEn: 'Geometric Clean Architecture', badge: 'Clean', isPopular: true },
  { id: 'poppins', name: 'Poppins', fontFamily: 'Poppins, sans-serif', category: 'english', previewAr: 'Poppins Rounded', previewEn: 'Friendly Geometric Curves', badge: 'Trendy', isPopular: true },
  { id: 'playfair', name: 'Playfair Display', fontFamily: "'Playfair Display', serif", category: 'english', previewAr: 'Playfair Luxury', previewEn: 'High Fashion & Luxury Serif', badge: 'Luxury', isPopular: true },
  { id: 'bebas-neue', name: 'Bebas Neue', fontFamily: "'Bebas Neue', sans-serif", category: 'english', previewAr: 'BEBAS ALL CAPS', previewEn: 'POWERFUL COMPACT HEADLINES', badge: 'Caps', isPopular: true },
  { id: 'cinzel', name: 'Cinzel', fontFamily: 'Cinzel, serif', category: 'english', previewAr: 'Cinzel Royal', previewEn: 'Classical Roman Inscriptional', badge: 'Royal', isPopular: true },
  { id: 'pacifico', name: 'Pacifico', fontFamily: 'Pacifico, cursive', category: 'english', previewAr: 'Pacifico Script', previewEn: 'Fun Hand-drawn Brush Script', badge: 'Brush' }
];

// 2. Curated Stock Photography Catalog
export const STUDIO_PHOTOS: StudioPhotoItem[] = [
  { id: 'ph-biz-1', titleAr: 'اجتماع أعمال وتقنية', titleEn: 'Business Meeting Tech', category: 'business', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-biz-2', titleAr: 'فريق عمل احترافي', titleEn: 'Creative Team Workspace', category: 'business', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-biz-3', titleAr: 'تحليلات وإحصاءات وبيانات', titleEn: 'Analytics Dashboard Data', category: 'business', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-biz-4', titleAr: 'برج أعمال عصري', titleEn: 'Modern Skyscraper Architecture', category: 'business', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' },
  
  { id: 'ph-tech-1', titleAr: 'ذكاء اصطناعي وبرمجة', titleEn: 'AI & Future Technology', category: 'tech', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-tech-2', titleAr: 'أجهزة ذكية ومكتب متطور', titleEn: 'Minimalist Workspace Setup', category: 'tech', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-tech-3', titleAr: 'شبكات بيانات سحابية', titleEn: 'Cloud Network Abstract', category: 'tech', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-tech-4', titleAr: 'رقائق ومعالجة دقيقة', titleEn: 'Microchip Neural Network', category: 'tech', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80' },

  { id: 'ph-nat-1', titleAr: 'غروب جبال ذهبي', titleEn: 'Golden Mountain Sunset', category: 'nature', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-nat-2', titleAr: 'شواطئ فيروزية هادئة', titleEn: 'Tropical Ocean Waves', category: 'nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-nat-3', titleAr: 'طبيعة خضراء نضرة', titleEn: 'Lush Forest Canopy', category: 'nature', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-nat-4', titleAr: 'صحراء وكثبان رملية ساحرة', titleEn: 'Golden Desert Dunes', category: 'nature', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80' },

  { id: 'ph-abs-1', titleAr: 'تدرجات لونية ثلاثية الأبعاد', titleEn: '3D Gradient Waves', category: 'abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-abs-2', titleAr: 'إضاءة نيون وسيرالي', titleEn: 'Cyber Neon Lights', category: 'abstract', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-abs-3', titleAr: 'رخام ذهبي ملكي فاخر', titleEn: 'Luxury Dark Gold Marble', category: 'abstract', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { id: 'ph-abs-4', titleAr: 'حركات هندسية ثلاثية الأبعاد', titleEn: 'Abstract Modern Geometry', category: 'abstract', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80' }
];

// 3. Studio Backgrounds & Wallpapers Library (Massive Curated Stock: AI, Tech, Wallpapers, Textures, 3D, Space, Gradients & Luxury)
export const STUDIO_BACKGROUNDS: StudioBackgroundItem[] = [
  // 1. AI & Cybernetic Digital Art (الذكاء الاصطناعي والمستقبل)
  { id: 'bg-ai-neural-1', titleAr: 'شبكات عصبية وذكاء اصطناعي', titleEn: 'Neural AI Synapses Matrix', type: 'image', category: 'ai', isTrending: true, tags: ['ai', 'neural', 'tech', 'future'], value: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-ai-core-2', titleAr: 'نواة المعالجة السحابية والذكاء', titleEn: 'Quantum AI Core Chamber', type: 'image', category: 'ai', isTrending: true, tags: ['ai', 'quantum', 'cube'], value: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-ai-hologram-3', titleAr: 'موجات هولوغرافية وروبوتات', titleEn: 'Holographic Cyber Wave', type: 'image', category: 'ai', tags: ['hologram', 'future', 'robotics'], value: 'https://images.unsplash.com/photo-1633493106185-055c0e70a1a4?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1633493106185-055c0e70a1a4?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-ai-matrix-4', titleAr: 'مصفوفة بيانات خوارزمية', titleEn: 'Algorithmic Data Grid', type: 'image', category: 'ai', tags: ['matrix', 'ai', 'data'], value: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-ai-synapse-5', titleAr: 'توهج عصبوني أزرق عميق', titleEn: 'Deep Blue Synapse Glow', type: 'image', category: 'ai', tags: ['blue', 'brain', 'ai'], value: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=320&q=80' },

  // 2. Technology & Code Streams (التكنولوجيا والبرمجة)
  { id: 'bg-tech-code-1', titleAr: 'شيفرات برمجية وشاشات مطورين', titleEn: 'Developer Code Matrix', type: 'image', category: 'tech', isTrending: true, tags: ['code', 'programming', 'developer'], value: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-tech-fiber-2', titleAr: 'ألياف ضوئية فائقة السرعة', titleEn: 'Ultra Speed Fiber Optics', type: 'image', category: 'tech', tags: ['fiber', 'internet', 'speed'], value: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-tech-chips-3', titleAr: 'لوحة دارات إلكترونية ورقائق', titleEn: 'Microchip Neural Circuit', type: 'image', category: 'tech', tags: ['hardware', 'chips', 'gold'], value: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-tech-cloud-4', titleAr: 'سحابة بيانات وشبكات عالمية', titleEn: 'Global Cloud Network Earth', type: 'image', category: 'tech', tags: ['cloud', 'network', 'server'], value: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-tech-dark-5', titleAr: 'مكتب تكنولوجي داكن وبسيط', titleEn: 'Minimal Dark Tech Workspace', type: 'image', category: 'tech', tags: ['minimal', 'laptop', 'workspace'], value: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=320&q=80' },

  // 3. Wallpapers & Aesthetic Surfaces (ورق حائط وخامات ديكور)
  { id: 'bg-wall-calacatta-1', titleAr: 'رخام كالاكاتا ملكي أسود وذهب', titleEn: 'Royal Calacatta Black Gold Marble', type: 'image', category: 'wallpaper', isTrending: true, tags: ['marble', 'luxury', 'gold'], value: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-wall-carrara-2', titleAr: 'رخام كرارا أبيض ناصع إيطالي', titleEn: 'Italian White Carrara Marble', type: 'image', category: 'wallpaper', tags: ['marble', 'white', 'clean'], value: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-wall-silk-3', titleAr: 'حرير ستان مموج ناعم', titleEn: 'Wavy Royal Silk Fabric', type: 'image', category: 'wallpaper', tags: ['silk', 'cloth', 'smooth'], value: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-wall-geometric-4', titleAr: 'نقوش هندسية ثلاثية الأبعاد', titleEn: '3D Geometric Gold Pattern', type: 'image', category: 'wallpaper', tags: ['geometric', 'islamic', 'pattern'], value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-wall-carbon-5', titleAr: 'ألياف كربون سوداء عصرية', titleEn: 'Dark Carbon Fiber Weave', type: 'image', category: 'wallpaper', tags: ['carbon', 'dark', 'sport'], value: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=320&q=80' },

  // 4. Textures & Surfaces (ملمس وخامات واقعية)
  { id: 'bg-tex-concrete-1', titleAr: 'خرسانة معمارية رمادية حديثة', titleEn: 'Modern Grey Studio Concrete', type: 'image', category: 'texture', tags: ['concrete', 'minimal', 'urban'], value: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-tex-wood-2', titleAr: 'خشب طبيعي داكن ودافئ', titleEn: 'Dark Warm Cedar Wood Plank', type: 'image', category: 'texture', tags: ['wood', 'organic', 'warm'], value: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-tex-paper-3', titleAr: 'ورق يدوي عتيق وفاخر', titleEn: 'Artisan Handmade Paper Texture', type: 'image', category: 'texture', tags: ['paper', 'vintage', 'craft'], value: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-tex-leather-4', titleAr: 'جلد طبيعي أسود إيطالي', titleEn: 'Italian Black Leather Grain', type: 'image', category: 'texture', tags: ['leather', 'luxury', 'fashion'], value: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=320&q=80' },

  // 5. 3D Abstract & Glassmorphism (تجريدي ثلاثي الأبعاد وإضاءات ستوديو)
  { id: 'bg-abs-liquid-1', titleAr: 'أمواج ثلاثية الأبعاد سائلة وفضية', titleEn: '3D Liquid Chrome Metal Waves', type: 'image', category: 'abstract', isTrending: true, tags: ['3d', 'liquid', 'chrome'], value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-abs-spheres-2', titleAr: 'كرات زجاجية وإضاءات باستيل', titleEn: 'Glass Spheres Studio Light', type: 'image', category: 'abstract', tags: ['glass', 'pastel', 'spheres'], value: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-abs-prism-3', titleAr: 'انكسار ضوئي ليزري متعدد الألوان', titleEn: 'Laser Prism Refraction Spectrum', type: 'image', category: 'abstract', tags: ['prism', 'rainbow', 'glow'], value: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-abs-violet-4', titleAr: 'أثير كوني بنفسجي وإضاءة ناعمة', titleEn: 'Violet Ether Glow Nebula', type: 'image', category: 'abstract', tags: ['violet', 'purple', 'glow'], value: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=320&q=80' },

  // 6. Nature, Oceans & Deep Space (الطبيعة والمحيطات والفضاء)
  { id: 'bg-nat-galaxy-1', titleAr: 'شفق الفضاء والنجوم الساحرة', titleEn: 'Deep Nebula Stars Cosmos', type: 'image', category: 'nature', isTrending: true, tags: ['space', 'galaxy', 'stars'], value: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-nat-ocean-2', titleAr: 'أمواج المحيط الفيروزية الشفافة', titleEn: 'Tropical Turquoise Ocean Wave', type: 'image', category: 'nature', tags: ['ocean', 'sea', 'water'], value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-nat-desert-3', titleAr: 'كثبان الصحراء الذهبية وقت الغروب', titleEn: 'Golden Sunset Sahara Dunes', type: 'image', category: 'nature', tags: ['desert', 'sand', 'gold'], value: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-nat-forest-4', titleAr: 'غابة صنوبر ضبابية هادئة', titleEn: 'Misty Alpine Pine Forest', type: 'image', category: 'nature', tags: ['forest', 'trees', 'mist'], value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=320&q=80' },

  // 7. Luxury, Gold & Royal Branding (الفخامة والذهب والعلامات التجارية)
  { id: 'bg-lux-gold-1', titleAr: 'بريق الذهب الأسود الملكي', titleEn: 'Imperial Black & Gold Lustre', type: 'image', category: 'luxury', isTrending: true, tags: ['gold', 'luxury', 'black'], value: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-lux-emerald-2', titleAr: 'عقيق زمردي داكن فاخر', titleEn: 'Dark Emerald Gemstone Velvet', type: 'image', category: 'luxury', tags: ['emerald', 'green', 'gem'], value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=320&q=80' },
  { id: 'bg-lux-crimson-3', titleAr: 'مخمل أحمر ملكي للعروض', titleEn: 'Imperial Velvet Crimson Theatre', type: 'image', category: 'luxury', tags: ['crimson', 'red', 'royal'], value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=85', previewBg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=320&q=80' },

  // 8. Ultra Modern Mesh & Dynamic Gradients (التدرجات العصرية)
  { id: 'bg-grad-sunset', titleAr: 'شروق الشمس الذهبي', titleEn: 'Vivid Golden Sunset', type: 'gradient', category: 'gradient', isTrending: true, tags: ['orange', 'red', 'warm'], value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', previewBg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { id: 'bg-grad-cyber', titleAr: 'نيون سايبر بنفسجي ووردي', titleEn: 'Cyber Neon Violet Pink', type: 'gradient', category: 'gradient', isTrending: true, tags: ['neon', 'cyber', 'purple'], value: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', previewBg: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
  { id: 'bg-grad-ocean', titleAr: 'أزرق المحيط والفيروزي', titleEn: 'Ocean Horizon Blue', type: 'gradient', category: 'gradient', tags: ['blue', 'cyan', 'water'], value: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)', previewBg: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)' },
  { id: 'bg-grad-gold', titleAr: 'الذهب الملكي الداكن', titleEn: 'Royal Obsidian Gold', type: 'gradient', category: 'gradient', tags: ['gold', 'dark', 'luxury'], value: 'linear-gradient(135deg, #18181b 0%, #78350f 50%, #f59e0b 100%)', previewBg: 'linear-gradient(135deg, #18181b 0%, #78350f 50%, #f59e0b 100%)' },
  { id: 'bg-grad-mesh', titleAr: 'تدرج ضبابي حديث (Mesh Glow)', titleEn: 'Modern Studio Mesh Blur', type: 'gradient', category: 'gradient', isTrending: true, tags: ['mesh', 'dark', 'blur'], value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)', previewBg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)' },
  { id: 'bg-grad-aurora', titleAr: 'الشفق القطبي الأخضر والأزرق', titleEn: 'Aurora Borealis Emerald Sky', type: 'gradient', category: 'gradient', tags: ['aurora', 'green', 'sky'], value: 'linear-gradient(135deg, #052e16 0%, #065f46 40%, #0ea5e9 100%)', previewBg: 'linear-gradient(135deg, #052e16 0%, #065f46 40%, #0ea5e9 100%)' },
  { id: 'bg-grad-space', titleAr: 'نيبولا فضائية ليلية عميقة', titleEn: 'Deep Night Cosmic Nebula', type: 'gradient', category: 'gradient', tags: ['space', 'midnight', 'purple'], value: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)', previewBg: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)' },
  { id: 'bg-grad-pastel', titleAr: 'باستيل زهري ناعم وهادئ', titleEn: 'Soft Pastel Cotton Blush', type: 'gradient', category: 'gradient', tags: ['pastel', 'pink', 'soft'], value: 'linear-gradient(135deg, #fce7f3 0%, #e0e7ff 100%)', previewBg: 'linear-gradient(135deg, #fce7f3 0%, #e0e7ff 100%)' },

  // 9. Minimalist Studio Solids (ألوان الستوديو النقية)
  { id: 'bg-white', titleAr: 'أبيض استوديو ناصع', titleEn: 'Pure Studio White', type: 'color', category: 'solid', tags: ['white', 'clean', 'pure'], value: '#ffffff', previewBg: '#ffffff' },
  { id: 'bg-dark', titleAr: 'أسود فحمي فاخر', titleEn: 'Midnight Carbon Dark', type: 'color', category: 'solid', isTrending: true, tags: ['black', 'dark', 'midnight'], value: '#0a0d14', previewBg: '#0a0d14' },
  { id: 'bg-cream', titleAr: 'بيج كلاسيكي دافئ', titleEn: 'Warm Artisan Cream', type: 'color', category: 'solid', tags: ['cream', 'beige', 'warm'], value: '#faf8f5', previewBg: '#faf8f5' },
  { id: 'bg-slate', titleAr: 'رمادي ستوديو احترافي', titleEn: 'Pro Slate Graphite', type: 'color', category: 'solid', tags: ['slate', 'grey'], value: '#1e293b', previewBg: '#1e293b' },
  { id: 'bg-emerald', titleAr: 'زمردي عميق راقي', titleEn: 'Imperial Deep Emerald', type: 'color', category: 'solid', tags: ['green', 'emerald'], value: '#064e3b', previewBg: '#064e3b' },
  { id: 'bg-indigo', titleAr: 'نيلي ملكي هادئ', titleEn: 'Royal Indigo Blue', type: 'color', category: 'solid', tags: ['indigo', 'blue'], value: '#312e81', previewBg: '#312e81' },
  { id: 'bg-crimson', titleAr: 'عنابي مخملي فاخر', titleEn: 'Deep Burgundy Crimson', type: 'color', category: 'solid', tags: ['crimson', 'red'], value: '#881337', previewBg: '#881337' },
  { id: 'bg-titanium', titleAr: 'تيتانيوم رمادي صناعي', titleEn: 'Industrial Titanium Grey', type: 'color', category: 'solid', tags: ['titanium', 'grey'], value: '#334155', previewBg: '#334155' }
];

// 4. Curated Color Palettes Catalog
export const STUDIO_PALETTES: StudioPaletteItem[] = [
  { id: 'pal-brand', titleAr: 'لوحة هوية رينكس', titleEn: 'Rinex Brand Core', colors: ['#6366f1', '#4f46e5', '#38bdf8', '#10b981', '#f59e0b', '#0f172a'] },
  { id: 'pal-neon', titleAr: 'النيون العصري (Cyberpunk)', titleEn: 'Cyberpunk Neon', colors: ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#facc15', '#09090b'] },
  { id: 'pal-gold', titleAr: 'الفخامة والذهب الملكي', titleEn: 'Luxury Dark Gold', colors: ['#d97706', '#f59e0b', '#fbbf24', '#78350f', '#1c1917', '#ffffff'] },
  { id: 'pal-pastel', titleAr: 'الباستيل الهادئ الرقيق', titleEn: 'Soft Pastel Serene', colors: ['#fbcfe8', '#ddd6fe', '#bae6fd', '#bbf7d0', '#fef08a', '#475569'] },
  { id: 'pal-corporate', titleAr: 'الشركات والأعمال', titleEn: 'Corporate Blue & Slate', colors: ['#1e40af', '#2563eb', '#38bdf8', '#64748b', '#0f172a', '#f8fafc'] },
  { id: 'pal-earth', titleAr: 'الطبيعة والأرض', titleEn: 'Earthy Organic Forest', colors: ['#065f46', '#047857', '#34d399', '#854d0e', '#fef3c7', '#292524'] },
  { id: 'pal-sunset', titleAr: 'شروق وغروب مشرق', titleEn: 'Vivid Sunset Glow', colors: ['#ea580c', '#f97316', '#fb923c', '#fde047', '#be123c', '#4c0519'] },
  { id: 'pal-amethyst', titleAr: 'الجمشت الملكي البنفسجي', titleEn: 'Royal Amethyst Violet', colors: ['#581c87', '#7e22ce', '#a855f7', '#d8b4fe', '#f3e8ff', '#09090b'] }
];

// 5. Studio Elements & Shapes Catalog (Icons, Frames, Badges, Vectors)
export const STUDIO_ELEMENTS: StudioElementItem[] = [
  // Social Media Icons
  { id: 'el-soc-wa', titleAr: 'واتساب', titleEn: 'WhatsApp', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#25D366', svgPath: 'M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24v-.01z' },
  { id: 'el-soc-ig', titleAr: 'انستقرام', titleEn: 'Instagram', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#E4405F', svgPath: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { id: 'el-soc-fb', titleAr: 'فيسبوك', titleEn: 'Facebook', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#1877F2', svgPath: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { id: 'el-soc-x', titleAr: 'منصة إكس (تويتر)', titleEn: 'X / Twitter', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#000000', svgPath: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { id: 'el-soc-tt', titleAr: 'تيك توك', titleEn: 'TikTok', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#000000', svgPath: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.76 1.41-.05 2.68-.97 3.13-2.3.17-.5.23-1.04.23-1.58.01-4.78.01-9.56.01-14.34z' },
  { id: 'el-soc-yt', titleAr: 'يوتيوب', titleEn: 'YouTube', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#FF0000', svgPath: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { id: 'el-soc-tg', titleAr: 'تيليجرام', titleEn: 'Telegram', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#0088cc', svgPath: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z' },
  { id: 'el-soc-li', titleAr: 'لينكد إن', titleEn: 'LinkedIn', category: 'social', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#0A66C2', svgPath: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },

  // App & UI Icons
  { id: 'el-app-star', titleAr: 'نجمة تقييم', titleEn: 'Star Rating', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#f59e0b', svgPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'el-app-check', titleAr: 'علامة توثيق صح', titleEn: 'Verified Check', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#10b981', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  { id: 'el-app-heart', titleAr: 'قلب إعجاب', titleEn: 'Heart Love', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#ef4444', svgPath: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { id: 'el-app-bell', titleAr: 'جرس تنبيهات', titleEn: 'Notification Bell', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#6366f1', svgPath: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
  { id: 'el-app-loc', titleAr: 'موقع جغرافي', titleEn: 'Location Pin', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#ec4899', svgPath: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { id: 'el-app-spark', titleAr: 'شرارة إبداع وذكاء', titleEn: 'AI Sparkle', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#f59e0b', svgPath: 'M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z' },
  { id: 'el-app-cart', titleAr: 'سلة مشتريات', titleEn: 'Shopping Cart', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#3b82f6', svgPath: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z' },
  { id: 'el-app-shield', titleAr: 'درع أمان وحماية', titleEn: 'Security Shield', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#10b981', svgPath: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },
  { id: 'el-app-rocket', titleAr: 'صاروخ انطلاق', titleEn: 'Rocket Launch', category: 'app_icons', type: 'svg', viewBox: '0 0 24 24', defaultColor: '#f97316', svgPath: 'M13.13 2.05C12.83 2.02 12.5 2 12 2s-.83.02-1.13.05c-3.13.34-5.87 2.68-6.6 5.83l-.71 3.09c-.2.87-.04 1.78.44 2.51.48.73 1.25 1.19 2.12 1.27l1.08.1v3.15c0 1.66 1.34 3 3 3h1.6c1.66 0 3-1.34 3-3V14.9l1.08-.1c.87-.08 1.64-.54 2.12-1.27.48-.73.64-1.64.44-2.51l-.71-3.09c-.73-3.15-3.47-5.49-6.6-5.83z' },

  // Marketing Badges & Ribbons
  { id: 'el-bdg-discount', titleAr: 'شارة خصم 50%', titleEn: '50% Discount Tag', category: 'badges', type: 'shape', defaultColor: '#ef4444' },
  { id: 'el-bdg-new', titleAr: 'شارة جديد (NEW)', titleEn: 'NEW Arrival Badge', category: 'badges', type: 'shape', defaultColor: '#10b981' },
  { id: 'el-bdg-best', titleAr: 'الأكثر مبيعاً (Best Seller)', titleEn: 'Best Seller Badge', category: 'badges', type: 'shape', defaultColor: '#f59e0b' },
  { id: 'el-bdg-exclusive', titleAr: 'عرض حصري VIP', titleEn: 'VIP Exclusive', category: 'badges', type: 'shape', defaultColor: '#8b5cf6' },

  // Geometric Shapes
  { id: 'el-shp-rect', titleAr: 'مستطيل بطاقة', titleEn: 'Rounded Card', category: 'shapes', type: 'shape', defaultColor: '#3b82f6' },
  { id: 'el-shp-circle', titleAr: 'دائرة ناعمة', titleEn: 'Smooth Circle', category: 'shapes', type: 'shape', defaultColor: '#8b5cf6' },
  { id: 'el-shp-badge', titleAr: 'شارة خصم نجمية', titleEn: 'Star Badge', category: 'shapes', type: 'shape', defaultColor: '#ef4444' },
  { id: 'el-shp-arrow', titleAr: 'سهم توجيه', titleEn: 'Pointer Arrow', category: 'shapes', type: 'shape', defaultColor: '#10b981' }
];

// 6. Text Effects Presets
export const STUDIO_TEXT_EFFECTS: StudioEffectPreset[] = [
  { id: 'none', titleAr: 'عادي بدون تأثير', titleEn: 'None', icon: 'Aa', descriptionAr: 'نص نقي بدون إضافات' },
  { id: 'shadow', titleAr: 'ظل بارز (Shadow)', titleEn: 'Shadow', icon: 'Shadow', descriptionAr: 'إضافة عمق وظلال خلف النص' },
  { id: 'lift', titleAr: 'توهج ورفع (Lift)', titleEn: 'Lift / Glow', icon: 'Lift', descriptionAr: 'توهج ناعم يبرز النص فوق الخلفيات' },
  { id: 'hollow', titleAr: 'مفرغ (Hollow)', titleEn: 'Hollow', icon: 'Outline', descriptionAr: 'نص مفرغ بحدود خارجية شفافة' },
  { id: 'splice', titleAr: 'انقسام مزدوج (Splice)', titleEn: 'Splice', icon: 'Splice', descriptionAr: 'تأثير إزاحة وظل لوني متباين' },
  { id: 'outline', titleAr: 'مخطط خارجي (Stroke)', titleEn: 'Outline Stroke', icon: 'Stroke', descriptionAr: 'حد خارجي عريض بلون مخصص' },
  { id: 'glitch', titleAr: 'تشويش رقمي (Glitch)', titleEn: 'Glitch Cyber', icon: 'Glitch', descriptionAr: 'إزاحة لونية حمراء وزرقاء مستوحاة من السايبر' },
  { id: 'neon', titleAr: 'نيون ساطع (Neon)', titleEn: 'Neon Glow', icon: 'Neon', descriptionAr: 'إشعاع نيون قوي وفاقع' },
  { id: 'background', titleAr: 'خلفية ملونة (Background)', titleEn: 'Text Background Box', icon: 'Box', descriptionAr: 'صندوق لوني خلف النص مع تحكم بالزوايا' },
  { id: 'curve', titleAr: 'انحناء دائري (Curve)', titleEn: 'Curved Arc', icon: 'Arc', descriptionAr: 'تقويس النص بشكل دائري مائل' }
];

// 7. Animations Catalog
export const STUDIO_ANIMATIONS: StudioAnimationPreset[] = [
  { id: 'typewriter', titleAr: 'آلة كاتبة (Typewriter)', titleEn: 'Typewriter', icon: 'Type', previewClass: 'animate-pulse', descriptionAr: 'كتابة الأحرف حرفاً بحرف بشكل تدريجي' },
  { id: 'bounce', titleAr: 'انبثاق وارتداد (Bounce)', titleEn: 'Bounce Pop', icon: 'Bounce', previewClass: 'animate-bounce', descriptionAr: 'ظهور مرن ونطاط ملفت للانتباه' },
  { id: 'slide', titleAr: 'انزلاق سريع (Slide In)', titleEn: 'Slide In', icon: 'Slide', previewClass: 'animate-in slide-in-from-right', descriptionAr: 'دخول انسيابي من اليمين أو اليسار' },
  { id: 'fade', titleAr: 'ظهور تدريجي (Fade In)', titleEn: 'Fade In', icon: 'Fade', previewClass: 'animate-in fade-in', descriptionAr: 'تلاشي ناعم وأنيق للنصوص والصور' },
  { id: 'zoom', titleAr: 'تقريب وتكبير (Scale Zoom)', titleEn: 'Scale Zoom', icon: 'Zoom', previewClass: 'animate-in zoom-in', descriptionAr: 'تكبير ديناميكي من المركز' },
  { id: 'wipe', titleAr: 'مسح وتلاشي (Wipe)', titleEn: 'Wipe Reveal', icon: 'Wipe', previewClass: 'animate-in', descriptionAr: 'كشف المحتوى من طرف لآخر' },
  { id: 'ascend', titleAr: 'صعود من الأسفل (Ascend)', titleEn: 'Ascend Rise', icon: 'Ascend', previewClass: 'animate-in slide-in-from-bottom', descriptionAr: 'ارتفاع النص للأعلى برقة واحترافية' },
  { id: 'pulse', titleAr: 'نبض وتدفق (Pulse Drift)', titleEn: 'Pulse Drift', icon: 'Pulse', previewClass: 'animate-pulse', descriptionAr: 'حركة نبضية دورية مستمرة' }
];
