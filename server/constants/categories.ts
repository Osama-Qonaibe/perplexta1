export interface PlatformCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  groupId: string;
  groupAr: string;
  groupEn: string;
  icon: string;
  audienceReach: number;
  keywords: string[];
  isFeatured?: boolean;
}

export interface CategoryGroup {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'technology',
    nameAr: 'التكنولوجيا والبرمجيات',
    nameEn: 'Tech & Software',
    icon: 'Cpu',
    descriptionAr: 'حلول الذكاء الاصطناعي، البرمجيات، التطبيقات وتكنولوجيا المعلومات',
    descriptionEn: 'AI solutions, software development, apps and IT'
  },
  {
    id: 'ecommerce_retail',
    nameAr: 'التجارة والتجزئة',
    nameEn: 'E-Commerce & Retail',
    icon: 'ShoppingBag',
    descriptionAr: 'المتاجر الإلكترونية، الأزياء، الإكسسوارات، العطور والسلع',
    descriptionEn: 'Online stores, fashion, perfumes and consumer goods'
  },
  {
    id: 'construction_home',
    nameAr: 'البناء والديكور',
    nameEn: 'Construction & Decor',
    icon: 'Hammer',
    descriptionAr: 'المقاولات العامة، التصميم الداخلي، الأثاث، ومواد البناء',
    descriptionEn: 'Contracting, interior design, furniture, building materials'
  },
  {
    id: 'real_estate',
    nameAr: 'العقارات والاستثمار',
    nameEn: 'Real Estate',
    icon: 'Building2',
    descriptionAr: 'بيع وإيجار الشقق والفلل، العقارات التجارية والأراضي',
    descriptionEn: 'Properties for sale, rentals, commercial and land'
  },
  {
    id: 'automotive',
    nameAr: 'السيارات والنقل',
    nameEn: 'Automotive & Transport',
    icon: 'Car',
    descriptionAr: 'معارض السيارات، قطع الغيار، الصيانة وخدمات الشحن',
    descriptionEn: 'Car dealerships, parts, repair, and transport'
  },
  {
    id: 'health_medical',
    nameAr: 'الصحة والطب',
    nameEn: 'Health & Medical',
    icon: 'Activity',
    descriptionAr: 'العيادات الطبية، الأسنان، الصيدليات واللياقة البدنية',
    descriptionEn: 'Clinics, dental, pharmacies, and fitness centers'
  },
  {
    id: 'food_dining',
    nameAr: 'المطاعم والأغذية',
    nameEn: 'Food & Dining',
    icon: 'Utensils',
    descriptionAr: 'المطاعم، الكافيهات، الحلويات، المخابز والمواد الغذائية',
    descriptionEn: 'Restaurants, cafes, sweets, bakeries, and groceries'
  },
  {
    id: 'education_training',
    nameAr: 'التعليم والتدريب',
    nameEn: 'Education & Training',
    icon: 'GraduationCap',
    descriptionAr: 'الجامعات، المدارس، الدورات التدريبية والتعليم الإلكتروني',
    descriptionEn: 'Universities, schools, courses, and e-learning'
  },
  {
    id: 'business_services',
    nameAr: 'الخدمات والأعمال',
    nameEn: 'Business Services',
    icon: 'Briefcase',
    descriptionAr: 'التسويق الرقمي، المحاماة، المحاسبة، التصميم والتوظيف',
    descriptionEn: 'Digital marketing, legal, accounting, design, HR'
  },
  {
    id: 'travel_leisure',
    nameAr: 'السياحة والترفيه',
    nameEn: 'Travel & Tourism',
    icon: 'Plane',
    descriptionAr: 'وكالات السفر، الفنادق، الشاليهات، الأنشطة الترفيهية والتصوير',
    descriptionEn: 'Travel agencies, hotels, resorts, entertainment'
  },
  {
    id: 'industry_agriculture',
    nameAr: 'الصناعة والزراعة',
    nameEn: 'Industry & Agriculture',
    icon: 'Factory',
    descriptionAr: 'المصانع، خطوط الإنتاج، المشاتل الزراعية والمعدات',
    descriptionEn: 'Manufacturing, agriculture, nurseries, machinery'
  },
  {
    id: 'handicrafts_services',
    nameAr: 'الحرف والصيانة المنزلية',
    nameEn: 'Handicrafts & Repairs',
    icon: 'Sparkles',
    descriptionAr: 'الأشغال اليدوية، الخياطة والصيانة المنزلية السريعة',
    descriptionEn: 'Handmade crafts, tailoring, quick home maintenance'
  }
];

