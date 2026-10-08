/**
 * Hierarchical Geographic Database & Search Engine
 * Standardized for Arab & Global coverage with country isolation and city-to-village drilldown.
 */

export interface GeoSubLocality {
  nameAr: string;
  nameEn: string;
  type: 'town' | 'village' | 'camp' | 'neighborhood' | 'district' | 'city';
}

export interface GeoCity {
  nameAr: string;
  nameEn: string;
  stateAr?: string;
  stateEn?: string;
  countryAr: string;
  countryEn: string;
  countryCode: string;
  flag: string;
  type: 'city' | 'capital' | 'governorate';
  subLocalities?: GeoSubLocality[];
  lat?: string;
  lon?: string;
}

export interface GeoCountry {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  keywords: string[];
  cities: GeoCity[];
}

// ----------------------------------------------------------------------
// PALESTINE (فلسطين)
// ----------------------------------------------------------------------
export const PALESTINE_GEO: GeoCountry = {
  code: 'ps',
  nameAr: 'فلسطين',
  nameEn: 'Palestine',
  flag: '🇵🇸',
  keywords: ['فلسطين', 'فلسطينيه', 'فلسطيني', 'palestine', 'palestinian', 'الضفة الغربية', 'قطاع غزة', 'القدس'],
  cities: [
    {
      nameAr: 'القدس الشريف',
      nameEn: 'Jerusalem',
      stateAr: 'عاصمة دولة فلسطين',
      stateEn: 'Capital of Palestine',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'capital',
      subLocalities: [
        { nameAr: 'البلدة القديمة', nameEn: 'Old City', type: 'neighborhood' },
        { nameAr: 'شعفاط', nameEn: 'Shuafat', type: 'neighborhood' },
        { nameAr: 'بيت حنينا', nameEn: 'Beit Hanina', type: 'neighborhood' },
        { nameAr: 'سلوان', nameEn: 'Silwan', type: 'neighborhood' },
        { nameAr: 'الطور', nameEn: 'At-Tur', type: 'neighborhood' },
        { nameAr: 'العيسوية', nameEn: 'Al-Isawiya', type: 'village' },
        { nameAr: 'جبل المكبر', nameEn: 'Jabal Al-Mukabbir', type: 'neighborhood' },
        { nameAr: 'صور باهر', nameEn: 'Sur Baher', type: 'village' },
        { nameAr: 'أبو ديس', nameEn: 'Abu Dis', type: 'town' },
        { nameAr: 'العيزرية', nameEn: 'Al-Eizariya', type: 'town' },
        { nameAr: 'الرام', nameEn: 'Ar-Ram', type: 'town' },
        { nameAr: 'كفر عقب', nameEn: 'Kafr Aqab', type: 'town' },
        { nameAr: 'عناتا', nameEn: 'Anata', type: 'town' },
        { nameAr: 'حزما', nameEn: 'Hizma', type: 'village' },
        { nameAr: 'الشيخ جراح', nameEn: 'Sheikh Jarrah', type: 'neighborhood' },
        { nameAr: 'مخيم شعفاط', nameEn: 'Shuafat Camp', type: 'camp' },
        { nameAr: 'مخيم قلنديا', nameEn: 'Qalandia Camp', type: 'camp' },
        { nameAr: 'قلنديا', nameEn: 'Qalandia', type: 'village' },
        { nameAr: 'بدّو', nameEn: 'Biddu', type: 'village' },
        { nameAr: 'قطنة', nameEn: 'Qatanna', type: 'village' },
        { nameAr: 'بيت عنان', nameEn: 'Beit Anan', type: 'village' },
        { nameAr: 'القبيبة', nameEn: 'Al-Qubeiba', type: 'village' },
      ],
    },
    {
      nameAr: 'الخليل',
      nameEn: 'Hebron',
      stateAr: 'محافظة الخليل',
      stateEn: 'Hebron Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'البلدة القديمة بالخليل', nameEn: 'Hebron Old City', type: 'neighborhood' },
        { nameAr: 'دورا', nameEn: 'Dura', type: 'city' },
        { nameAr: 'يطا', nameEn: 'Yatta', type: 'city' },
        { nameAr: 'الظاهرية', nameEn: 'Ad-Dhahiriya', type: 'city' },
        { nameAr: 'حلحول', nameEn: 'Halhul', type: 'city' },
        { nameAr: 'بني نعيم', nameEn: 'Bani Naim', type: 'town' },
        { nameAr: 'بيت أمر', nameEn: 'Beit Ummar', type: 'town' },
        { nameAr: 'إذنا', nameEn: 'Idhna', type: 'town' },
        { nameAr: 'سعير', nameEn: 'Sair', type: 'town' },
        { nameAr: 'ترقوميا', nameEn: 'Tarqumiyah', type: 'town' },
        { nameAr: 'السموع', nameEn: 'As-Samu', type: 'town' },
        { nameAr: 'صوريف', nameEn: 'Surif', type: 'town' },
        { nameAr: 'الشيوخ', nameEn: 'Ash-Shuyukh', type: 'town' },
        { nameAr: 'تفوح', nameEn: 'Taffuh', type: 'town' },
        { nameAr: 'بيت كاحل', nameEn: 'Beit Kahil', type: 'town' },
        { nameAr: 'نوبا', nameEn: 'Nuba', type: 'village' },
        { nameAr: 'خاراس', nameEn: 'Kharas', type: 'village' },
        { nameAr: 'دير سامت', nameEn: 'Deir Samit', type: 'village' },
        { nameAr: 'بيت عوا', nameEn: 'Beit Awwa', type: 'village' },
        { nameAr: 'الرماضين', nameEn: 'Ar-Ramadin', type: 'town' },
        { nameAr: 'سكة', nameEn: 'Sikka', type: 'village' },
        { nameAr: 'الكوم', nameEn: 'Al-Kum', type: 'village' },
        { nameAr: 'بيت الروش', nameEn: 'Beit ar-Rush', type: 'village' },
        { nameAr: 'المجد', nameEn: 'Al-Majd', type: 'village' },
        { nameAr: 'كرمة', nameEn: 'Kurza / Karma', type: 'village' },
        { nameAr: 'إمريش', nameEn: 'Imreish', type: 'village' },
        { nameAr: 'الصرة', nameEn: 'As-Sura', type: 'village' },
        { nameAr: 'حدب الفوار', nameEn: 'Hadab Al-Fawwar', type: 'village' },
        { nameAr: 'مخيم الفوار', nameEn: 'Al-Fawwar Camp', type: 'camp' },
        { nameAr: 'مخيم العروب', nameEn: 'Al-Arroub Camp', type: 'camp' },
        { nameAr: 'خربة قلقس', nameEn: 'Qilqis', type: 'village' },
        { nameAr: 'الريحية', nameEn: 'Ar-Rihiya', type: 'village' },
      ],
    },
    {
      nameAr: 'رام الله والبيرة',
      nameEn: 'Ramallah & Al-Bireh',
      stateAr: 'محافظة رام الله والبيرة',
      stateEn: 'Ramallah Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'رام الله', nameEn: 'Ramallah', type: 'city' },
        { nameAr: 'البيرة', nameEn: 'Al-Bireh', type: 'city' },
        { nameAr: 'بيتونيا', nameEn: 'Beitunia', type: 'city' },
        { nameAr: 'بيرزيت', nameEn: 'Birzeit', type: 'town' },
        { nameAr: 'سلواد', nameEn: 'Silwad', type: 'town' },
        { nameAr: 'سنجل', nameEn: 'Sinjil', type: 'town' },
        { nameAr: 'نعلين', nameEn: 'Nilin', type: 'town' },
        { nameAr: 'بلعين', nameEn: 'Bilin', type: 'village' },
        { nameAr: 'دير دبوان', nameEn: 'Deir Dibwan', type: 'town' },
        { nameAr: 'المزرعة الشرقية', nameEn: 'Al-Mazraa ash-Sharqiya', type: 'town' },
        { nameAr: 'ترمسعيا', nameEn: 'Turmus Ayya', type: 'town' },
        { nameAr: 'رنتيس', nameEn: 'Rantis', type: 'village' },
        { nameAr: 'دير غسانة', nameEn: 'Deir Ghassaneh', type: 'village' },
        { nameAr: 'كفر عين', nameEn: 'Kafr Ein', type: 'village' },
        { nameAr: 'كفر مالك', nameEn: 'Kafr Malik', type: 'village' },
        { nameAr: 'دير جرير', nameEn: 'Deir Jarir', type: 'village' },
        { nameAr: 'الطيبة', nameEn: 'Taybeh', type: 'town' },
        { nameAr: 'روابي', nameEn: 'Rawabi', type: 'city' },
        { nameAr: 'خربثا المصباح', nameEn: 'Kharbatha al-Misbah', type: 'village' },
        { nameAr: 'مخيم الجلزون', nameEn: 'Jalazone Camp', type: 'camp' },
        { nameAr: 'مخيم الأمعري', nameEn: 'Al-Amari Camp', type: 'camp' },
        { nameAr: 'مخيم قدورة', nameEn: 'Qaddura Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'نابلس',
      nameEn: 'Nablus',
      stateAr: 'محافظة نابلس (جبل النار)',
      stateEn: 'Nablus Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'البلدة القديمة بنابلس', nameEn: 'Nablus Old City', type: 'neighborhood' },
        { nameAr: 'رفيديا', nameEn: 'Rafidia', type: 'neighborhood' },
        { nameAr: 'حوارة', nameEn: 'Huwara', type: 'town' },
        { nameAr: 'بيتا', nameEn: 'Beita', type: 'town' },
        { nameAr: 'عصيرة الشمالية', nameEn: 'Asira ash-Shamaliya', type: 'town' },
        { nameAr: 'سبسطية', nameEn: 'Sebastia', type: 'town' },
        { nameAr: 'عقربا', nameEn: 'Aqraba', type: 'town' },
        { nameAr: 'عورتا', nameEn: 'Awarta', type: 'village' },
        { nameAr: 'روجيب', nameEn: 'Rujeib', type: 'village' },
        { nameAr: 'دير شرف', nameEn: 'Deir Sharaf', type: 'village' },
        { nameAr: 'برقة', nameEn: 'Burqa', type: 'village' },
        { nameAr: 'بيت فوريك', nameEn: 'Beit Furik', type: 'town' },
        { nameAr: 'طلوزة', nameEn: 'Talluza', type: 'village' },
        { nameAr: 'بيت دجن', nameEn: 'Beit Dajan', type: 'village' },
        { nameAr: 'قبلان', nameEn: 'Qabalan', type: 'town' },
        { nameAr: 'جماعين', nameEn: 'Jammaayn', type: 'town' },
        { nameAr: 'سالم', nameEn: 'Salim', type: 'village' },
        { nameAr: 'كفر قليل', nameEn: 'Kafr Qallil', type: 'village' },
        { nameAr: 'زواتا', nameEn: 'Zawata', type: 'village' },
        { nameAr: 'مخيم بلاطة', nameEn: 'Balata Camp', type: 'camp' },
        { nameAr: 'مخيم عسكر', nameEn: 'Askar Camp', type: 'camp' },
        { nameAr: 'مخيم العين (رقم 1)', nameEn: 'Ein Beit al-Ma Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'جنين',
      nameEn: 'Jenin',
      stateAr: 'محافظة جنين',
      stateEn: 'Jenin Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'قباطية', nameEn: 'Qabatiya', type: 'city' },
        { nameAr: 'يعبد', nameEn: 'Yabad', type: 'town' },
        { nameAr: 'اليامون', nameEn: 'Al-Yamun', type: 'town' },
        { nameAr: 'برطعة', nameEn: 'Barta’a', type: 'town' },
        { nameAr: 'سيلة الحارثية', nameEn: 'Silat al-Harithiya', type: 'town' },
        { nameAr: 'جبع', nameEn: 'Jaba', type: 'town' },
        { nameAr: 'الزبابدة', nameEn: 'Zababdeh', type: 'town' },
        { nameAr: 'عرابة', nameEn: 'Arraba', type: 'town' },
        { nameAr: 'كفر راعي', nameEn: 'Kafr Rai', type: 'town' },
        { nameAr: 'فقوعة', nameEn: 'Faqqua', type: 'village' },
        { nameAr: 'جلبون', nameEn: 'Jalbun', type: 'village' },
        { nameAr: 'رمانة', nameEn: 'Rummanah', type: 'village' },
        { nameAr: 'كفر دان', nameEn: 'Kafr Dan', type: 'village' },
        { nameAr: 'ميثلون', nameEn: 'Meithalun', type: 'town' },
        { nameAr: 'صانور', nameEn: 'Sanur', type: 'village' },
        { nameAr: 'برقين', nameEn: 'Burqin', type: 'town' },
        { nameAr: 'سيلة الظهر', nameEn: 'Silat ad-Dhahr', type: 'town' },
        { nameAr: 'مخيم جنين', nameEn: 'Jenin Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'بيت لحم',
      nameEn: 'Bethlehem',
      stateAr: 'محافظة بيت لحم',
      stateEn: 'Bethlehem Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'بيت جالا', nameEn: 'Beit Jala', type: 'city' },
        { nameAr: 'بيت ساحور', nameEn: 'Beit Sahour', type: 'city' },
        { nameAr: 'الدوحة', nameEn: 'Ad-Doha', type: 'town' },
        { nameAr: 'الخضر', nameEn: 'Al-Khader', type: 'town' },
        { nameAr: 'العبيدية', nameEn: 'Al-Ubeidiya', type: 'town' },
        { nameAr: 'تقوع', nameEn: 'Teqoa', type: 'town' },
        { nameAr: 'زعترة', nameEn: 'Zaatara', type: 'town' },
        { nameAr: 'بتير', nameEn: 'Battir', type: 'village' },
        { nameAr: 'نحالين', nameEn: 'Nahalin', type: 'village' },
        { nameAr: 'وادي فوكين', nameEn: 'Wadi Fukin', type: 'village' },
        { nameAr: 'دار صلاح', nameEn: 'Dar Salah', type: 'village' },
        { nameAr: 'مراح رباح', nameEn: 'Marah Rabah', type: 'village' },
        { nameAr: 'مخيم الدهيشة', nameEn: 'Dheisheh Camp', type: 'camp' },
        { nameAr: 'مخيم عايدة', nameEn: 'Aida Camp', type: 'camp' },
        { nameAr: 'مخيم بيت جبرين (العزة)', nameEn: 'Beit Jibrin Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'طولكرم',
      nameEn: 'Tulkarm',
      stateAr: 'محافظة طولكرم',
      stateEn: 'Tulkarm Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'عنبتا', nameEn: 'Anabta', type: 'town' },
        { nameAr: 'قفين', nameEn: 'Qaffin', type: 'town' },
        { nameAr: 'دير الغصون', nameEn: 'Deir al-Ghusun', type: 'town' },
        { nameAr: 'بلعا', nameEn: 'Bala', type: 'town' },
        { nameAr: 'باقة الشرقية', nameEn: 'Baqat ash-Sharqiya', type: 'town' },
        { nameAr: 'علار', nameEn: 'Allar', type: 'town' },
        { nameAr: 'زيتا', nameEn: 'Zeita', type: 'village' },
        { nameAr: 'كفر اللبد', nameEn: 'Kafr al-Labad', type: 'village' },
        { nameAr: 'فرعون', nameEn: 'Faraun', type: 'village' },
        { nameAr: 'شويكة', nameEn: 'Shuweika', type: 'neighborhood' },
        { nameAr: 'ارتاح', nameEn: 'Irtah', type: 'neighborhood' },
        { nameAr: 'مخيم طولكرم', nameEn: 'Tulkarm Camp', type: 'camp' },
        { nameAr: 'مخيم نور شمس', nameEn: 'Nur Shams Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'قلقيلية',
      nameEn: 'Qalqilya',
      stateAr: 'محافظة قلقيلية',
      stateEn: 'Qalqilya Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'عزون', nameEn: 'Azzun', type: 'town' },
        { nameAr: 'حبلة', nameEn: 'Habla', type: 'town' },
        { nameAr: 'كفر ثلث', nameEn: 'Kafr Thulth', type: 'town' },
        { nameAr: 'كفر قدوم', nameEn: 'Kafr Qaddum', type: 'village' },
        { nameAr: 'جيوس', nameEn: 'Jayyus', type: 'village' },
        { nameAr: 'الفندق', nameEn: 'Al-Funduq', type: 'village' },
        { nameAr: 'النبي إلياس', nameEn: 'An-Nabi Elyas', type: 'village' },
        { nameAr: 'باقة الحطب', nameEn: 'Baqat al-Hatab', type: 'village' },
        { nameAr: 'إماتين', nameEn: 'Immatain', type: 'village' },
      ],
    },
    {
      nameAr: 'أريحا والأغوار',
      nameEn: 'Jericho & Jordan Valley',
      stateAr: 'محافظة أريحا والأغوار',
      stateEn: 'Jericho Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'أريحا', nameEn: 'Jericho', type: 'city' },
        { nameAr: 'العوجا', nameEn: 'Al-Auja', type: 'town' },
        { nameAr: 'فصايل', nameEn: 'Fasayil', type: 'village' },
        { nameAr: 'الجفتلك', nameEn: 'Al-Jiftlik', type: 'village' },
        { nameAr: 'مرج نعجة', nameEn: 'Marj Naaja', type: 'village' },
        { nameAr: 'الزبيدات', nameEn: 'Az-Zubaidat', type: 'village' },
        { nameAr: 'مخيم عقبة جبر', nameEn: 'Aqabat Jaber Camp', type: 'camp' },
        { nameAr: 'مخيم عين السلطان', nameEn: 'Ein as-Sultan Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'سلفيت',
      nameEn: 'Salfit',
      stateAr: 'محافظة سلفيت (مدينة الزيتون)',
      stateEn: 'Salfit Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'بديا', nameEn: 'Biddya', type: 'town' },
        { nameAr: 'دير استيا', nameEn: 'Deir Istiya', type: 'town' },
        { nameAr: 'كفل حارس', nameEn: 'Kifl Haris', type: 'town' },
        { nameAr: 'حارس', nameEn: 'Haris', type: 'village' },
        { nameAr: 'الزاوية', nameEn: 'Az-Zawiya', type: 'town' },
        { nameAr: 'قراوة بني حسان', nameEn: 'Qarawat Bani Hassan', type: 'town' },
        { nameAr: 'بروقين', nameEn: 'Bruqin', type: 'village' },
        { nameAr: 'كفر الديك', nameEn: 'Kafr ad-Dik', type: 'town' },
        { nameAr: 'ياسوف', nameEn: 'Yasuf', type: 'village' },
        { nameAr: 'اسكاكا', nameEn: 'Iskaka', type: 'village' },
        { nameAr: 'مردة', nameEn: 'Marda', type: 'village' },
      ],
    },
    {
      nameAr: 'طوباس والأغوار الشمالية',
      nameEn: 'Tubas & Northern Valley',
      stateAr: 'محافظة طوباس',
      stateEn: 'Tubas Governorate',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'طوباس', nameEn: 'Tubas', type: 'city' },
        { nameAr: 'طمون', nameEn: 'Tammun', type: 'town' },
        { nameAr: 'عقابا', nameEn: 'Aqqaba', type: 'town' },
        { nameAr: 'تياسير', nameEn: 'Tayasir', type: 'village' },
        { nameAr: 'بردلة', nameEn: 'Bardala', type: 'village' },
        { nameAr: 'كردلة', nameEn: 'Kardala', type: 'village' },
        { nameAr: 'عين البيضاء', nameEn: 'Ein al-Beida', type: 'village' },
        { nameAr: 'مخيم الفارعة', nameEn: 'Far’a Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'مدينة غزة',
      nameEn: 'Gaza City',
      stateAr: 'محافظة غزة، قطاع غزة',
      stateEn: 'Gaza Strip',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'حي الرمال', nameEn: 'Rimal', type: 'neighborhood' },
        { nameAr: 'الشجاعية', nameEn: 'Shujaiyya', type: 'neighborhood' },
        { nameAr: 'الصبرة', nameEn: 'Sabra', type: 'neighborhood' },
        { nameAr: 'تل الهوى', nameEn: 'Tal al-Hawa', type: 'neighborhood' },
        { nameAr: 'الزيتون', nameEn: 'Zeitoun', type: 'neighborhood' },
        { nameAr: 'الشيخ رضوان', nameEn: 'Sheikh Radwan', type: 'neighborhood' },
        { nameAr: 'التفاح', nameEn: 'Tuffah', type: 'neighborhood' },
        { nameAr: 'الدرج', nameEn: 'Daraj', type: 'neighborhood' },
        { nameAr: 'النصر', nameEn: 'Nasr', type: 'neighborhood' },
        { nameAr: 'مخيم الشاطئ', nameEn: 'Beach Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'شمال غزة',
      nameEn: 'North Gaza',
      stateAr: 'محافظة شمال غزة، قطاع غزة',
      stateEn: 'North Gaza',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'جباليا', nameEn: 'Jabalia', type: 'city' },
        { nameAr: 'بيت لاهيا', nameEn: 'Beit Lahia', type: 'city' },
        { nameAr: 'بيت حانون', nameEn: 'Beit Hanoun', type: 'city' },
        { nameAr: 'مخيم جباليا', nameEn: 'Jabalia Camp', type: 'camp' },
        { nameAr: 'أم النصر (القرية البدوية)', nameEn: 'Umm an-Naser', type: 'village' },
      ],
    },
    {
      nameAr: 'خان يونس',
      nameEn: 'Khan Younis',
      stateAr: 'محافظة خان يونس، قطاع غزة',
      stateEn: 'Khan Younis',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'خان يونس البلد', nameEn: 'Khan Younis City', type: 'city' },
        { nameAr: 'القرارة', nameEn: 'Al-Qarara', type: 'town' },
        { nameAr: 'بني سهيلا', nameEn: 'Bani Suheila', type: 'town' },
        { nameAr: 'عبسان الكبيرة', nameEn: 'Abasan al-Kabira', type: 'town' },
        { nameAr: 'عبسان الصغيرة', nameEn: 'Abasan as-Saghira', type: 'town' },
        { nameAr: 'خزاعة', nameEn: 'Khuza’a', type: 'town' },
        { nameAr: 'الفخاري', nameEn: 'Al-Fukhari', type: 'village' },
        { nameAr: 'مخيم خان يونس', nameEn: 'Khan Younis Camp', type: 'camp' },
        { nameAr: 'السطر الغربي والشرقي', nameEn: 'As-Satr', type: 'neighborhood' },
        { nameAr: 'المواصي خان يونس', nameEn: 'Al-Mawasi Khan Younis', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'رفح',
      nameEn: 'Rafah',
      stateAr: 'محافظة رفح، قطاع غزة',
      stateEn: 'Rafah',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'تل السلطان', nameEn: 'Tal as-Sultan', type: 'neighborhood' },
        { nameAr: 'الشابورة', nameEn: 'Shaboura', type: 'neighborhood' },
        { nameAr: 'حي الجنينة', nameEn: 'Al-Janeena', type: 'neighborhood' },
        { nameAr: 'خربة العدس', nameEn: 'Khirbat al-Adas', type: 'village' },
        { nameAr: 'حي البرازيل', nameEn: 'Brazil', type: 'neighborhood' },
        { nameAr: 'حي السلام', nameEn: 'As-Salam', type: 'neighborhood' },
        { nameAr: 'الشوكة', nameEn: 'Ash-Shawka', type: 'town' },
        { nameAr: 'مخيم رفح', nameEn: 'Rafah Camp', type: 'camp' },
        { nameAr: 'المواصي رفح', nameEn: 'Al-Mawasi Rafah', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'دير البلح والوسطى',
      nameEn: 'Deir al-Balah & Central Gaza',
      stateAr: 'محافظة الوسطى، قطاع غزة',
      stateEn: 'Central Gaza',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'دير البلح', nameEn: 'Deir al-Balah', type: 'city' },
        { nameAr: 'الزوايدة', nameEn: 'Az-Zawayda', type: 'town' },
        { nameAr: 'مخيم النصيرات', nameEn: 'Nuseirat Camp', type: 'camp' },
        { nameAr: 'مخيم البريج', nameEn: 'Bureij Camp', type: 'camp' },
        { nameAr: 'مخيم المغازي', nameEn: 'Maghazi Camp', type: 'camp' },
        { nameAr: 'مخيم دير البلح', nameEn: 'Deir al-Balah Camp', type: 'camp' },
        { nameAr: 'وادي السلقا', nameEn: 'Wadi as-Salqa', type: 'village' },
      ],
    },
    {
      nameAr: 'يافا',
      nameEn: 'Jaffa',
      stateAr: 'الساحل الفلسطيني',
      stateEn: 'Palestinian Coast',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'البلدة القديمة بيافا', nameEn: 'Jaffa Old City', type: 'neighborhood' },
        { nameAr: 'العجمي', nameEn: 'Ajami', type: 'neighborhood' },
        { nameAr: 'المنشية', nameEn: 'Manshiya', type: 'neighborhood' },
        { nameAr: 'حي النزهة', nameEn: 'Al-Nuzha', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'حيفا',
      nameEn: 'Haifa',
      stateAr: 'عروس الكرمل، فلسطين',
      stateEn: 'Haifa',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'وادي النسناس', nameEn: 'Wadi Nisnas', type: 'neighborhood' },
        { nameAr: 'وادي الصليب', nameEn: 'Wadi Salib', type: 'neighborhood' },
        { nameAr: 'حي الألمانية', nameEn: 'German Colony', type: 'neighborhood' },
        { nameAr: 'الكبابير', nameEn: 'Kababir', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'عكا',
      nameEn: 'Acre (Akka)',
      stateAr: 'الساحل الشمالي، فلسطين',
      stateEn: 'Acre',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
    },
    {
      nameAr: 'الناصرة',
      nameEn: 'Nazareth',
      stateAr: 'الجليل، فلسطين',
      stateEn: 'Galilee',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'كفر كنا', nameEn: 'Kafr Kanna', type: 'town' },
        { nameAr: 'الرينة', nameEn: 'Reineh', type: 'town' },
        { nameAr: 'يافة الناصرة', nameEn: 'Yafa an-Naseriyye', type: 'town' },
        { nameAr: 'إكسال', nameEn: 'Iksal', type: 'village' },
      ],
    },
    {
      nameAr: 'بئر السبع والنقب',
      nameEn: 'Beersheba & Negev',
      stateAr: 'النقب، فلسطين',
      stateEn: 'Negev',
      countryAr: 'فلسطين',
      countryEn: 'Palestine',
      countryCode: 'ps',
      flag: '🇵🇸',
      type: 'city',
      subLocalities: [
        { nameAr: 'رهط', nameEn: 'Rahat', type: 'city' },
        { nameAr: 'تل السبع', nameEn: 'Tel as-Sabi', type: 'town' },
        { nameAr: 'كسيفة', nameEn: 'Kuseife', type: 'town' },
        { nameAr: 'حورة', nameEn: 'Hura', type: 'town' },
        { nameAr: 'شقيب السلام', nameEn: 'Segev Shalom', type: 'town' },
        { nameAr: 'عرعرة النقب', nameEn: 'Ar’ara BaNegev', type: 'town' },
        { nameAr: 'اللقية', nameEn: 'Lakiya', type: 'town' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------
// JORDAN (المملكة الأردنية الهاشمية)
// ----------------------------------------------------------------------
export const JORDAN_GEO: GeoCountry = {
  code: 'jo',
  nameAr: 'الأردن',
  nameEn: 'Jordan',
  flag: '🇯🇴',
  keywords: ['الاردن', 'الأردن', 'أردن', 'المملكة الأردنية الهاشمية', 'jordan', 'jordanian'],
  cities: [
    {
      nameAr: 'عمّان',
      nameEn: 'Amman',
      stateAr: 'العاصمة، المملكة الأردنية الهاشمية',
      stateEn: 'Amman Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'capital',
      subLocalities: [
        { nameAr: 'وسط البلد', nameEn: 'Downtown Amman', type: 'neighborhood' },
        { nameAr: 'عبدون', nameEn: 'Abdoun', type: 'neighborhood' },
        { nameAr: 'الصويفية', nameEn: 'Sweifieh', type: 'neighborhood' },
        { nameAr: 'الجبيهة', nameEn: 'Jubaiha', type: 'neighborhood' },
        { nameAr: 'تلاع العلي', nameEn: 'Tlaa Al-Ali', type: 'neighborhood' },
        { nameAr: 'خلدا', nameEn: 'Khalda', type: 'neighborhood' },
        { nameAr: 'مرج الحمام', nameEn: 'Marj Al-Hamam', type: 'neighborhood' },
        { nameAr: 'سحاب', nameEn: 'Sahab', type: 'town' },
        { nameAr: 'شفا بدران', nameEn: 'Shafa Badran', type: 'neighborhood' },
        { nameAr: 'طبربور', nameEn: 'Tabarbour', type: 'neighborhood' },
        { nameAr: 'المقابلين', nameEn: 'Al-Muqabalain', type: 'neighborhood' },
        { nameAr: 'وادي السير', nameEn: 'Wadi Al-Seer', type: 'neighborhood' },
        { nameAr: 'دير غبار', nameEn: 'Deir Ghbar', type: 'neighborhood' },
        { nameAr: 'الشميساني', nameEn: 'Shmeisani', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'إربد',
      nameEn: 'Irbid',
      stateAr: 'محافظة إربد (عروس الشمال)',
      stateEn: 'Irbid Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
      subLocalities: [
        { nameAr: 'الرمثا', nameEn: 'Ar-Ramtha', type: 'city' },
        { nameAr: 'الحصن', nameEn: 'Al-Husn', type: 'town' },
        { nameAr: 'الصريح', nameEn: 'Sareeh', type: 'town' },
        { nameAr: 'لواء بني كنانة', nameEn: 'Bani Kinanah', type: 'district' },
        { nameAr: 'لواء الكورة', nameEn: 'Al-Kourah', type: 'district' },
        { nameAr: 'الأغوار الشمالية', nameEn: 'Northern Jordan Valley', type: 'district' },
        { nameAr: 'الطيبة', nameEn: 'At-Taybeh', type: 'town' },
        { nameAr: 'المزار الشمالي', nameEn: 'Al-Mazar ash-Shamali', type: 'town' },
      ],
    },
    {
      nameAr: 'الزرقاء',
      nameEn: 'Zarqa',
      stateAr: 'محافظة الزرقاء',
      stateEn: 'Zarqa Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
      subLocalities: [
        { nameAr: 'الرصيفة', nameEn: 'Russeifa', type: 'city' },
        { nameAr: 'الهاشمية', nameEn: 'Hashemiya', type: 'town' },
        { nameAr: 'الضليل', nameEn: 'Ad-Dhulayl', type: 'town' },
        { nameAr: 'الأزرق', nameEn: 'Azraq', type: 'town' },
      ],
    },
    {
      nameAr: 'العقبة',
      nameEn: 'Aqaba',
      stateAr: 'محافظة العقبة (ثغر الأردن الباسم)',
      stateEn: 'Aqaba Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
      subLocalities: [
        { nameAr: 'وادي رم', nameEn: 'Wadi Rum', type: 'village' },
        { nameAr: 'القويرة', nameEn: 'Al-Quweira', type: 'town' },
        { nameAr: 'تالا بيه', nameEn: 'Tala Bay', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'السلط (البلقاء)',
      nameEn: 'As-Salt & Balqa',
      stateAr: 'محافظة البلقاء',
      stateEn: 'Balqa Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
      subLocalities: [
        { nameAr: 'الفحيص', nameEn: 'Fuheis', type: 'town' },
        { nameAr: 'ماحص', nameEn: 'Mahis', type: 'town' },
        { nameAr: 'عين الباشا', nameEn: 'Ain Al-Basha', type: 'town' },
        { nameAr: 'الشونة الجنوبية', nameEn: 'Southern Shuna', type: 'town' },
        { nameAr: 'دير علا', nameEn: 'Deir Alla', type: 'town' },
        { nameAr: 'مخيم البقعة', nameEn: 'Baqaa Camp', type: 'camp' },
      ],
    },
    {
      nameAr: 'مادبا',
      nameEn: 'Madaba',
      stateAr: 'محافظة مادبا',
      stateEn: 'Madaba Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
      subLocalities: [
        { nameAr: 'ذيبان', nameEn: 'Dhiban', type: 'town' },
        { nameAr: 'ماعين', nameEn: 'Main', type: 'village' },
      ],
    },
    {
      nameAr: 'الكرك',
      nameEn: 'Al-Karak',
      stateAr: 'محافظة الكرك، المملكة الأردنية الهاشمية',
      stateEn: 'Karak Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
      subLocalities: [
        { nameAr: 'المزار الجنوبي', nameEn: 'Al-Mazar al-Janubi', type: 'town' },
        { nameAr: 'القصر', nameEn: 'Al-Qasr', type: 'town' },
        { nameAr: 'غور الصافي', nameEn: 'Ghor as-Safi', type: 'town' },
        { nameAr: 'القطرانة', nameEn: 'Qatrana', type: 'town' },
      ],
    },
    {
      nameAr: 'جرش',
      nameEn: 'Jerash',
      stateAr: 'محافظة جرش (مدينة الألف عمود)',
      stateEn: 'Jerash Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
    },
    {
      nameAr: 'عجلون',
      nameEn: 'Ajloun',
      stateAr: 'محافظة عجلون',
      stateEn: 'Ajloun Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
    },
    {
      nameAr: 'المفرق',
      nameEn: 'Mafraq',
      stateAr: 'محافظة المفرق',
      stateEn: 'Mafraq Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
    },
    {
      nameAr: 'معان',
      nameEn: 'Maan',
      stateAr: 'محافظة معان (والبتراء)',
      stateEn: 'Maan Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
      subLocalities: [
        { nameAr: 'وادي موسى (البتراء)', nameEn: 'Wadi Musa (Petra)', type: 'city' },
        { nameAr: 'الشوبك', nameEn: 'Shobak', type: 'town' },
      ],
    },
    {
      nameAr: 'الطفيلة',
      nameEn: 'Tafilah',
      stateAr: 'محافظة الطفيلة',
      stateEn: 'Tafilah Governorate',
      countryAr: 'الأردن',
      countryEn: 'Jordan',
      countryCode: 'jo',
      flag: '🇯🇴',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// SAUDI ARABIA (المملكة العربية السعودية)
// ----------------------------------------------------------------------
export const SAUDI_GEO: GeoCountry = {
  code: 'sa',
  nameAr: 'المملكة العربية السعودية',
  nameEn: 'Saudi Arabia',
  flag: '🇸🇦',
  keywords: ['السعودية', 'السعوديه', 'المملكة', 'سعودية', 'saudi', 'ksa', 'riyadh'],
  cities: [
    {
      nameAr: 'الرياض',
      nameEn: 'Riyadh',
      stateAr: 'منطقة الرياض (العاصمة)',
      stateEn: 'Riyadh Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'capital',
      subLocalities: [
        { nameAr: 'العليا', nameEn: 'Al-Olaya', type: 'neighborhood' },
        { nameAr: 'النرجس', nameEn: 'An-Narjis', type: 'neighborhood' },
        { nameAr: 'الياسمين', nameEn: 'Al-Yasmin', type: 'neighborhood' },
        { nameAr: 'الملقا', nameEn: 'Al-Malqa', type: 'neighborhood' },
        { nameAr: 'حطين', nameEn: 'Hittin', type: 'neighborhood' },
        { nameAr: 'الدرعية', nameEn: 'Diriyah', type: 'city' },
        { nameAr: 'السليمانية', nameEn: 'Al-Sulaimaniyah', type: 'neighborhood' },
        { nameAr: 'الصحافة', nameEn: 'As-Sahafa', type: 'neighborhood' },
        { nameAr: 'الشفا', nameEn: 'Ash-Shifa', type: 'neighborhood' },
        { nameAr: 'النسيم', nameEn: 'An-Naseem', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'جدة',
      nameEn: 'Jeddah',
      stateAr: 'منطقة مكة المكرمة (عروس البحر الأحمر)',
      stateEn: 'Makkah Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
      subLocalities: [
        { nameAr: 'الروضة', nameEn: 'Al-Rawdah', type: 'neighborhood' },
        { nameAr: 'الحمراء', nameEn: 'Al-Hamra', type: 'neighborhood' },
        { nameAr: 'المرجان', nameEn: 'Al-Murjan', type: 'neighborhood' },
        { nameAr: 'الشاطئ', nameEn: 'Al-Shati', type: 'neighborhood' },
        { nameAr: 'أبحر الشمالية', nameEn: 'North Obhur', type: 'neighborhood' },
        { nameAr: 'البلد (التاريخية)', nameEn: 'Al-Balad', type: 'neighborhood' },
        { nameAr: 'الصفا', nameEn: 'Al-Safa', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'مكة المكرمة',
      nameEn: 'Makkah',
      stateAr: 'منطقة مكة المكرمة (العاصمة المقدسة)',
      stateEn: 'Makkah Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
      subLocalities: [
        { nameAr: 'العزيزية', nameEn: 'Al-Aziziyah', type: 'neighborhood' },
        { nameAr: 'العوالي', nameEn: 'Al-Awali', type: 'neighborhood' },
        { nameAr: 'الشوقية', nameEn: 'Ash-Shawqiyyah', type: 'neighborhood' },
        { nameAr: 'بطحاء قريش', nameEn: 'Batha Quraish', type: 'neighborhood' },
        { nameAr: 'النوارية', nameEn: 'An-Nawwariyyah', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'المدينة المنورة',
      nameEn: 'Madinah',
      stateAr: 'منطقة المدينة المنورة (طيبة الطيبة)',
      stateEn: 'Madinah Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
      subLocalities: [
        { nameAr: 'قباء', nameEn: 'Quba', type: 'neighborhood' },
        { nameAr: 'العوالي', nameEn: 'Al-Awali', type: 'neighborhood' },
        { nameAr: 'الخالدية', nameEn: 'Al-Khalidiyyah', type: 'neighborhood' },
        { nameAr: 'العقيق', nameEn: 'Al-Aqiq', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'الدمام والخبر (الشرقية)',
      nameEn: 'Dammam & Khobar',
      stateAr: 'المنطقة الشرقية',
      stateEn: 'Eastern Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
      subLocalities: [
        { nameAr: 'الدمام', nameEn: 'Dammam', type: 'city' },
        { nameAr: 'الخبر', nameEn: 'Khobar', type: 'city' },
        { nameAr: 'الظهران', nameEn: 'Dhahran', type: 'city' },
        { nameAr: 'القطيف', nameEn: 'Qatif', type: 'city' },
        { nameAr: 'الجبيل', nameEn: 'Jubail', type: 'city' },
        { nameAr: 'الأحساء (الهفوف والمبرز)', nameEn: 'Al-Ahsa', type: 'city' },
        { nameAr: 'حفر الباطن', nameEn: 'Hafar Al-Batin', type: 'city' },
      ],
    },
    {
      nameAr: 'تبوك',
      nameEn: 'Tabuk',
      stateAr: 'منطقة تبوك (ونيوم)',
      stateEn: 'Tabuk Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
    },
    {
      nameAr: 'أبها وخميس مشيط',
      nameEn: 'Abha & Khamis Mushait',
      stateAr: 'منطقة عسير',
      stateEn: 'Asir Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
    },
    {
      nameAr: 'جازان',
      nameEn: 'Jazan',
      stateAr: 'منطقة جازان',
      stateEn: 'Jazan Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
    },
    {
      nameAr: 'بريدة وعنيزة (القصيم)',
      nameEn: 'Buraidah & Unaizah',
      stateAr: 'منطقة القصيم',
      stateEn: 'Qassim Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
    },
    {
      nameAr: 'حائل',
      nameEn: 'Hail',
      stateAr: 'منطقة حائل',
      stateEn: 'Hail Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
    },
    {
      nameAr: 'نجران',
      nameEn: 'Najran',
      stateAr: 'منطقة نجران',
      stateEn: 'Najran Province',
      countryAr: 'المملكة العربية السعودية',
      countryEn: 'Saudi Arabia',
      countryCode: 'sa',
      flag: '🇸🇦',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// EGYPT (جمهورية مصر العربية)
// ----------------------------------------------------------------------
export const EGYPT_GEO: GeoCountry = {
  code: 'eg',
  nameAr: 'مصر',
  nameEn: 'Egypt',
  flag: '🇪🇬',
  keywords: ['مصر', 'أم الدنيا', 'مصري', 'egypt', 'egyptian', 'cairo'],
  cities: [
    {
      nameAr: 'القاهرة',
      nameEn: 'Cairo',
      stateAr: 'محافظة القاهرة (العاصمة)',
      stateEn: 'Cairo Governorate',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'capital',
      subLocalities: [
        { nameAr: 'مدينة نصر', nameEn: 'Nasr City', type: 'neighborhood' },
        { nameAr: 'مصر الجديدة', nameEn: 'Heliopolis', type: 'neighborhood' },
        { nameAr: 'المعادي', nameEn: 'Maadi', type: 'neighborhood' },
        { nameAr: 'التجمع الخامس (القاهرة الجديدة)', nameEn: 'New Cairo / 5th Settlement', type: 'city' },
        { nameAr: 'الزمالك', nameEn: 'Zamalek', type: 'neighborhood' },
        { nameAr: 'شبرا', nameEn: 'Shubra', type: 'neighborhood' },
        { nameAr: 'حلوان', nameEn: 'Helwan', type: 'neighborhood' },
        { nameAr: 'وسط البلد', nameEn: 'Downtown Cairo', type: 'neighborhood' },
        { nameAr: 'الشروق وبدر', nameEn: 'Al-Shorouk & Badr', type: 'city' },
        { nameAr: 'الرحاب ومدينتي', nameEn: 'Rehab & Madinaty', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'الجيزة',
      nameEn: 'Giza',
      stateAr: 'محافظة الجيزة',
      stateEn: 'Giza Governorate',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
      subLocalities: [
        { nameAr: 'الدقي', nameEn: 'Dokki', type: 'neighborhood' },
        { nameAr: 'المهندسين', nameEn: 'Mohandessin', type: 'neighborhood' },
        { nameAr: 'مدينة 6 أكتوبر', nameEn: '6th of October City', type: 'city' },
        { nameAr: 'الشيخ زايد', nameEn: 'Sheikh Zayed City', type: 'city' },
        { nameAr: 'الهرم وفيصل', nameEn: 'Haram & Faisal', type: 'neighborhood' },
        { nameAr: 'العجوزة', nameEn: 'Agouza', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'الإسكندرية',
      nameEn: 'Alexandria',
      stateAr: 'محافظة الإسكندرية (عروس البحر الأبيض)',
      stateEn: 'Alexandria Governorate',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
      subLocalities: [
        { nameAr: 'سموحة', nameEn: 'Smouha', type: 'neighborhood' },
        { nameAr: 'سيدي جابر', nameEn: 'Sidi Gaber', type: 'neighborhood' },
        { nameAr: 'المنتزه', nameEn: 'Montaza', type: 'neighborhood' },
        { nameAr: 'لوران', nameEn: 'Loran', type: 'neighborhood' },
        { nameAr: 'ميامي', nameEn: 'Miami', type: 'neighborhood' },
        { nameAr: 'بحري والأنفوشي', nameEn: 'Bahary', type: 'neighborhood' },
        { nameAr: 'العجمي', nameEn: 'Agami', type: 'neighborhood' },
        { nameAr: 'برج العرب', nameEn: 'Borg El-Arab', type: 'city' },
      ],
    },
    {
      nameAr: 'المنصورة (الدقهلية)',
      nameEn: 'Mansoura (Dakahlia)',
      stateAr: 'عاصمة محافظة الدقهلية، جمهورية مصر العربية',
      stateEn: 'Dakahlia Governorate, Egypt',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
      subLocalities: [
        { nameAr: 'ميت غمر', nameEn: 'Mit Ghamr', type: 'city' },
        { nameAr: 'طلخا', nameEn: 'Talkha', type: 'city' },
        { nameAr: 'السنبلاوين', nameEn: 'El-Sinbillawin', type: 'city' },
        { nameAr: 'دكرنس', nameEn: 'Dikirnis', type: 'city' },
        { nameAr: 'بلقاس', nameEn: 'Belqas', type: 'city' },
        { nameAr: 'جمصة', nameEn: 'Gamasa', type: 'city' },
      ],
    },
    {
      nameAr: 'طنطا (الغربية)',
      nameEn: 'Tanta',
      stateAr: 'محافظة الغربية، مصر',
      stateEn: 'Gharbia Governorate',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
      subLocalities: [
        { nameAr: 'المحلة الكبرى', nameEn: 'El-Mahalla El-Kubra', type: 'city' },
        { nameAr: 'زفتى', nameEn: 'Zefta', type: 'city' },
        { nameAr: 'كفر الزيات', nameEn: 'Kafr El-Zayat', type: 'city' },
      ],
    },
    {
      nameAr: 'بورسعيد',
      nameEn: 'Port Said',
      stateAr: 'محافظة بورسعيد (المدينة الباسلة)',
      stateEn: 'Port Said',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
      subLocalities: [
        { nameAr: 'بورفؤاد', nameEn: 'Port Fouad', type: 'city' },
      ],
    },
    {
      nameAr: 'السويس',
      nameEn: 'Suez',
      stateAr: 'محافظة السويس',
      stateEn: 'Suez',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
    },
    {
      nameAr: 'الإسماعيلية',
      nameEn: 'Ismailia',
      stateAr: 'محافظة الإسماعيلية',
      stateEn: 'Ismailia',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
    },
    {
      nameAr: 'شرم الشيخ والغردقة',
      nameEn: 'Sharm El-Sheikh & Hurghada',
      stateAr: 'جنوب سيناء والبحر الأحمر',
      stateEn: 'Red Sea & Sinai',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
    },
    {
      nameAr: 'الأقصر وأسوان',
      nameEn: 'Luxor & Aswan',
      stateAr: 'صعيد مصر',
      stateEn: 'Upper Egypt',
      countryAr: 'مصر',
      countryEn: 'Egypt',
      countryCode: 'eg',
      flag: '🇪🇬',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// UAE (دولة الإمارات العربية المتحدة)
// ----------------------------------------------------------------------
export const UAE_GEO: GeoCountry = {
  code: 'ae',
  nameAr: 'الإمارات العربية المتحدة',
  nameEn: 'United Arab Emirates',
  flag: '🇦🇪',
  keywords: ['الامارات', 'الإمارات', 'إمارات', 'uae', 'dubai', 'abu dhabi', 'emirates'],
  cities: [
    {
      nameAr: 'دبي',
      nameEn: 'Dubai',
      stateAr: 'إمارة دبي',
      stateEn: 'Emirate of Dubai',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'city',
      subLocalities: [
        { nameAr: 'داون تاون دبي (برج خليفة)', nameEn: 'Downtown Dubai', type: 'neighborhood' },
        { nameAr: 'دبي مارينا', nameEn: 'Dubai Marina', type: 'neighborhood' },
        { nameAr: 'الخليج التجاري', nameEn: 'Business Bay', type: 'neighborhood' },
        { nameAr: 'نخلة جميرا', nameEn: 'Palm Jumeirah', type: 'neighborhood' },
        { nameAr: 'جميرا (JBR)', nameEn: 'JBR', type: 'neighborhood' },
        { nameAr: 'ديرة', nameEn: 'Deira', type: 'neighborhood' },
        { nameAr: 'بر دبي', nameEn: 'Bur Dubai', type: 'neighborhood' },
        { nameAr: 'البرشاء', nameEn: 'Al-Barsha', type: 'neighborhood' },
        { nameAr: 'مردف', nameEn: 'Mirdif', type: 'neighborhood' },
        { nameAr: 'واحة دبي للسيليكون', nameEn: 'Silicon Oasis', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'أبوظبي',
      nameEn: 'Abu Dhabi',
      stateAr: 'إمارة أبوظبي (العاصمة الاتحادية)',
      stateEn: 'Emirate of Abu Dhabi',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'capital',
      subLocalities: [
        { nameAr: 'الكورنيش', nameEn: 'Corniche', type: 'neighborhood' },
        { nameAr: 'جزيرة ياس', nameEn: 'Yas Island', type: 'neighborhood' },
        { nameAr: 'جزيرة السعديات', nameEn: 'Saadiyat Island', type: 'neighborhood' },
        { nameAr: 'جزيرة الريم', nameEn: 'Al-Reem Island', type: 'neighborhood' },
        { nameAr: 'الخالدية', nameEn: 'Al-Khalidiyah', type: 'neighborhood' },
        { nameAr: 'البطين', nameEn: 'Al-Bateen', type: 'neighborhood' },
        { nameAr: 'مصفح', nameEn: 'Mussafah', type: 'neighborhood' },
        { nameAr: 'مدينة خليفة', nameEn: 'Khalifa City', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'الشارقة',
      nameEn: 'Sharjah',
      stateAr: 'إمارة الشارقة',
      stateEn: 'Emirate of Sharjah',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'city',
      subLocalities: [
        { nameAr: 'المجاز', nameEn: 'Al-Majaz', type: 'neighborhood' },
        { nameAr: 'النهدة', nameEn: 'Al-Nahda', type: 'neighborhood' },
        { nameAr: 'مويلح', nameEn: 'Muwailih', type: 'neighborhood' },
        { nameAr: 'خورفكان', nameEn: 'Khorfakkan', type: 'city' },
        { nameAr: 'كلباء', nameEn: 'Kalba', type: 'city' },
      ],
    },
    {
      nameAr: 'العين',
      nameEn: 'Al Ain',
      stateAr: 'إمارة أبوظبي (المنطقة الشرقية)',
      stateEn: 'Abu Dhabi',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'city',
    },
    {
      nameAr: 'عجمان',
      nameEn: 'Ajman',
      stateAr: 'إمارة عجمان',
      stateEn: 'Emirate of Ajman',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'city',
    },
    {
      nameAr: 'رأس الخيمة',
      nameEn: 'Ras Al Khaimah',
      stateAr: 'إمارة رأس الخيمة',
      stateEn: 'Ras Al Khaimah',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'city',
    },
    {
      nameAr: 'الفجيرة',
      nameEn: 'Fujairah',
      stateAr: 'إمارة الفجيرة',
      stateEn: 'Fujairah',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'city',
    },
    {
      nameAr: 'أم القيوين',
      nameEn: 'Umm Al Quwain',
      stateAr: 'إمارة أم القيوين',
      stateEn: 'Umm Al Quwain',
      countryAr: 'الإمارات العربية المتحدة',
      countryEn: 'United Arab Emirates',
      countryCode: 'ae',
      flag: '🇦🇪',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// LEBANON (الجمهورية اللبنانية)
// ----------------------------------------------------------------------
export const LEBANON_GEO: GeoCountry = {
  code: 'lb',
  nameAr: 'لبنان',
  nameEn: 'Lebanon',
  flag: '🇱🇧',
  keywords: ['لبنان', 'لبناني', 'lebanon', 'beirut'],
  cities: [
    {
      nameAr: 'بيروت',
      nameEn: 'Beirut',
      stateAr: 'محافظة بيروت (العاصمة)',
      stateEn: 'Beirut Governorate',
      countryAr: 'لبنان',
      countryEn: 'Lebanon',
      countryCode: 'lb',
      flag: '🇱🇧',
      type: 'capital',
      subLocalities: [
        { nameAr: 'الحمراء', nameEn: 'Hamra', type: 'neighborhood' },
        { nameAr: 'الأشرفية', nameEn: 'Achrafieh', type: 'neighborhood' },
        { nameAr: 'الروشة', nameEn: 'Raouche', type: 'neighborhood' },
        { nameAr: 'عين المريسة', nameEn: 'Ain El Mreisseh', type: 'neighborhood' },
        { nameAr: 'وسط بيروت', nameEn: 'Downtown Beirut', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'طرابلس (لبنان)',
      nameEn: 'Tripoli (Lebanon)',
      stateAr: 'عاصمة محافظة الشمال، الجمهورية اللبنانية',
      stateEn: 'North Governorate, Lebanon',
      countryAr: 'لبنان',
      countryEn: 'Lebanon',
      countryCode: 'lb',
      flag: '🇱🇧',
      type: 'city',
      subLocalities: [
        { nameAr: 'الميناء', nameEn: 'El-Mina', type: 'city' },
        { nameAr: 'التل', nameEn: 'At-Tall', type: 'neighborhood' },
        { nameAr: 'القبة', nameEn: 'Al-Qubbah', type: 'neighborhood' },
        { nameAr: 'أبي سمراء', nameEn: 'Abi Samra', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'صيدا',
      nameEn: 'Sidon (Saida)',
      stateAr: 'محافظة الجنوب، لبنان',
      stateEn: 'South Governorate',
      countryAr: 'لبنان',
      countryEn: 'Lebanon',
      countryCode: 'lb',
      flag: '🇱🇧',
      type: 'city',
    },
    {
      nameAr: 'صور',
      nameEn: 'Tyre (Sour)',
      stateAr: 'محافظة الجنوب، لبنان',
      stateEn: 'South Governorate',
      countryAr: 'لبنان',
      countryEn: 'Lebanon',
      countryCode: 'lb',
      flag: '🇱🇧',
      type: 'city',
    },
    {
      nameAr: 'زحلة والبقاع',
      nameEn: 'Zahle & Bekaa',
      stateAr: 'محافظة البقاع، لبنان',
      stateEn: 'Bekaa Governorate',
      countryAr: 'لبنان',
      countryEn: 'Lebanon',
      countryCode: 'lb',
      flag: '🇱🇧',
      type: 'city',
      subLocalities: [
        { nameAr: 'الكرك (زحلة)', nameEn: 'Karak (Zahle)', type: 'village' },
        { nameAr: 'شتورا', nameEn: 'Chtaura', type: 'town' },
      ],
    },
    {
      nameAr: 'جبيل وجونية',
      nameEn: 'Byblos & Jounieh',
      stateAr: 'محافظة جبل لبنان',
      stateEn: 'Mount Lebanon',
      countryAr: 'لبنان',
      countryEn: 'Lebanon',
      countryCode: 'lb',
      flag: '🇱🇧',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// LIBYA (دولة ليبيا)
// ----------------------------------------------------------------------
export const LIBYA_GEO: GeoCountry = {
  code: 'ly',
  nameAr: 'ليبيا',
  nameEn: 'Libya',
  flag: '🇱🇾',
  keywords: ['ليبيا', 'ليبي', 'libya', 'tripoli'],
  cities: [
    {
      nameAr: 'طرابلس (ليبيا)',
      nameEn: 'Tripoli (Libya)',
      stateAr: 'العاصمة، دولة ليبيا (عروس البحر الأبيض)',
      stateEn: 'Capital of Libya',
      countryAr: 'ليبيا',
      countryEn: 'Libya',
      countryCode: 'ly',
      flag: '🇱🇾',
      type: 'capital',
      subLocalities: [
        { nameAr: 'تاجوراء', nameEn: 'Tajoura', type: 'city' },
        { nameAr: 'سوق الجمعة', nameEn: 'Souq al-Jumaa', type: 'neighborhood' },
        { nameAr: 'حي الأندلس', nameEn: 'Hay al-Andalus', type: 'neighborhood' },
        { nameAr: 'جنزور', nameEn: 'Janzour', type: 'city' },
        { nameAr: 'أبوسليم', nameEn: 'Abu Salim', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'بنغازي',
      nameEn: 'Benghazi',
      stateAr: 'شعبية بنغازي، ليبيا',
      stateEn: 'Benghazi',
      countryAr: 'ليبيا',
      countryEn: 'Libya',
      countryCode: 'ly',
      flag: '🇱🇾',
      type: 'city',
    },
    {
      nameAr: 'مصراتة',
      nameEn: 'Misrata',
      stateAr: 'شعبية مصراتة، ليبيا',
      stateEn: 'Misrata',
      countryAr: 'ليبيا',
      countryEn: 'Libya',
      countryCode: 'ly',
      flag: '🇱🇾',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// YEMEN (الجمهورية اليمنية)
// ----------------------------------------------------------------------
export const YEMEN_GEO: GeoCountry = {
  code: 'ye',
  nameAr: 'اليمن',
  nameEn: 'Yemen',
  flag: '🇾🇪',
  keywords: ['اليمن', 'يمني', 'yemen', 'sanaa', 'aden'],
  cities: [
    {
      nameAr: 'صنعاء',
      nameEn: 'Sanaa',
      stateAr: 'العاصمة، الجمهورية اليمنية',
      stateEn: 'Capital of Yemen',
      countryAr: 'اليمن',
      countryEn: 'Yemen',
      countryCode: 'ye',
      flag: '🇾🇪',
      type: 'capital',
      subLocalities: [
        { nameAr: 'صنعاء القديمة', nameEn: 'Old City of Sanaa', type: 'neighborhood' },
        { nameAr: 'حدة', nameEn: 'Hadda', type: 'neighborhood' },
        { nameAr: 'السبعين', nameEn: 'As-Sabeen', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'عدن',
      nameEn: 'Aden',
      stateAr: 'محافظة عدن، الجمهورية اليمنية',
      stateEn: 'Aden Governorate',
      countryAr: 'اليمن',
      countryEn: 'Yemen',
      countryCode: 'ye',
      flag: '🇾🇪',
      type: 'city',
      subLocalities: [
        { nameAr: 'كريتر (صيره)', nameEn: 'Crater', type: 'neighborhood' },
        { nameAr: 'المعلا', nameEn: 'Al-Mualla', type: 'neighborhood' },
        { nameAr: 'التواهي', nameEn: 'At-Tawahi', type: 'neighborhood' },
        { nameAr: 'المنصورة (عدن)', nameEn: 'Al-Mansoura (Aden)', type: 'district' },
        { nameAr: 'الشيخ عثمان', nameEn: 'Sheikh Othman', type: 'district' },
        { nameAr: 'خور مكسر', nameEn: 'Khor Maksar', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'تعز',
      nameEn: 'Taiz',
      stateAr: 'محافظة تعز، اليمن',
      stateEn: 'Taiz Governorate',
      countryAr: 'اليمن',
      countryEn: 'Yemen',
      countryCode: 'ye',
      flag: '🇾🇪',
      type: 'city',
    },
    {
      nameAr: 'المكلا وحضرموت',
      nameEn: 'Mukalla & Hadramout',
      stateAr: 'محافظة حضرموت، اليمن',
      stateEn: 'Hadramout',
      countryAr: 'اليمن',
      countryEn: 'Yemen',
      countryCode: 'ye',
      flag: '🇾🇪',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// IRAQ (جمهورية العراق)
// ----------------------------------------------------------------------
export const IRAQ_GEO: GeoCountry = {
  code: 'iq',
  nameAr: 'العراق',
  nameEn: 'Iraq',
  flag: '🇮🇶',
  keywords: ['العراق', 'عراقي', 'iraq', 'iraqi', 'baghdad'],
  cities: [
    {
      nameAr: 'بغداد',
      nameEn: 'Baghdad',
      stateAr: 'محافظة بغداد (العاصمة)',
      stateEn: 'Baghdad Governorate',
      countryAr: 'العراق',
      countryEn: 'Iraq',
      countryCode: 'iq',
      flag: '🇮🇶',
      type: 'capital',
      subLocalities: [
        { nameAr: 'الكرادة', nameEn: 'Karrada', type: 'neighborhood' },
        { nameAr: 'المنصور', nameEn: 'Al-Mansour', type: 'neighborhood' },
        { nameAr: 'الجادرية', nameEn: 'Jadriya', type: 'neighborhood' },
        { nameAr: 'زيونة', nameEn: 'Zayouna', type: 'neighborhood' },
        { nameAr: 'الأعظمية', nameEn: 'Adhamiyah', type: 'neighborhood' },
        { nameAr: 'الكاظمية', nameEn: 'Kadhimiya', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'أربيل',
      nameEn: 'Erbil',
      stateAr: 'إقليم كردستان العراق',
      stateEn: 'Erbil',
      countryAr: 'العراق',
      countryEn: 'Iraq',
      countryCode: 'iq',
      flag: '🇮🇶',
      type: 'city',
    },
    {
      nameAr: 'البصرة',
      nameEn: 'Basra',
      stateAr: 'محافظة البصرة (ثغر العراق الباسم)',
      stateEn: 'Basra',
      countryAr: 'العراق',
      countryEn: 'Iraq',
      countryCode: 'iq',
      flag: '🇮🇶',
      type: 'city',
    },
    {
      nameAr: 'الموصل',
      nameEn: 'Mosul',
      stateAr: 'محافظة نينوى، العراق',
      stateEn: 'Nineveh',
      countryAr: 'العراق',
      countryEn: 'Iraq',
      countryCode: 'iq',
      flag: '🇮🇶',
      type: 'city',
    },
    {
      nameAr: 'النجف الأشرف وكربلاء',
      nameEn: 'Najaf & Karbala',
      stateAr: 'الفرات الأوسط، العراق',
      stateEn: 'Middle Euphrates',
      countryAr: 'العراق',
      countryEn: 'Iraq',
      countryCode: 'iq',
      flag: '🇮🇶',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// SYRIA (الجمهورية العربية السورية)
// ----------------------------------------------------------------------
export const SYRIA_GEO: GeoCountry = {
  code: 'sy',
  nameAr: 'سوريا',
  nameEn: 'Syria',
  flag: '🇸🇾',
  keywords: ['سوريا', 'سورية', 'سوري', 'syria', 'damascus'],
  cities: [
    {
      nameAr: 'دمشق',
      nameEn: 'Damascus',
      stateAr: 'محافظة دمشق (العاصمة)',
      stateEn: 'Damascus Governorate',
      countryAr: 'سوريا',
      countryEn: 'Syria',
      countryCode: 'sy',
      flag: '🇸🇾',
      type: 'capital',
      subLocalities: [
        { nameAr: 'المزة', nameEn: 'Mezzeh', type: 'neighborhood' },
        { nameAr: 'المالكي', nameEn: 'Malki', type: 'neighborhood' },
        { nameAr: 'أبو رمانة', nameEn: 'Abu Rummaneh', type: 'neighborhood' },
        { nameAr: 'الميدان', nameEn: 'Midan', type: 'neighborhood' },
        { nameAr: 'دمشق القديمة', nameEn: 'Old Damascus', type: 'neighborhood' },
      ],
    },
    {
      nameAr: 'حلب',
      nameEn: 'Aleppo',
      stateAr: 'محافظة حلب (الشهباء)',
      stateEn: 'Aleppo Governorate',
      countryAr: 'سوريا',
      countryEn: 'Syria',
      countryCode: 'sy',
      flag: '🇸🇾',
      type: 'city',
    },
    {
      nameAr: 'حمص',
      nameEn: 'Homs',
      stateAr: 'محافظة حمص',
      stateEn: 'Homs Governorate',
      countryAr: 'سوريا',
      countryEn: 'Syria',
      countryCode: 'sy',
      flag: '🇸🇾',
      type: 'city',
    },
    {
      nameAr: 'اللاذقية وطرطوس',
      nameEn: 'Latakia & Tartus',
      stateAr: 'الساحل السوري',
      stateEn: 'Syrian Coast',
      countryAr: 'سوريا',
      countryEn: 'Syria',
      countryCode: 'sy',
      flag: '🇸🇾',
      type: 'city',
    },
  ],
};

// ----------------------------------------------------------------------
// QATAR, KUWAIT, BAHRAIN, OMAN
// ----------------------------------------------------------------------
export const QATAR_GEO: GeoCountry = {
  code: 'qa',
  nameAr: 'قطر',
  nameEn: 'Qatar',
  flag: '🇶🇦',
  keywords: ['قطر', 'قطري', 'qatar', 'doha'],
  cities: [
    {
      nameAr: 'الدوحة',
      nameEn: 'Doha',
      stateAr: 'بلدية الدوحة (العاصمة)',
      stateEn: 'Doha Municipality',
      countryAr: 'قطر',
      countryEn: 'Qatar',
      countryCode: 'qa',
      flag: '🇶🇦',
      type: 'capital',
      subLocalities: [
        { nameAr: 'لوسيل', nameEn: 'Lusail', type: 'city' },
        { nameAr: 'اللؤلؤة', nameEn: 'The Pearl', type: 'neighborhood' },
        { nameAr: 'الدفنة', nameEn: 'West Bay / Dafna', type: 'neighborhood' },
        { nameAr: 'مشيرب', nameEn: 'Msheireb', type: 'neighborhood' },
      ],
    },
    { nameAr: 'الريان', nameEn: 'Al Rayyan', countryAr: 'قطر', countryEn: 'Qatar', countryCode: 'qa', flag: '🇶🇦', type: 'city' },
    { nameAr: 'الوكرة', nameEn: 'Al Wakrah', countryAr: 'قطر', countryEn: 'Qatar', countryCode: 'qa', flag: '🇶🇦', type: 'city' },
    { nameAr: 'الخور', nameEn: 'Al Khor', countryAr: 'قطر', countryEn: 'Qatar', countryCode: 'qa', flag: '🇶🇦', type: 'city' },
  ],
};

export const KUWAIT_GEO: GeoCountry = {
  code: 'kw',
  nameAr: 'الكويت',
  nameEn: 'Kuwait',
  flag: '🇰🇼',
  keywords: ['الكويت', 'كويتي', 'kuwait'],
  cities: [
    {
      nameAr: 'مدينة الكويت',
      nameEn: 'Kuwait City',
      stateAr: 'العاصمة الكويت',
      stateEn: 'Capital Governorate',
      countryAr: 'الكويت',
      countryEn: 'Kuwait',
      countryCode: 'kw',
      flag: '🇰🇼',
      type: 'capital',
      subLocalities: [
        { nameAr: 'السالمية', nameEn: 'Salmiya', type: 'neighborhood' },
        { nameAr: 'حولي', nameEn: 'Hawalli', type: 'neighborhood' },
        { nameAr: 'الفروانية', nameEn: 'Farwaniya', type: 'neighborhood' },
        { nameAr: 'الأحمدي', nameEn: 'Ahmadi', type: 'neighborhood' },
        { nameAr: 'الجهراء', nameEn: 'Jahra', type: 'neighborhood' },
      ],
    },
  ],
};

export const BAHRAIN_GEO: GeoCountry = {
  code: 'bh',
  nameAr: 'البحرين',
  nameEn: 'Bahrain',
  flag: '🇧🇭',
  keywords: ['البحرين', 'بحريني', 'bahrain', 'manama'],
  cities: [
    {
      nameAr: 'المنامة',
      nameEn: 'Manama',
      stateAr: 'محافظة العاصمة، البحرين',
      stateEn: 'Capital Governorate',
      countryAr: 'البحرين',
      countryEn: 'Bahrain',
      countryCode: 'bh',
      flag: '🇧🇭',
      type: 'capital',
      subLocalities: [
        { nameAr: 'المحرق', nameEn: 'Muharraq', type: 'city' },
        { nameAr: 'الرفاع', nameEn: 'Riffa', type: 'city' },
        { nameAr: 'الجفير', nameEn: 'Juffair', type: 'neighborhood' },
        { nameAr: 'سيف', nameEn: 'Seef', type: 'neighborhood' },
      ],
    },
  ],
};

export const OMAN_GEO: GeoCountry = {
  code: 'om',
  nameAr: 'سلطنة عمان',
  nameEn: 'Oman',
  flag: '🇴🇲',
  keywords: ['عمان', 'عُمان', 'سلطنة عمان', 'عماني', 'oman', 'muscat'],
  cities: [
    {
      nameAr: 'مسقط',
      nameEn: 'Muscat',
      stateAr: 'محافظة مسقط (العاصمة)',
      stateEn: 'Muscat Governorate',
      countryAr: 'سلطنة عمان',
      countryEn: 'Oman',
      countryCode: 'om',
      flag: '🇴🇲',
      type: 'capital',
      subLocalities: [
        { nameAr: 'السيب', nameEn: 'Seeb', type: 'neighborhood' },
        { nameAr: 'بوشر', nameEn: 'Bawshar', type: 'neighborhood' },
        { nameAr: 'مطرح', nameEn: 'Muttrah', type: 'neighborhood' },
      ],
    },
    { nameAr: 'صلالة (ظفار)', nameEn: 'Salalah', stateAr: 'محافظة ظفار', stateEn: 'Dhofar', countryAr: 'سلطنة عمان', countryEn: 'Oman', countryCode: 'om', flag: '🇴🇲', type: 'city' },
    { nameAr: 'صحار', nameEn: 'Sohar', countryAr: 'سلطنة عمان', countryEn: 'Oman', countryCode: 'om', flag: '🇴🇲', type: 'city' },
    { nameAr: 'نزوى', nameEn: 'Nizwa', countryAr: 'سلطنة عمان', countryEn: 'Oman', countryCode: 'om', flag: '🇴🇲', type: 'city' },
  ],
};

// ----------------------------------------------------------------------
// MAGHREB COUNTRIES (المغرب العربي)
// ----------------------------------------------------------------------
export const MOROCCO_GEO: GeoCountry = {
  code: 'ma',
  nameAr: 'المغرب',
  nameEn: 'Morocco',
  flag: '🇲🇦',
  keywords: ['المغرب', 'مغربي', 'المملكة المغربية', 'morocco', 'casablanca', 'rabat'],
  cities: [
    { nameAr: 'الرباط', nameEn: 'Rabat', stateAr: 'عاصمة المملكة المغربية', stateEn: 'Capital of Morocco', countryAr: 'المغرب', countryEn: 'Morocco', countryCode: 'ma', flag: '🇲🇦', type: 'capital' },
    { nameAr: 'الدار البيضاء (كازابلانكا)', nameEn: 'Casablanca', stateAr: 'جهة الدار البيضاء سطات', stateEn: 'Casablanca-Settat', countryAr: 'المغرب', countryEn: 'Morocco', countryCode: 'ma', flag: '🇲🇦', type: 'city' },
    { nameAr: 'مراكش', nameEn: 'Marrakech', stateAr: 'المدينة الحمراء', stateEn: 'Marrakech', countryAr: 'المغرب', countryEn: 'Morocco', countryCode: 'ma', flag: '🇲🇦', type: 'city' },
    { nameAr: 'فاس', nameEn: 'Fez', stateAr: 'العاصمة العلمية', stateEn: 'Fez', countryAr: 'المغرب', countryEn: 'Morocco', countryCode: 'ma', flag: '🇲🇦', type: 'city' },
    { nameAr: 'طنجة', nameEn: 'Tangier', stateAr: 'عروس الشمال', stateEn: 'Tangier', countryAr: 'المغرب', countryEn: 'Morocco', countryCode: 'ma', flag: '🇲🇦', type: 'city' },
    { nameAr: 'أكادير', nameEn: 'Agadir', countryAr: 'المغرب', countryEn: 'Morocco', countryCode: 'ma', flag: '🇲🇦', type: 'city' },
  ],
};

export const ALGERIA_GEO: GeoCountry = {
  code: 'dz',
  nameAr: 'الجزائر',
  nameEn: 'Algeria',
  flag: '🇩🇿',
  keywords: ['الجزائر', 'جزائري', 'algeria', 'algiers'],
  cities: [
    { nameAr: 'الجزائر العاصمة', nameEn: 'Algiers', stateAr: 'ولاية الجزائر (العاصمة)', stateEn: 'Algiers', countryAr: 'الجزائر', countryEn: 'Algeria', countryCode: 'dz', flag: '🇩🇿', type: 'capital' },
    { nameAr: 'وهران', nameEn: 'Oran', stateAr: 'الباهية وهران', stateEn: 'Oran', countryAr: 'الجزائر', countryEn: 'Algeria', countryCode: 'dz', flag: '🇩🇿', type: 'city' },
    { nameAr: 'قسنطينة', nameEn: 'Constantine', stateAr: 'مدينة الجسور المعلقة', stateEn: 'Constantine', countryAr: 'الجزائر', countryEn: 'Algeria', countryCode: 'dz', flag: '🇩🇿', type: 'city' },
    { nameAr: 'عنابة', nameEn: 'Annaba', countryAr: 'الجزائر', countryEn: 'Algeria', countryCode: 'dz', flag: '🇩🇿', type: 'city' },
  ],
};

export const TUNISIA_GEO: GeoCountry = {
  code: 'tn',
  nameAr: 'تونس',
  nameEn: 'Tunisia',
  flag: '🇹🇳',
  keywords: ['تونس', 'تونسي', 'tunisia', 'tunis'],
  cities: [
    { nameAr: 'تونس العاصمة', nameEn: 'Tunis', stateAr: 'ولاية تونس (العاصمة)', stateEn: 'Tunis', countryAr: 'تونس', countryEn: 'Tunisia', countryCode: 'tn', flag: '🇹🇳', type: 'capital' },
    { nameAr: 'صفاقس', nameEn: 'Sfax', countryAr: 'تونس', countryEn: 'Tunisia', countryCode: 'tn', flag: '🇹🇳', type: 'city' },
    { nameAr: 'سوسة', nameEn: 'Sousse', countryAr: 'تونس', countryEn: 'Tunisia', countryCode: 'tn', flag: '🇹🇳', type: 'city' },
    { nameAr: 'بنزرت', nameEn: 'Bizerte', countryAr: 'تونس', countryEn: 'Tunisia', countryCode: 'tn', flag: '🇹🇳', type: 'city' },
  ],
};

export const SUDAN_GEO: GeoCountry = {
  code: 'sd',
  nameAr: 'السودان',
  nameEn: 'Sudan',
  flag: '🇸🇩',
  keywords: ['السودان', 'سوداني', 'sudan', 'khartoum'],
  cities: [
    { nameAr: 'الخرطوم', nameEn: 'Khartoum', stateAr: 'ولاية الخرطوم (العاصمة)', stateEn: 'Khartoum', countryAr: 'السودان', countryEn: 'Sudan', countryCode: 'sd', flag: '🇸🇩', type: 'capital' },
    { nameAr: 'أم درمان', nameEn: 'Omdurman', countryAr: 'السودان', countryEn: 'Sudan', countryCode: 'sd', flag: '🇸🇩', type: 'city' },
    { nameAr: 'بورتسودان', nameEn: 'Port Sudan', countryAr: 'السودان', countryEn: 'Sudan', countryCode: 'sd', flag: '🇸🇩', type: 'city' },
  ],
};

export const TURKEY_GEO: GeoCountry = {
  code: 'tr',
  nameAr: 'تركيا',
  nameEn: 'Turkey',
  flag: '🇹🇷',
  keywords: ['تركيا', 'تركي', 'turkey', 'istanbul', 'ankara'],
  cities: [
    { nameAr: 'إسطنبول', nameEn: 'Istanbul', stateAr: 'محافظة إسطنبول', stateEn: 'Istanbul', countryAr: 'تركيا', countryEn: 'Turkey', countryCode: 'tr', flag: '🇹🇷', type: 'city' },
    { nameAr: 'أنقرة', nameEn: 'Ankara', stateAr: 'العاصمة، الجمهورية التركية', stateEn: 'Capital of Turkey', countryAr: 'تركيا', countryEn: 'Turkey', countryCode: 'tr', flag: '🇹🇷', type: 'capital' },
    { nameAr: 'إزمير', nameEn: 'Izmir', stateAr: 'محافظة إزمير', stateEn: 'Izmir', countryAr: 'تركيا', countryEn: 'Turkey', countryCode: 'tr', flag: '🇹🇷', type: 'city' },
    { nameAr: 'أنطاليا', nameEn: 'Antalya', stateAr: 'محافظة أنطاليا', stateEn: 'Antalya', countryAr: 'تركيا', countryEn: 'Turkey', countryCode: 'tr', flag: '🇹🇷', type: 'city' },
    { nameAr: 'بورصة', nameEn: 'Bursa', stateAr: 'محافظة بورصة', stateEn: 'Bursa', countryAr: 'تركيا', countryEn: 'Turkey', countryCode: 'tr', flag: '🇹🇷', type: 'city' },
  ],
};

// Master List of Supported Countries
export const ALL_GEO_COUNTRIES: GeoCountry[] = [
  PALESTINE_GEO,
  JORDAN_GEO,
  SAUDI_GEO,
  EGYPT_GEO,
  UAE_GEO,
  LEBANON_GEO,
  LIBYA_GEO,
  YEMEN_GEO,
  IRAQ_GEO,
  SYRIA_GEO,
  QATAR_GEO,
  KUWAIT_GEO,
  BAHRAIN_GEO,
  OMAN_GEO,
  MOROCCO_GEO,
  ALGERIA_GEO,
  TUNISIA_GEO,
  SUDAN_GEO,
  TURKEY_GEO,
];

/**
 * Standardized Search Result Object
 */
export interface StandardGeoResult {
  title: string;
  subtitle: string;
  city: string;
  state?: string;
  country: string;
  country_code: string;
  flag: string;
  category_label: string;
  place_type: 'country' | 'city' | 'town' | 'village' | 'camp' | 'neighborhood' | 'capital' | 'governorate' | 'district';
  display_name: string;
  parentCity?: string;
  lat?: string;
  lon?: string;
}

/**
 * Normalizes Arabic string for fuzzy, resilient matching (removes accents, normalizes alifs, etc.)
 */
export function normalizeGeoText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // Remove Arabic harakat/diacritics
    .replace(/\s+/g, ' ');
}

/**
 * Core Hierarchical Search Function
 * - If user types country name -> Returns ONLY cities/governorates of that country (zero foreign mix!).
 * - If user types city name -> Returns the city + its constituent villages/towns/neighborhoods.
 * - If city name exists in multiple countries -> Returns each one with crystal-clear country/state labels.
 * - If user types village/town -> Returns with its parent city and country accurately linked.
 */
export function searchHierarchicalLocations(
  query: string,
  targetCountryFilter?: string,
  lang: 'ar' | 'en' = 'ar'
): StandardGeoResult[] {
  const q = normalizeGeoText(query);
  const results: StandardGeoResult[] = [];
  const addedKeys = new Set<string>();

  const isRtl = lang === 'ar';

  const addResult = (res: StandardGeoResult) => {
    const key = `${res.title}_${res.city}_${res.country}`.toLowerCase();
    if (!addedKeys.has(key)) {
      addedKeys.add(key);
      results.push(res);
    }
  };

  if (!q) {
    // Return top popular default locations
    const defaultCountries = targetCountryFilter
      ? ALL_GEO_COUNTRIES.filter(
          c =>
            normalizeGeoText(c.nameAr) === normalizeGeoText(targetCountryFilter) ||
            normalizeGeoText(c.nameEn) === normalizeGeoText(targetCountryFilter) ||
            c.code.toLowerCase() === targetCountryFilter.toLowerCase()
        )
      : ALL_GEO_COUNTRIES;

    for (const ctry of defaultCountries) {
      for (const city of ctry.cities) {
        const title = isRtl ? city.nameAr : city.nameEn;
        const state = isRtl ? city.stateAr : city.stateEn;
        const country = isRtl ? city.countryAr : city.countryEn;
        const subtitle = state ? `${state}، ${country}` : country;

        let catLabel = isRtl ? 'مدينة' : 'City';
        if (city.type === 'capital') catLabel = isRtl ? 'عاصمة' : 'Capital';
        else if (city.type === 'governorate') catLabel = isRtl ? 'محافظة' : 'Governorate';

        addResult({
          title,
          subtitle,
          city: city.nameAr,
          state: city.stateAr,
          country: city.countryAr,
          country_code: city.countryCode,
          flag: city.flag,
          category_label: catLabel,
          place_type: city.type,
          display_name: `${title}، ${subtitle}`,
        });

        if (results.length >= 25) break;
      }
      if (results.length >= 25) break;
    }
    return results;
  }

  // Determine if targetCountryFilter matches a specific country
  const targetCtryObj = targetCountryFilter
    ? ALL_GEO_COUNTRIES.find(
        (c) =>
          normalizeGeoText(c.nameAr) === normalizeGeoText(targetCountryFilter) ||
          normalizeGeoText(c.nameEn) === normalizeGeoText(targetCountryFilter) ||
          c.code.toLowerCase() === targetCountryFilter.toLowerCase()
      )
    : null;

  // STEP 1: Check if the query itself is a Country Name!
  // e.g. user typed "فلسطين" or "الأردن" or "مصر" or "السعودية" or "Palestine"
  const matchedCountry = ALL_GEO_COUNTRIES.find((c) => {
    const nAr = normalizeGeoText(c.nameAr);
    const nEn = normalizeGeoText(c.nameEn);
    return (
      nAr === q ||
      nEn === q ||
      c.keywords.some((kw) => normalizeGeoText(kw) === q || q.startsWith(normalizeGeoText(kw)))
    );
  });

  if (matchedCountry) {
    // Return ALL cities, capitals, and major districts OF THIS COUNTRY ONLY!
    // No foreign places allowed!
    for (const city of matchedCountry.cities) {
      const title = isRtl ? city.nameAr : city.nameEn;
      const state = isRtl ? city.stateAr : city.stateEn;
      const country = isRtl ? city.countryAr : city.countryEn;
      const subtitle = state ? `${state}، ${country}` : country;

      let catLabel = isRtl ? 'مدينة' : 'City';
      if (city.type === 'capital') catLabel = isRtl ? 'عاصمة' : 'Capital';
      else if (city.type === 'governorate') catLabel = isRtl ? 'محافظة' : 'Governorate';

      addResult({
        title,
        subtitle,
        city: city.nameAr,
        state: city.stateAr,
        country: city.countryAr,
        country_code: city.countryCode,
        flag: city.flag,
        category_label: catLabel,
        place_type: city.type,
        display_name: `${title}، ${subtitle}`,
      });
    }

    return results;
  }

  // STEP 2: The query is not a whole country, so search within countries
  // (either all countries or filtered by targetCountryFilter)
  const candidateCountries = targetCtryObj ? [targetCtryObj] : ALL_GEO_COUNTRIES;

  // 2.A: Check for City Matches (e.g. "الخليل", "دبي", "المنصورة", "طرابلس")
  for (const ctry of candidateCountries) {
    for (const city of ctry.cities) {
      const cityArNorm = normalizeGeoText(city.nameAr);
      const cityEnNorm = normalizeGeoText(city.nameEn);

      const isExactCity = cityArNorm === q || cityEnNorm === q;
      const isPartialCity = cityArNorm.includes(q) || cityEnNorm.includes(q);

      if (isExactCity || isPartialCity) {
        // Add the city itself
        const title = isRtl ? city.nameAr : city.nameEn;
        const state = isRtl ? city.stateAr : city.stateEn;
        const country = isRtl ? city.countryAr : city.countryEn;
        const subtitle = state ? `${state}، ${country}` : country;

        let catLabel = isRtl ? 'مدينة' : 'City';
        if (city.type === 'capital') catLabel = isRtl ? 'عاصمة' : 'Capital';
        else if (city.type === 'governorate') catLabel = isRtl ? 'محافظة' : 'Governorate';

        addResult({
          title,
          subtitle,
          city: city.nameAr,
          state: city.stateAr,
          country: city.countryAr,
          country_code: city.countryCode,
          flag: city.flag,
          category_label: catLabel,
          place_type: city.type,
          display_name: `${title}، ${subtitle}`,
        });

        // If exact city match or strong match, ALSO append its constituent sub-localities (قرى، بلدات، أحياء)!
        if (city.subLocalities && city.subLocalities.length > 0) {
          for (const sub of city.subLocalities) {
            const subTitle = isRtl ? sub.nameAr : sub.nameEn;
            let subCat = isRtl ? 'بلدة' : 'Town';
            if (sub.type === 'village') subCat = isRtl ? 'قرية' : 'Village';
            else if (sub.type === 'camp') subCat = isRtl ? 'مخيم' : 'Camp';
            else if (sub.type === 'neighborhood') subCat = isRtl ? 'حي' : 'Neighborhood';
            else if (sub.type === 'city') subCat = isRtl ? 'مدينة / بلدة' : 'City / Town';

            const subSubtitle = isRtl
              ? `تابع لـ ${city.nameAr} (${city.stateAr || city.countryAr})`
              : `In ${city.nameEn}, ${city.countryEn}`;

            addResult({
              title: subTitle,
              subtitle: subSubtitle,
              city: city.nameAr,
              state: city.stateAr,
              country: city.countryAr,
              country_code: city.countryCode,
              flag: city.flag,
              category_label: subCat,
              place_type: sub.type,
              display_name: `${subTitle}، ${city.nameAr}، ${city.countryAr}`,
              parentCity: city.nameAr,
            });
          }
        }
      }
    }
  }

  // 2.B: Search inside sub-localities (e.g. user typed "دورا" or "يطا" or "حلحول" or "المعادي")
  for (const ctry of candidateCountries) {
    for (const city of ctry.cities) {
      if (!city.subLocalities) continue;
      for (const sub of city.subLocalities) {
        const subArNorm = normalizeGeoText(sub.nameAr);
        const subEnNorm = normalizeGeoText(sub.nameEn);

        if (subArNorm.includes(q) || subEnNorm.includes(q)) {
          const subTitle = isRtl ? sub.nameAr : sub.nameEn;
          let subCat = isRtl ? 'بلدة' : 'Town';
          if (sub.type === 'village') subCat = isRtl ? 'قرية' : 'Village';
          else if (sub.type === 'camp') subCat = isRtl ? 'مخيم' : 'Camp';
          else if (sub.type === 'neighborhood') subCat = isRtl ? 'حي' : 'Neighborhood';
          else if (sub.type === 'city') subCat = isRtl ? 'مدينة / بلدة' : 'City / Town';

          const subSubtitle = isRtl
            ? `${city.stateAr || city.nameAr}، ${city.countryAr}`
            : `${city.stateEn || city.nameEn}, ${city.countryEn}`;

          addResult({
            title: subTitle,
            subtitle: subSubtitle,
            city: city.nameAr,
            state: city.stateAr,
            country: city.countryAr,
            country_code: city.countryCode,
            flag: city.flag,
            category_label: subCat,
            place_type: sub.type,
            display_name: `${subTitle}، ${city.nameAr}، ${city.countryAr}`,
            parentCity: city.nameAr,
          });
        }
      }
    }
  }

  return results;
}