export const MASTER_PLATFORM_CATEGORIES: PlatformCategory[] = [
  // 1. TECHNOLOGY & SOFTWARE
  {
    id: 'tech_software_dev',
    nameAr: 'تطوير البرمجيات والتطبيقات',
    nameEn: 'Software & App Development',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Tech & Software',
    icon: 'Code',
    audienceReach: 480000,
    keywords: ['برمجة', 'تطبيقات', 'برامج', 'مطور', 'كود', 'software', 'app development', 'mobile', 'ios', 'android', 'coding'],
    isFeatured: true
  },
  {
    id: 'tech_ai_ml',
    nameAr: 'الذكاء الاصطناعي والبيانات',
    nameEn: 'AI & Data Science',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Tech & Software',
    icon: 'Bot',
    audienceReach: 620000,
    keywords: ['ذكاء اصطناعي', 'ai', 'machine learning', 'chatgpt', 'gemini', 'بيانات', 'أتمتة', 'automation', 'data science'],
    isFeatured: true
  },
  {
    id: 'tech_web_design',
    nameAr: 'تصميم وتطوير المواقع',
    nameEn: 'Web Design & Development',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Tech & Software',
    icon: 'Globe',
    audienceReach: 410000,
    keywords: ['مواقع', 'تصميم مواقع', 'ويب', 'web design', 'wordpress', 'shopify', 'frontend', 'developer'],
    isFeatured: true
  },
  {
    id: 'tech_cybersecurity',
    nameAr: 'الأمن السيبراني وحماية البيانات',
    nameEn: 'Cybersecurity & Protection',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Tech & Software',
    icon: 'ShieldCheck',
    audienceReach: 290000,
    keywords: ['أمن سيبراني', 'حماية', 'أمن معلومات', 'cybersecurity', 'firewall', 'security', 'privacy'],
    isFeatured: false
  },
  {
    id: 'tech_it_cloud',
    nameAr: 'الحوسبة السحابية والشبكات',
    nameEn: 'Cloud & IT Solutions',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Tech & Software',
    icon: 'Cloud',
    audienceReach: 350000,
    keywords: ['شبكات', 'سحابة', 'cloud', 'aws', 'it support', 'servers', 'خوادم', 'استضافة'],
    isFeatured: false
  },
  {
    id: 'tech_smartphones_devices',
    nameAr: 'الهواتف والأجهزة الذكية',
    nameEn: 'Smartphones & Devices',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Tech & Software',
    icon: 'Smartphone',
    audienceReach: 740000,
    keywords: ['موبايل', 'هواتف', 'جوال', 'صيانة جوالات', 'آيفون', 'سامسونج', 'iphone', 'samsung', 'smartphones', 'electronics'],
    isFeatured: true
  },
  {
    id: 'tech_gaming_vr',
    nameAr: 'ألعاب الفيديو والكمبيوتر',
    nameEn: 'Gaming & PC Hardware',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Tech & Software',
    icon: 'Gamepad2',
    audienceReach: 510000,
    keywords: ['ألعاب', 'جيمنج', 'بلايستيشن', 'كمبيوتر جيمنج', 'gaming', 'pc', 'playstation', 'xbox', 'vr'],
    isFeatured: false
  },

  // 2. E-COMMERCE & RETAIL
  {
    id: 'ecom_general_store',
    nameAr: 'المتاجر والتسوق الإلكتروني',
    nameEn: 'Online Shopping Stores',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'ShoppingBag',
    audienceReach: 850000,
    keywords: ['تسوق اونلاين', 'متجر', 'شراء', 'تخفيضات', 'shopping', 'e-commerce', 'store', 'online shopping'],
    isFeatured: true
  },
  {
    id: 'ecom_fashion_clothing',
    nameAr: 'الأزياء والملابس',
    nameEn: 'Fashion & Clothing',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Shirt',
    audienceReach: 920000,
    keywords: ['ملابس', 'أزياء', 'فساتين', 'بدلات', 'موضة', 'fashion', 'clothing', 'dresses', 'apparel', 'outfits'],
    isFeatured: true
  },
  {
    id: 'ecom_shoes_bags',
    nameAr: 'الأحذية والحقائب الجلدية',
    nameEn: 'Shoes & Leather Bags',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Footprints',
    audienceReach: 680000,
    keywords: ['أحذية', 'شنط', 'حقائب', 'شنطة', 'جلد', 'shoes', 'bags', 'sneakers', 'leather'],
    isFeatured: false
  },
  {
    id: 'ecom_watches_jewelry',
    nameAr: 'الساعات والمجوهرات الفاخرة',
    nameEn: 'Watches & Fine Jewelry',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Watch',
    audienceReach: 540000,
    keywords: ['ساعات', 'ذهب', 'فضة', 'مجوهرات', 'خواتم', 'watches', 'jewelry', 'gold', 'silver', 'accessories'],
    isFeatured: true
  },
  {
    id: 'ecom_perfumes_cosmetics',
    nameAr: 'العطور ومستحضرات التجميل',
    nameEn: 'Perfumes & Cosmetics',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Sparkles',
    audienceReach: 810000,
    keywords: ['عطور', 'مكياج', 'تجميل', 'عناية بالبشرة', 'بخور', 'perfume', 'cosmetics', 'makeup', 'skincare', 'beauty'],
    isFeatured: true
  },
  {
    id: 'ecom_baby_kids',
    nameAr: 'مستلزمات وألعاب الأطفال',
    nameEn: 'Baby Products & Toys',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Baby',
    audienceReach: 490000,
    keywords: ['أطفال', 'بيبي', 'ألعاب أطفال', 'ملابس أطفال', 'baby', 'kids', 'toys', 'maternity'],
    isFeatured: false
  },
  {
    id: 'ecom_wholesale',
    nameAr: 'تجارة الجملة والتوريد',
    nameEn: 'Wholesale & Distribution',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Boxes',
    audienceReach: 360000,
    keywords: ['جملة', 'توزيع', 'موردين', 'تجارة جملة', 'wholesale', 'distributor', 'b2b', 'supplies'],
    isFeatured: false
  },

  // 3. CONSTRUCTION, HOME & DECOR
  {
    id: 'construction_general_contracting',
    nameAr: 'المقاولات العامة والبناء',
    nameEn: 'General Contracting & Building',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Hammer',
    audienceReach: 610000,
    keywords: ['بناء', 'مقاولات', 'إنشاءات', 'عمار', 'ترميم', 'construction', 'contractor', 'building', 'renovation'],
    isFeatured: true
  },
  {
    id: 'construction_interior_architecture',
    nameAr: 'التصميم الداخلي والديكور',
    nameEn: 'Interior Design & Decor',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Compass',
    audienceReach: 580000,
    keywords: ['ديكور', 'تصميم داخلي', 'هندسة معمارية', 'مخططات', 'interior design', 'decor', 'architecture', 'finishing'],
    isFeatured: true
  },
  {
    id: 'construction_furniture_home',
    nameAr: 'الأثاث والمفروشات والمطابخ',
    nameEn: 'Furniture & Modern Kitchens',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Armchair',
    audienceReach: 720000,
    keywords: ['أثاث', 'مفروشات', 'غرف نوم', 'مطابخ', 'كنب', 'furniture', 'kitchens', 'living room', 'bedroom', 'home decor'],
    isFeatured: true
  },
  {
    id: 'construction_building_materials',
    nameAr: 'مواد البناء والتشطيبات',
    nameEn: 'Building Materials & Tiles',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Layers',
    audienceReach: 430000,
    keywords: ['سيراميك', 'رخام', 'جرانيت', 'حديد', 'إسمنت', 'materials', 'ceramics', 'tiles', 'marble', 'cement'],
    isFeatured: false
  },
  {
    id: 'construction_paints_wallpaper',
    nameAr: 'الدهانات والديكور والعزل',
    nameEn: 'Paints, Wallpaper & Insulation',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Paintbrush',
    audienceReach: 380000,
    keywords: ['دهانات', 'بوية', 'ورق جدران', 'عزل', 'paints', 'wallpaper', 'insulation', 'coatings'],
    isFeatured: false
  },
  {
    id: 'construction_plumbing_electrical',
    nameAr: 'السباكة والكهرباء والإنارة',
    nameEn: 'Plumbing, Electrical & Lighting',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Zap',
    audienceReach: 470000,
    keywords: ['سباكة', 'كهرباء', 'إنارة', 'تمديدات', 'plumbing', 'electrical', 'lighting', 'fixtures'],
    isFeatured: false
  },
  {
    id: 'construction_hvac_cooling',
    nameAr: 'التكييف والتبريد والتدفئة',
    nameEn: 'HVAC, AC & Heating',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Fan',
    audienceReach: 520000,
    keywords: ['تكييف', 'مكيفات', 'تبريد', 'تدفئة', 'hvac', 'air conditioning', 'heating', 'cooling'],
    isFeatured: false
  },
  {
    id: 'construction_carpentry_aluminum',
    nameAr: 'الألمنيوم والنجارة والحدادة',
    nameEn: 'Aluminum, Carpentry & Doors',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'DoorClosed',
    audienceReach: 410000,
    keywords: ['نجارة', 'ألمنيوم', 'حدادة', 'أبواب', 'شبابيك', 'carpentry', 'aluminum', 'doors', 'windows'],
    isFeatured: false
  },
  {
    id: 'construction_solar_energy',
    nameAr: 'الطاقة الشمسية والمتجددة',
    nameEn: 'Solar & Renewable Energy',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Sun',
    audienceReach: 390000,
    keywords: ['طاقة شمسية', 'الواح شمسية', 'انفرتر', 'solar energy', 'photovoltaic', 'clean energy'],
    isFeatured: true
  },
  {
    id: 'construction_landscaping_gardens',
    nameAr: 'تنسيق الحدائق والمسابح',
    nameEn: 'Landscaping & Swimming Pools',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Trees',
    audienceReach: 340000,
    keywords: ['حدائق', 'لاندسكيب', 'مسابح', 'عشب صناعي', 'gardens', 'landscaping', 'pools', 'outdoor'],
    isFeatured: false
  },
  {
    id: 'construction_cleaning_pest_control',
    nameAr: 'التنظيف ومكافحة الحشرات',
    nameEn: 'Cleaning & Pest Control',
    groupId: 'construction_home',
    groupAr: 'البناء والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Sparkle',
    audienceReach: 460000,
    keywords: ['تنظيف', 'مكافحة حشرات', 'نظافة', 'تعقيم', 'cleaning', 'pest control', 'housekeeping'],
    isFeatured: false
  },

  // 4. REAL ESTATE & PROPERTIES
  {
    id: 'realestate_residential_sales',
    nameAr: 'شقق ومنازل للبيع',
    nameEn: 'Homes & Apartments For Sale',
    groupId: 'real_estate',
    groupAr: 'العقارات والاستثمار',
    groupEn: 'Real Estate',
    icon: 'Home',
    audienceReach: 790000,
    keywords: ['شقق للبيع', 'فلل', 'شقة تمليك', 'منازل', 'apartments for sale', 'villas', 'residential', 'real estate'],
    isFeatured: true
  },
  {
    id: 'realestate_rentals',
    nameAr: 'شقق وعقارات للإيجار',
    nameEn: 'Apartments & Property Rentals',
    groupId: 'real_estate',
    groupAr: 'العقارات والاستثمار',
    groupEn: 'Real Estate',
    icon: 'Key',
    audienceReach: 730000,
    keywords: ['شقق للإيجار', 'إيجار مفروش', 'سكن', 'rent', 'rental apartments', 'furnished'],
    isFeatured: true
  },
  {
    id: 'realestate_commercial',
    nameAr: 'المكاتب والعقارات التجارية',
    nameEn: 'Commercial Offices & Shops',
    groupId: 'real_estate',
    groupAr: 'العقارات والاستثمار',
    groupEn: 'Real Estate',
    icon: 'Building',
    audienceReach: 480000,
    keywords: ['مكاتب', 'محلات تجارية', 'مستودعات', 'عقارات تجارية', 'commercial', 'offices', 'shops', 'retail space'],
    isFeatured: false
  },
  {
    id: 'realestate_land_investment',
    nameAr: 'الأراضي والاستثمار العقاري',
    nameEn: 'Lands & Real Estate Investments',
    groupId: 'real_estate',
    groupAr: 'العقارات والاستثمار',
    groupEn: 'Real Estate',
    icon: 'Map',
    audienceReach: 550000,
    keywords: ['أراضي للبيع', 'مزارع', 'استثمار عقاري', 'تطوير عقاري', 'land', 'farms', 'investment', 'plots'],
    isFeatured: true
  },
  {
    id: 'realestate_property_management',
    nameAr: 'إدارة الأملاك والتسويق العقاري',
    nameEn: 'Property Management & Brokerage',
    groupId: 'real_estate',
    groupAr: 'العقارات والاستثمار',
    groupEn: 'Real Estate',
    icon: 'Briefcase',
    audienceReach: 320000,
    keywords: ['إدارة أملاك', 'تسويق عقاري', 'وسطاء عقاريين', 'property management', 'brokerage'],
    isFeatured: false
  },

  // 5. AUTOMOTIVE & TRANSPORTATION
  {
    id: 'auto_car_dealers',
    nameAr: 'معارض وتجارة السيارات',
    nameEn: 'Car Dealerships & Showrooms',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Car',
    audienceReach: 860000,
    keywords: ['سيارات للبيع', 'معرض سيارات', 'سيارات مستعملة', 'سيارات جديدة', 'cars for sale', 'dealership', 'vehicles'],
    isFeatured: true
  },
  {
    id: 'auto_repair_workshops',
    nameAr: 'صيانة وميكانيكا السيارات',
    nameEn: 'Auto Repair & Mechanics',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Wrench',
    audienceReach: 620000,
    keywords: ['صيانة سيارات', 'ميكانيكا', 'كهرباء سيارات', 'كراج', 'سمكرة', 'auto repair', 'mechanic', 'garage'],
    isFeatured: true
  },
  {
    id: 'auto_spare_parts',
    nameAr: 'قطع الغيار وإكسسوارات السيارات',
    nameEn: 'Car Parts & Accessories',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Disc',
    audienceReach: 590000,
    keywords: ['قطع غيار', 'إطارات', 'كوشوك', 'زيوت سيارات', 'بطاريات', 'spare parts', 'tires', 'car accessories'],
    isFeatured: false
  },
  {
    id: 'auto_rentals',
    nameAr: 'تأجير السيارات والنقل السياحي',
    nameEn: 'Car Rentals & Limousines',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Key',
    audienceReach: 490000,
    keywords: ['تأجير سيارات', 'ايجار سيارات', 'سياحي', 'car rental', 'rent a car', 'limousine'],
    isFeatured: false
  },
  {
    id: 'auto_logistics_shipping',
    nameAr: 'الشحن والخدمات اللوجستية',
    nameEn: 'Shipping & Logistics',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Truck',
    audienceReach: 530000,
    keywords: ['نقل أثاث', 'شحن', 'توصيل', 'لوجستيات', 'شحن بضائع', 'shipping', 'cargo', 'logistics', 'moving'],
    isFeatured: false
  },
  {
    id: 'auto_motorcycles',
    nameAr: 'الدراجات النارية والسكوتر',
    nameEn: 'Motorcycles & Scooters',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Bike',
    audienceReach: 380000,
    keywords: ['دراجات نارية', 'موتوسيكلات', 'سكوتر', 'خوذات', 'motorcycles', 'scooters', 'bikes'],
    isFeatured: false
  },

  // 6. HEALTH, MEDICAL & FITNESS
  {
    id: 'health_medical_clinics',
    nameAr: 'المراكز والعيادات الطبية',
    nameEn: 'Medical Clinics & Centers',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Stethoscope',
    audienceReach: 760000,
    keywords: ['عيادات', 'أطباء', 'مستشفى', 'فحص طبي', 'دكتور', 'clinics', 'doctors', 'hospitals', 'medical'],
    isFeatured: true
  },
  {
    id: 'health_dental_care',
    nameAr: 'طب وتجميل الأسنان',
    nameEn: 'Dental Care & Cosmetics',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Smile',
    audienceReach: 680000,
    keywords: ['أسنان', 'تقويم أسنان', 'تبييض أسنان', 'زراعة أسنان', 'dental', 'dentist', 'teeth whitening'],
    isFeatured: true
  },
  {
    id: 'health_pharmacies',
    nameAr: 'الصيدليات والمستلزمات الطبية',
    nameEn: 'Pharmacies & Medical Supplies',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Pill',
    audienceReach: 640000,
    keywords: ['صيدلية', 'دواء', 'فيتامينات', 'مكملات', 'pharmacy', 'supplements', 'vitamins', 'medicine'],
    isFeatured: false
  },
  {
    id: 'health_gyms_fitness',
    nameAr: 'النوادي واللياقة البدنية',
    nameEn: 'Gyms & Fitness Centers',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Dumbbell',
    audienceReach: 710000,
    keywords: ['جيم', 'رياضة', 'لياقة', 'كمال أجسام', 'تدريب', 'gym', 'fitness', 'workout', 'bodybuilding', 'crossfit'],
    isFeatured: true
  },
  {
    id: 'health_nutrition_diet',
    nameAr: 'التغذية والحميات الغذائية',
    nameEn: 'Nutrition & Diet Plans',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Apple',
    audienceReach: 560000,
    keywords: ['دايت', 'رجيم', 'تغذية', 'تخسيس', 'رشاقة', 'diet', 'nutrition', 'weight loss', 'healthy lifestyle'],
    isFeatured: false
  },
  {
    id: 'health_physiotherapy',
    nameAr: 'العلاج الطبيعي والتأهيل',
    nameEn: 'Physical Therapy & Rehab',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Activity',
    audienceReach: 390000,
    keywords: ['علاج طبيعي', 'مساج', 'تأهيل', 'عظام', 'physiotherapy', 'rehab', 'massage'],
    isFeatured: false
  },

  // 7. FOOD, DINING & HOSPITALITY
  {
    id: 'food_restaurants_fastfood',
    nameAr: 'المطاعم والمأكولات',
    nameEn: 'Restaurants & Dining',
    groupId: 'food_dining',
    groupAr: 'المطاعم والأغذية',
    groupEn: 'Food & Dining',
    icon: 'UtensilsCrossed',
    audienceReach: 980000,
    keywords: ['مطاعم', 'أكل', 'وجبات سريعة', 'برجر', 'شاورما', 'مشاوي', 'بيتزا', 'restaurants', 'fast food', 'dining', 'burgers', 'pizza'],
    isFeatured: true
  },
  {
    id: 'food_cafes_coffee',
    nameAr: 'المقاهي والقهوة المختصة',
    nameEn: 'Cafes & Specialty Coffee',
    groupId: 'food_dining',
    groupAr: 'المطاعم والأغذية',
    groupEn: 'Food & Dining',
    icon: 'Coffee',
    audienceReach: 890000,
    keywords: ['كافيه', 'قهوة', 'مقهى', 'اسبريسو', 'قهوة مختصة', 'cafe', 'coffee', 'espresso', 'barista'],
    isFeatured: true
  },
  {
    id: 'food_bakeries_sweets',
    nameAr: 'الحلويات والمخابز',
    nameEn: 'Bakeries & Sweets',
    groupId: 'food_dining',
    groupAr: 'المطاعم والأغذية',
    groupEn: 'Food & Dining',
    icon: 'Cake',
    audienceReach: 820000,
    keywords: ['حلويات', 'كيك', 'معجنات', 'شوكولاتة', 'كنافة', 'sweets', 'bakeries', 'cakes', 'pastries', 'chocolate'],
    isFeatured: true
  },
  {
    id: 'food_supermarkets_groceries',
    nameAr: 'السوبرماركت والمواد الغذائية',
    nameEn: 'Supermarkets & Groceries',
    groupId: 'food_dining',
    groupAr: 'المطاعم والأغذية',
    groupEn: 'Food & Dining',
    icon: 'ShoppingBasket',
    audienceReach: 870000,
    keywords: ['سوبرماركت', 'بقالة', 'خضار', 'لحوم', 'مواد غذائية', 'supermarket', 'groceries', 'fresh food'],
    isFeatured: false
  },
  {
    id: 'food_catering_events',
    nameAr: 'خدمات الضيافة والبوفيهات',
    nameEn: 'Catering & Event Services',
    groupId: 'food_dining',
    groupAr: 'المطاعم والأغذية',
    groupEn: 'Food & Dining',
    icon: 'Utensils',
    audienceReach: 430000,
    keywords: ['بوفيه', 'تموين حفلات', 'ضيافة', 'ولائم', 'catering', 'buffet', 'hospitality'],
    isFeatured: false
  },

  // 8. EDUCATION & TRAINING
  {
    id: 'edu_universities_colleges',
    nameAr: 'الجامعات والكليات الأكاديمية',
    nameEn: 'Universities & Colleges',
    groupId: 'education_training',
    groupAr: 'التعليم والتدريب',
    groupEn: 'Education & Training',
    icon: 'GraduationCap',
    audienceReach: 690000,
    keywords: ['جامعة', 'كلية', 'دراسة جامعية', 'تخصصات', 'منح', 'university', 'college', 'higher education', 'students'],
    isFeatured: true
  },
  {
    id: 'edu_schools_nurseries',
    nameAr: 'المدارس ورياض الأطفال',
    nameEn: 'Schools & Kindergartens',
    groupId: 'education_training',
    groupAr: 'التعليم والتدريب',
    groupEn: 'Education & Training',
    icon: 'BookOpen',
    audienceReach: 530000,
    keywords: ['مدرسة', 'روضة', 'حضانة', 'تعليم أطفال', 'school', 'kindergarten', 'daycare'],
    isFeatured: false
  },
  {
    id: 'edu_vocational_training',
    nameAr: 'التدريب المهني وتطوير المهارات',
    nameEn: 'Vocational Training & Skills',
    groupId: 'education_training',
    groupAr: 'التعليم والتدريب',
    groupEn: 'Education & Training',
    icon: 'Award',
    audienceReach: 570000,
    keywords: ['دورات', 'تدريب', 'دبلوم', 'كورسات', 'training', 'courses', 'certificates', 'skills'],
    isFeatured: true
  },
  {
    id: 'edu_elearning_courses',
    nameAr: 'التعليم الإلكتروني والدورات',
    nameEn: 'E-Learning & Online Courses',
    groupId: 'education_training',
    groupAr: 'التعليم والتدريب',
    groupEn: 'Education & Training',
    icon: 'Laptop',
    audienceReach: 640000,
    keywords: ['تعليم الكتروني', 'كورسات اونلاين', 'دروس اونلاين', 'e-learning', 'online courses', 'academy'],
    isFeatured: true
  },
  {
    id: 'edu_languages_translation',
    nameAr: 'تعليم اللغات والترجمة',
    nameEn: 'Language Learning & Translation',
    groupId: 'education_training',
    groupAr: 'التعليم والتدريب',
    groupEn: 'Education & Training',
    icon: 'Languages',
    audienceReach: 490000,
    keywords: ['لغات', 'انجليزي', 'ترجمة', 'ايلتس', 'توفل', 'languages', 'english courses', 'translation', 'ielts'],
    isFeatured: false
  },

  // 9. PROFESSIONAL & BUSINESS SERVICES
  {
    id: 'biz_digital_marketing',
    nameAr: 'التسويق الرقمي والإعلانات',
    nameEn: 'Digital Marketing & Ads',
    groupId: 'business_services',
    groupAr: 'الخدمات والأعمال',
    groupEn: 'Business Services',
    icon: 'Megaphone',
    audienceReach: 780000,
    keywords: ['تسوق الكتروني', 'سوشيال ميديا', 'اعلانات', 'تسويق رقمي', 'حملات اعلانية', 'digital marketing', 'social media', 'advertising', 'seo'],
    isFeatured: true
  },
  {
    id: 'biz_graphic_design_media',
    nameAr: 'التصميم الجرافيكي والميديا',
    nameEn: 'Graphic Design & Media',
    groupId: 'business_services',
    groupAr: 'الخدمات والأعمال',
    groupEn: 'Business Services',
    icon: 'Palette',
    audienceReach: 650000,
    keywords: ['تصميم', 'جرافيك', 'فيديو', 'مونتاج', 'هوية بصرية', 'graphic design', 'video production', 'branding', 'media'],
    isFeatured: true
  },
  {
    id: 'biz_legal_law',
    nameAr: 'المحاماة والاستشارات القانونية',
    nameEn: 'Legal Services & Law Firms',
    groupId: 'business_services',
    groupAr: 'الخدمات والأعمال',
    groupEn: 'Business Services',
    icon: 'Scale',
    audienceReach: 440000,
    keywords: ['محاماة', 'استشارات قانونية', 'قضايا', 'عقود', 'محامي', 'legal', 'lawyer', 'attorney', 'law firm'],
    isFeatured: false
  },
  {
    id: 'biz_accounting_audit',
    nameAr: 'المحاسبة والاستشارات المالية',
    nameEn: 'Accounting & Financial Advisory',
    groupId: 'business_services',
    groupAr: 'الخدمات والأعمال',
    groupEn: 'Business Services',
    icon: 'Calculator',
    audienceReach: 410000,
    keywords: ['محاسبة', 'ضرائب', 'تدقيق', 'استشارات مالية', 'accounting', 'audit', 'tax', 'financial advisory'],
    isFeatured: false
  },
  {
    id: 'biz_recruitment_hr',
    nameAr: 'التوظيف والموارد البشرية',
    nameEn: 'Recruitment & HR Services',
    groupId: 'business_services',
    groupAr: 'الخدمات والأعمال',
    groupEn: 'Business Services',
    icon: 'Users',
    audienceReach: 590000,
    keywords: ['توظيف', 'وظائف', 'موارد بشرية', 'سير ذاتية', 'recruitment', 'jobs', 'hiring', 'hr'],
    isFeatured: true
  },
  {
    id: 'biz_printing_signage',
    nameAr: 'المطابع والدعاية والإعلان',
    nameEn: 'Printing, Signage & Banners',
    groupId: 'business_services',
    groupAr: 'الخدمات والأعمال',
    groupEn: 'Business Services',
    icon: 'Printer',
    audienceReach: 390000,
    keywords: ['مطابع', 'طباعة', 'لوحات اعلانية', 'بنرات', 'printing', 'signage', 'digital printing', 'banners'],
    isFeatured: false
  },
  {
    id: 'biz_event_planning',
    nameAr: 'تنظيم المؤتمرات والفعاليات',
    nameEn: 'Event & Conference Planning',
    groupId: 'business_services',
    groupAr: 'الخدمات والأعمال',
    groupEn: 'Business Services',
    icon: 'Calendar',
    audienceReach: 460000,
    keywords: ['تنظيم حفلات', 'مؤتمرات', 'معارض', 'أفراح', 'event planning', 'conferences', 'exhibitions', 'weddings'],
    isFeatured: false
  },

  // 10. TRAVEL, TOURISM & ENTERTAINMENT
  {
    id: 'travel_tourism_agencies',
    nameAr: 'السياحة والسفر وحجز الطيران',
    nameEn: 'Travel Agencies & Flights',
    groupId: 'travel_leisure',
    groupAr: 'السياحة والترفيه',
    groupEn: 'Travel & Tourism',
    icon: 'Plane',
    audienceReach: 810000,
    keywords: ['سياحة', 'سفر', 'طيران', 'فيزا', 'تذاكر', 'travel', 'tourism', 'flights', 'visas', 'holidays'],
    isFeatured: true
  },
  {
    id: 'travel_hotels_resorts',
    nameAr: 'الفنادق والمنتجعات والشاليهات',
    nameEn: 'Hotels, Resorts & Chalets',
    groupId: 'travel_leisure',
    groupAr: 'السياحة والترفيه',
    groupEn: 'Travel & Tourism',
    icon: 'Hotel',
    audienceReach: 740000,
    keywords: ['فنادق', 'منتجعات', 'شاليهات', 'حجوزات فندقية', 'hotels', 'resorts', 'chalets', 'vacation'],
    isFeatured: true
  },
  {
    id: 'travel_entertainment_parks',
    nameAr: 'مدن الملاهي والأنشطة الترفيهية',
    nameEn: 'Theme Parks & Entertainment',
    groupId: 'travel_leisure',
    groupAr: 'السياحة والترفيه',
    groupEn: 'Travel & Tourism',
    icon: 'FerrisWheel',
    audienceReach: 630000,
    keywords: ['ملاهي', 'ترفيه', 'العاب مائية', 'العاب اطفال', 'entertainment', 'theme park', 'family fun'],
    isFeatured: false
  },
  {
    id: 'travel_photography_studios',
    nameAr: 'استوديوهات التصوير والإنتاج',
    nameEn: 'Photography & Video Studios',
    groupId: 'travel_leisure',
    groupAr: 'السياحة والترفيه',
    groupEn: 'Travel & Tourism',
    icon: 'Camera',
    audienceReach: 520000,
    keywords: ['تصوير', 'استوديو', 'مصور', 'فوتوغراف', 'photography', 'photo studio', 'video shoot'],
    isFeatured: false
  },

  // 11. INDUSTRY, MANUFACTURING & AGRICULTURE
  {
    id: 'ind_factories_manufacturing',
    nameAr: 'المصانع والإنتاج الصناعي',
    nameEn: 'Industrial Manufacturing',
    groupId: 'industry_agriculture',
    groupAr: 'الصناعة والزراعة',
    groupEn: 'Industry & Agriculture',
    icon: 'Factory',
    audienceReach: 420000,
    keywords: ['مصانع', 'صناعة', 'إنتاج', 'معامل', 'factories', 'manufacturing', 'industrial', 'production'],
    isFeatured: false
  },
  {
    id: 'ind_agriculture_nurseries',
    nameAr: 'الزراعة والمشاتل الزراعية',
    nameEn: 'Agriculture & Nurseries',
    groupId: 'industry_agriculture',
    groupAr: 'الصناعة والزراعة',
    groupEn: 'Industry & Agriculture',
    icon: 'Sprout',
    audienceReach: 360000,
    keywords: ['زراعة', 'مشاتل', 'اشجار', 'اسمدة', 'مبيدات', 'agriculture', 'farming', 'nurseries', 'plants'],
    isFeatured: false
  },
  {
    id: 'ind_livestock_poultry',
    nameAr: 'الثروة الحيوانية والأعلاف',
    nameEn: 'Livestock & Feed Farms',
    groupId: 'industry_agriculture',
    groupAr: 'الصناعة والزراعة',
    groupEn: 'Industry & Agriculture',
    icon: 'Milk',
    audienceReach: 280000,
    keywords: ['مواشي', 'دواجن', 'اعلاف', 'مزارع', 'livestock', 'poultry', 'feed'],
    isFeatured: false
  },
  {
    id: 'ind_packaging_machinery',
    nameAr: 'التعبئة والتغليف والمعدات',
    nameEn: 'Packaging & Machinery',
    groupId: 'industry_agriculture',
    groupAr: 'الصناعة والزراعة',
    groupEn: 'Industry & Agriculture',
    icon: 'Package',
    audienceReach: 310000,
    keywords: ['تغليف', 'تعبئة', 'معدات ثقيلة', 'ماكينات', 'packaging', 'machinery', 'heavy equipment'],
    isFeatured: false
  },

  // 12. HANDICRAFTS, ARTS & HOME SERVICES
  {
    id: 'craft_handmade_arts',
    nameAr: 'الأشغال والحرف اليدوية',
    nameEn: 'Handmade Crafts & Art',
    groupId: 'handicrafts_services',
    groupAr: 'الحرف والصيانة المنزلية',
    groupEn: 'Handicrafts & Repairs',
    icon: 'Sparkles',
    audienceReach: 430000,
    keywords: ['اشغال يدوية', 'حرف يدوية', 'رسم', 'لوحات', 'خزف', 'handmade', 'crafts', 'art', 'paintings'],
    isFeatured: false
  },
  {
    id: 'craft_tailoring_fashion_design',
    nameAr: 'الخياطة وتصميم الأزياء',
    nameEn: 'Tailoring & Fashion Alterations',
    groupId: 'handicrafts_services',
    groupAr: 'الحرف والصيانة المنزلية',
    groupEn: 'Handicrafts & Repairs',
    icon: 'Scissors',
    audienceReach: 470000,
    keywords: ['خياطة', 'تفصيل', 'تطريز', 'تعديل ملابس', 'خياط', 'tailoring', 'embroidery', 'alterations'],
    isFeatured: false
  },
  {
    id: 'craft_home_maintenance_quick',
    nameAr: 'الصيانة المنزلية والتركيبات',
    nameEn: 'Quick Home Maintenance',
    groupId: 'handicrafts_services',
    groupAr: 'الحرف والصيانة المنزلية',
    groupEn: 'Handicrafts & Repairs',
    icon: 'Wrench',
    audienceReach: 510000,
    keywords: ['صيانة منزلية', 'فني منزلي', 'تصليح', 'تركيب', 'handyman', 'home maintenance', 'repair'],
    isFeatured: false
  }
];

export function searchCategories(query: string = '', groupId?: string, limit: number = 50): PlatformCategory[] {
  let list = MASTER_PLATFORM_CATEGORIES;
  if (groupId && groupId !== 'all') {
    list = list.filter(c => c.groupId === groupId);
  }
  
  if (!query || query.trim() === '') {
    return list.slice(0, limit);
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  return list
    .filter(c => {
      const matchNameAr = c.nameAr.toLowerCase().includes(normalizedQuery);
      const matchNameEn = c.nameEn.toLowerCase().includes(normalizedQuery);
      const matchGroupAr = c.groupAr.toLowerCase().includes(normalizedQuery);
      const matchGroupEn = c.groupEn.toLowerCase().includes(normalizedQuery);
      const matchKeywords = c.keywords.some(k => k.toLowerCase().includes(normalizedQuery));
      return matchNameAr || matchNameEn || matchGroupAr || matchGroupEn || matchKeywords;
    })
    .slice(0, limit);
}
