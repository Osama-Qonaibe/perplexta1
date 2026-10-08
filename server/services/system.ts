import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool } from '../db/index.js';
import { decrypt } from '../utils/crypto.js';
import { getEconomySettings, updateEconomySettings } from './wallet.js';
import { getCachedSystemSettings, invalidateSystemSettingsCache } from '../db/queries.js';
import { normalizeMediaUrl } from './mediaOptimizationService.js';
import { generateAppIconsFromSource } from './systemAssetManager.js';

export { getEconomySettings, updateEconomySettings };

let cachedAppNameEn = '';
let cachedAppNameAr = '';

export async function clearSettingsCache() {
  invalidateSystemSettingsCache();
}

export function resolvePersistentSystemAssetUrl(
  val: string | null | undefined, 
  assetName: 'logo' | 'logo_light' | 'favicon' | 'seo_image' | 'generic' = 'generic'
): string {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:image/')) {
    try {
      const match = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const rawExt = match[1].toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt === 'svg+xml' ? 'svg' : rawExt);
        const buffer = Buffer.from(match[2], 'base64');
        const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 10);
        const filename = `brand_${assetName}_${hash}.${ext}`;
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const brandDir = path.join(uploadsDir, 'brand');
        if (!fs.existsSync(brandDir)) {
          fs.mkdirSync(brandDir, { recursive: true });
        }
        const targetPath = path.join(brandDir, filename);
        const rootPath = path.join(uploadsDir, filename);
        if (!fs.existsSync(targetPath)) {
          fs.writeFileSync(targetPath, buffer);
        }
        if (!fs.existsSync(rootPath)) {
          fs.writeFileSync(rootPath, buffer);
        }
        return `/uploads/brand/${filename}`;
      }
    } catch (e: any) {
      console.error(`[SystemAssets] Error resolving base64 asset for ${assetName}:`, e?.message);
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.includes('/uploads/')) {
        return parsed.pathname + parsed.search;
      }
    } catch (e) {}
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export async function ensurePersistentSystemAssets(settings: any) {
  if (!settings) return;
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const brandDir = path.join(uploadsDir, 'brand');
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }

    const fields: Array<{ key: string; name: 'logo' | 'logo_light' | 'favicon' | 'seo_image' }> = [
      { key: 'logo_url', name: 'logo' },
      { key: 'logo_light_url', name: 'logo_light' },
      { key: 'favicon_url', name: 'favicon' },
      { key: 'seo_image_url', name: 'seo_image' }
    ];

    let dbUpdated = false;
    const updates: Record<string, string> = {};

    for (const field of fields) {
      const val = settings[field.key];
      if (!val || typeof val !== 'string') continue;

      if (val.startsWith('data:image/')) {
        try {
          const match = val.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (match) {
            const rawExt = match[1].toLowerCase();
            const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt === 'svg+xml' ? 'svg' : rawExt);
            const buffer = Buffer.from(match[2], 'base64');
            const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 10);
            const filename = `brand_${field.name}_${hash}.${ext}`;
            const targetPath = path.join(brandDir, filename);
            const rootPath = path.join(uploadsDir, filename);
            await fs.promises.writeFile(targetPath, buffer);
            await fs.promises.writeFile(rootPath, buffer);
            const publicUrl = `/uploads/brand/${filename}`;
            updates[field.key] = publicUrl;
            dbUpdated = true;
            console.log(`[SystemAssets] Wrote persistent base64 asset to disk: brand/${filename}`);
          }
        } catch (e: any) {
          console.error(`[SystemAssets] Error writing base64 asset for ${field.key}:`, e.message);
        }
      } else if (val.startsWith('/uploads/') || val.startsWith('uploads/')) {
        const cleanName = path.basename(val.split('?')[0]);
        const targetPathBrand = path.join(brandDir, cleanName);
        const targetPathRoot = path.join(uploadsDir, cleanName);
        if (!fs.existsSync(targetPathBrand) && !fs.existsSync(targetPathRoot)) {
          console.warn(`[SystemAssets] Asset file missing from disk for ${field.key}: ${cleanName}`);
        }
      }
    }

    if (dbUpdated && pool) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let i = 1;
      for (const [k, v] of Object.entries(updates)) {
        setClauses.push(`${k} = $${i}`);
        values.push(v);
        i++;
      }
      if (setClauses.length > 0) {
        try {
          await pool.query(`UPDATE system_settings SET ${setClauses.join(', ')} WHERE id = (SELECT id FROM system_settings LIMIT 1)`, values);
          await clearSettingsCache();
        } catch (err: any) {
          console.warn('[SystemAssets] Non-blocking DB sync for brand asset URLs:', err.message);
        }
      }
    }
  } catch (err: any) {
    console.error('[SystemAssets] Error ensuring persistent assets:', err.message);
  }
}

export async function refreshCachedAppName() {
  try {
    const settings = await getCachedSystemSettings();
    if (settings) {
      cachedAppNameEn = settings.site_name_en || '';
      cachedAppNameAr = settings.site_name_ar || '';
      ensurePersistentSystemAssets(settings).catch(() => {});
    }
  } catch (e) {
    console.error('[System] Failed to refresh cached app name:', e);
  }
}

export async function getSystemSettings() {
  return getCachedSystemSettings();
}

export async function updateSystemSettings(settings: any) {
  const existing = await getSystemSettings();

  let seo_description_en = settings.seo_description_en !== undefined ? settings.seo_description_en : existing.seo_description_en;
  let seo_description_ar = settings.seo_description_ar !== undefined ? settings.seo_description_ar : existing.seo_description_ar;
  let keywords_en = settings.keywords_en !== undefined ? settings.keywords_en : existing.keywords_en;
  let keywords_ar = settings.keywords_ar !== undefined ? settings.keywords_ar : existing.keywords_ar;

  let seo_site_name_en = settings.seo_site_name_en !== undefined ? settings.seo_site_name_en : existing.seo_site_name_en;
  let seo_site_name_ar = settings.seo_site_name_ar !== undefined ? settings.seo_site_name_ar : existing.seo_site_name_ar;

  // Gracefully adopt nested JSON object or string format if sent from Admin Dashboard
  if (settings.seo_site_name) {
    try {
      const parsedTitle = typeof settings.seo_site_name === 'string'
        ? JSON.parse(settings.seo_site_name)
        : settings.seo_site_name;
      if (parsedTitle.en !== undefined) seo_site_name_en = parsedTitle.en;
      if (parsedTitle.ar !== undefined) seo_site_name_ar = parsedTitle.ar;
    } catch (e) {
      console.warn('[System] Failed to parse nested seo_site_name:', e);
    }
  }

  if (settings.seo_description) {
    try {
      const parsedSeo = typeof settings.seo_description === 'string' 
        ? JSON.parse(settings.seo_description) 
        : settings.seo_description;
      if (parsedSeo.en !== undefined) seo_description_en = parsedSeo.en;
      if (parsedSeo.ar !== undefined) seo_description_ar = parsedSeo.ar;
    } catch (e) {
      console.warn('[System] Failed to parse nested seo_description:', e);
    }
  }

  if (settings.keywords) {
    try {
      const parsedKeywords = typeof settings.keywords === 'string' 
        ? JSON.parse(settings.keywords) 
        : settings.keywords;
      if (parsedKeywords.en !== undefined) keywords_en = parsedKeywords.en;
      if (parsedKeywords.ar !== undefined) keywords_ar = parsedKeywords.ar;
    } catch (e) {
      console.warn('[System] Failed to parse nested keywords:', e);
    }
  }

  const site_name_en = settings.site_name_en !== undefined ? settings.site_name_en : existing.site_name_en;
  const site_name_ar = settings.site_name_ar !== undefined ? settings.site_name_ar : existing.site_name_ar;
  const site_description_en = settings.site_description_en !== undefined ? settings.site_description_en : existing.site_description_en;
  const site_description_ar = settings.site_description_ar !== undefined ? settings.site_description_ar : existing.site_description_ar;

  const google_analytics_id = settings.google_analytics_id !== undefined ? settings.google_analytics_id : existing.google_analytics_id;
  const google_site_verification = settings.google_site_verification !== undefined ? settings.google_site_verification : existing.google_site_verification;
  const blocked_paths = settings.blocked_paths !== undefined ? settings.blocked_paths : (existing.blocked_paths || '');

  const bulletin_ad_daily_price = settings.bulletin_ad_daily_price !== undefined ? settings.bulletin_ad_daily_price : (existing.bulletin_ad_daily_price || 5.00);
  const live_gift_commission_percent = settings.live_gift_commission_percent !== undefined ? settings.live_gift_commission_percent : (existing.live_gift_commission_percent || 30);
  const sidebar_ad_impression_price = settings.sidebar_ad_impression_price !== undefined ? settings.sidebar_ad_impression_price : (existing.sidebar_ad_impression_price || 0.0100);
  const sidebar_ad_click_price = settings.sidebar_ad_click_price !== undefined ? settings.sidebar_ad_click_price : (existing.sidebar_ad_click_price || 0.10);
  const sidebar_ads_enabled = settings.sidebar_ads_enabled !== undefined ? Boolean(settings.sidebar_ads_enabled) : (existing?.sidebar_ads_enabled ?? true);

  const quota_warning_threshold_low = settings.quota_warning_threshold_low !== undefined 
    ? Number(settings.quota_warning_threshold_low) 
    : (existing?.quota_warning_threshold_low ?? 50);

  const quota_warning_threshold_high = settings.quota_warning_threshold_high !== undefined 
    ? Number(settings.quota_warning_threshold_high) 
    : (existing?.quota_warning_threshold_high ?? 80);

  let font_loading_config = settings.font_loading_config !== undefined 
    ? (typeof settings.font_loading_config === 'object' ? JSON.stringify(settings.font_loading_config) : settings.font_loading_config)
    : existing.font_loading_config;

  let font_config_ar = settings.font_config_ar !== undefined 
    ? (typeof settings.font_config_ar === 'object' ? JSON.stringify(settings.font_config_ar) : settings.font_config_ar)
    : existing.font_config_ar;

  let font_config_en = settings.font_config_en !== undefined 
    ? (typeof settings.font_config_en === 'object' ? JSON.stringify(settings.font_config_en) : settings.font_config_en)
    : existing.font_config_en;

  if (settings.fontConfig) {
    try {
      const parsedFC = typeof settings.fontConfig === 'string' ? JSON.parse(settings.fontConfig) : settings.fontConfig;
      font_loading_config = JSON.stringify(parsedFC);
      if (parsedFC.ar) font_config_ar = JSON.stringify(parsedFC.ar);
      if (parsedFC.en) font_config_en = JSON.stringify(parsedFC.en);
    } catch (e) {
      console.warn('[System] Failed to parse fontConfig payload:', e);
    }
  }

  // Handle image URLs cleanly: if key is in payload (even if null/empty), update it (allowing deletion); if undefined, preserve existing.
  const logo_url = (settings.logo_url !== undefined)
    ? (settings.logo_url && String(settings.logo_url).trim() !== '' 
        ? resolvePersistentSystemAssetUrl(String(settings.logo_url), 'logo')
        : null)
    : (existing ? resolvePersistentSystemAssetUrl(existing.logo_url, 'logo') : null);

  const logo_light_url = (settings.logo_light_url !== undefined)
    ? (settings.logo_light_url && String(settings.logo_light_url).trim() !== '' 
        ? resolvePersistentSystemAssetUrl(String(settings.logo_light_url), 'logo_light')
        : null)
    : (existing ? resolvePersistentSystemAssetUrl(existing.logo_light_url, 'logo_light') : null);

  const favicon_url = (settings.favicon_url !== undefined)
    ? (settings.favicon_url && String(settings.favicon_url).trim() !== '' 
        ? resolvePersistentSystemAssetUrl(String(settings.favicon_url), 'favicon')
        : null)
    : (existing ? resolvePersistentSystemAssetUrl(existing.favicon_url, 'favicon') : null);

  const seo_image_url = (settings.seo_image_url !== undefined)
    ? (settings.seo_image_url && String(settings.seo_image_url).trim() !== '' 
        ? resolvePersistentSystemAssetUrl(String(settings.seo_image_url), 'seo_image')
        : null)
    : (existing ? resolvePersistentSystemAssetUrl(existing.seo_image_url, 'seo_image') : null);
  
  await pool.query(`
    UPDATE system_settings SET 
      site_name_en = $1, site_name_ar = $2, site_description_en = $3, site_description_ar = $4,
      seo_description_en = $5, seo_description_ar = $6, keywords_en = $7, keywords_ar = $8,
      google_analytics_id = $9, google_site_verification = $10, logo_url = $11, logo_light_url = $12, favicon_url = $13, seo_image_url = $14,
      blocked_paths = $15, seo_site_name_en = $16, seo_site_name_ar = $17, 
      bulletin_ad_daily_price = $18, live_gift_commission_percent = $19, 
      sidebar_ad_impression_price = $20, sidebar_ad_click_price = $21, sidebar_ads_enabled = $22,
      font_loading_config = $23, font_config_ar = $24, font_config_en = $25,
      quota_warning_threshold_low = $26, quota_warning_threshold_high = $27,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $28
  `, [
    site_name_en, site_name_ar, site_description_en, site_description_ar,
    seo_description_en || '', seo_description_ar || '', keywords_en || '', keywords_ar || '',
    google_analytics_id, google_site_verification, logo_url, logo_light_url, favicon_url, seo_image_url,
    blocked_paths, seo_site_name_en || '', seo_site_name_ar || '',
    bulletin_ad_daily_price, live_gift_commission_percent,
    sidebar_ad_impression_price, sidebar_ad_click_price, sidebar_ads_enabled,
    font_loading_config, font_config_ar, font_config_en,
    quota_warning_threshold_low, quota_warning_threshold_high,
    existing.id
  ]);
  
  await clearSettingsCache();
  await refreshCachedAppName();
  await ensurePersistentSystemAssets({ logo_url, logo_light_url, favicon_url, seo_image_url });
  generateAppIconsFromSource(logo_url || favicon_url, { force: true }).catch((err) => {
    console.warn('[System] Auto-generation of PWA icons non-blocking warning:', err.message);
  });
  return { success: true };
}

export async function checkSystemAssetsDiagnostic() {
  const settings = await getCachedSystemSettings();
  if (!settings) {
    return {
      hasOrphanedAssets: false,
      assets: [],
      orphanedKeys: []
    };
  }

  const assetsToCheck = [
    { key: 'logo_url', label: 'Dark Logo (الشعار)' },
    { key: 'logo_light_url', label: 'Light Logo (الشعار الفاتح)' },
    { key: 'favicon_url', label: 'Favicon (أيقونة الموقع)' },
    { key: 'seo_image_url', label: 'SEO Cover Image (صورة المشاركة)' }
  ];

  const results: Array<{
    key: string;
    label: string;
    url: string | null;
    exists: boolean;
    isOrphaned: boolean;
    reason?: string;
  }> = [];

  let hasOrphaned = false;

  for (const item of assetsToCheck) {
    const url = settings[item.key];
    if (!url || typeof url !== 'string' || !url.trim()) {
      results.push({
        key: item.key,
        label: item.label,
        url: null,
        exists: true,
        isOrphaned: false
      });
      continue;
    }

    if (url.startsWith('data:image/')) {
      results.push({
        key: item.key,
        label: item.label,
        url: 'data:image/... (Embedded Base64)',
        exists: true,
        isOrphaned: false
      });
      continue;
    }

    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      const cleanPath = url.split('?')[0].replace(/^\//, '');
      const absPath = path.join(process.cwd(), cleanPath);
      let fileExists = false;
      try {
        await fs.promises.access(absPath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (!fileExists) {
        hasOrphaned = true;
        results.push({
          key: item.key,
          label: item.label,
          url,
          exists: false,
          isOrphaned: true,
          reason: `File missing from server storage disk (${cleanPath})`
        });
      } else {
        results.push({
          key: item.key,
          label: item.label,
          url,
          exists: true,
          isOrphaned: false
        });
      }
    } else {
      results.push({
        key: item.key,
        label: item.label,
        url,
        exists: true,
        isOrphaned: false
      });
    }
  }

  return {
    hasOrphanedAssets: hasOrphaned,
    assets: results,
    orphanedKeys: results.filter(r => r.isOrphaned).map(r => r.key)
  };
}

export async function repairSystemAssetsDiagnostic() {
  const settings = await getCachedSystemSettings();
  if (!settings) {
    return { success: false, message: 'System settings not found' };
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const assetsToCheck = [
    { key: 'logo_url', label: 'logo' },
    { key: 'logo_light_url', label: 'logo_light' },
    { key: 'favicon_url', label: 'favicon' },
    { key: 'seo_image_url', label: 'seo_image' }
  ];

  const updates: Record<string, string> = {};
  let repairedCount = 0;

  for (const item of assetsToCheck) {
    const url = settings[item.key];
    if (!url || typeof url !== 'string' || !url.trim()) continue;

    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      const cleanPath = url.split('?')[0].replace(/^\//, '');
      const absPath = path.join(process.cwd(), cleanPath);
      let fileExists = false;
      try {
        await fs.promises.access(absPath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (!fileExists) {
        console.warn(`[AssetRepair] Asset file missing from disk for ${item.key}: ${cleanPath}`);
      }
    } else if (url.startsWith('data:image/')) {
      const match = url.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const rawExt = match[1].toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt === 'svg+xml' ? 'svg' : rawExt);
        const buffer = Buffer.from(match[2], 'base64');
        const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 10);
        const filename = `brand_${item.label}_${hash}.${ext}`;
        const brandDir = path.join(uploadsDir, 'brand');
        if (!fs.existsSync(brandDir)) {
          fs.mkdirSync(brandDir, { recursive: true });
        }
        const targetPath = path.join(brandDir, filename);
        await fs.promises.writeFile(targetPath, buffer).catch(() => {});
        repairedCount++;
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = Object.values(updates);
    await pool.query(`UPDATE system_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM system_settings ORDER BY id ASC LIMIT 1)`, values);
  }

  await clearSettingsCache();
  await refreshCachedAppName();
  await generateAppIconsFromSource(null, { force: true }).catch((err) => {
    console.warn('[AssetRepair] Regenerating icon suite warning:', err.message);
  });
  const diagnosticAfter = await checkSystemAssetsDiagnostic();

  return {
    success: true,
    repairedCount,
    diagnostic: diagnosticAfter
  };
}

export const getAppName = (lang: 'en' | 'ar' = 'en') => lang === 'ar' ? cachedAppNameAr : cachedAppNameEn;

export async function getMissingAssetReport() {
  if (!pool) return { missingAssets: [], totalChecked: 0, missingCount: 0 };
  const filesRes = await pool.query(`
    SELECT id, user_id, chat_id, file_name, file_url, file_size, created_at 
    FROM user_files 
    ORDER BY created_at DESC
  `);

  const uploadDir = path.join(process.cwd(), 'uploads');
  const publicDir = path.join(process.cwd(), 'public');
  const rootDir = process.cwd();

  const missingAssets: any[] = [];
  for (const fileRow of filesRes.rows) {
    const fileUrl = fileRow.file_url;
    if (!fileUrl) {
      missingAssets.push({ ...fileRow, reason: 'Empty file URL' });
      continue;
    }
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      continue;
    }

    let filename = fileUrl;
    if (filename.startsWith('/uploads/')) {
      filename = filename.replace('/uploads/', '');
    } else if (filename.startsWith('uploads/')) {
      filename = filename.replace('uploads/', '');
    } else if (filename.startsWith('/')) {
      filename = filename.slice(1);
    }

    const possiblePaths = [
      path.join(uploadDir, path.basename(filename)),
      path.join(publicDir, fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl),
      path.join(rootDir, fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl),
      path.join(uploadDir, filename)
    ];

    let found = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        found = true;
        break;
      }
    }

    if (!found) {
      missingAssets.push({
        ...fileRow,
        reason: 'File absent on disk storage'
      });
    }
  }

  return {
    totalChecked: filesRes.rows.length,
    missingCount: missingAssets.length,
    missingAssets
  };
}

// ============================================================================
// MASTER ADVERTISING & TARGETING CATEGORIES TAXONOMY & DATABASE HELPERS
// ============================================================================

export interface AdCategoryGroup {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface MasterAdCategory {
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

export const MASTER_AD_CATEGORY_GROUPS: AdCategoryGroup[] = [
  {
    id: 'technology',
    nameAr: 'التكنولوجيا والبرمجيات',
    nameEn: 'Technology & Software',
    icon: 'Cpu',
    descriptionAr: 'حلول الذكاء الاصطناعي، البرمجيات، الهواتف الذكية وتكنولوجيا المعلومات',
    descriptionEn: 'AI solutions, software development, cloud computing, and IT infrastructure'
  },
  {
    id: 'business_services',
    nameAr: 'الأعمال والخدمات المهنية',
    nameEn: 'Business & Professional Services',
    icon: 'Briefcase',
    descriptionAr: 'التسويق الرقمي، المحاماة، المحاسبة، الاستشارات الإدارية والمالية',
    descriptionEn: 'Digital marketing, legal, accounting, management consulting, and finance'
  },
  {
    id: 'construction_home',
    nameAr: 'البناء والمقاولات والديكور',
    nameEn: 'Construction & Decor',
    icon: 'Hammer',
    descriptionAr: 'المقاولات العامة، الهندسة المعمارية، التصميم الداخلي، الأثاث ومواد البناء',
    descriptionEn: 'General contracting, architectural design, interior decor, furniture, and building supplies'
  },
  {
    id: 'ecommerce_retail',
    nameAr: 'التجارة والتجزئة',
    nameEn: 'E-Commerce & Retail',
    icon: 'ShoppingBag',
    descriptionAr: 'المتاجر الإلكترونية، الأزياء، الإكسسوارات، العطور والسلع الاستهلاكية',
    descriptionEn: 'Online stores, fashion, accessories, perfumes, and consumer merchandise'
  },
  {
    id: 'real_estate',
    nameAr: 'العقارات والأراضي',
    nameEn: 'Real Estate & Properties',
    icon: 'Building2',
    descriptionAr: 'بيع وإيجار الشقق والفلل، العقارات التجارية، الأراضي والتطوير العقاري',
    descriptionEn: 'Residential & commercial property sales, rentals, land, and real estate development'
  },
  {
    id: 'automotive',
    nameAr: 'السيارات والنقل',
    nameEn: 'Automotive & Transport',
    icon: 'Car',
    descriptionAr: 'معارض السيارات، قطع الغيار، الصيانة، الكراجات وخدمات الشحن واللوجستيات',
    descriptionEn: 'Auto dealerships, spare parts, vehicle repair, car rentals, and logistics'
  },
  {
    id: 'health_medical',
    nameAr: 'الصحة والطب',
    nameEn: 'Health & Medical',
    icon: 'Activity',
    descriptionAr: 'المراكز الطبية، الصيدليات، العيادات، التغذية واللياقة البدنية',
    descriptionEn: 'Medical centers, clinics, pharmacies, dental care, nutrition, and wellness'
  },
  {
    id: 'food_dining',
    nameAr: 'المطاعم والضيافة',
    nameEn: 'Dining & Hospitality',
    icon: 'Utensils',
    descriptionAr: 'المطاعم، الكافيهات، الحلويات، المخابز وتجهيزات الحفلات',
    descriptionEn: 'Restaurants, cafes, bakeries, confectionery, and catering services'
  },
  {
    id: 'education_training',
    nameAr: 'التعليم والتدريب',
    nameEn: 'Education & Training',
    icon: 'GraduationCap',
    descriptionAr: 'الجامعات، المدارس، معاهد التدريب، التعليم الإلكتروني والدورات المهنية',
    descriptionEn: 'Universities, schools, training institutes, e-learning, and professional courses'
  },
  {
    id: 'industry_agriculture',
    nameAr: 'الصناعة والزراعة',
    nameEn: 'Industry & Agriculture',
    icon: 'Factory',
    descriptionAr: 'المصانع، خطوط الإنتاج، المشاتل الزراعية، الثروة الحيوانية والآلات الثقيلة',
    descriptionEn: 'Factories, manufacturing, nurseries, agriculture, and industrial machinery'
  },
  {
    id: 'travel_leisure',
    nameAr: 'السياحة والترفيه',
    nameEn: 'Travel & Leisure',
    icon: 'Plane',
    descriptionAr: 'وكالات السفر، الفنادق، الشاليهات، الأنشطة الترفيهية وتنظيم الفعاليات',
    descriptionEn: 'Travel agencies, hotels, resorts, tourism, entertainment, and event planning'
  },
  {
    id: 'handicrafts_services',
    nameAr: 'الحرف والصيانة المنزلية',
    nameEn: 'Crafts & Home Services',
    icon: 'Sparkles',
    descriptionAr: 'الأشغال اليدوية، الخياطة، الصيانة المنزلية السريعة والخدمات الفنية',
    descriptionEn: 'Handmade crafts, tailoring, quick household repair, and technician services'
  }
];

export const MASTER_AD_CATEGORIES: MasterAdCategory[] = [
  // 1. TECHNOLOGY & SOFTWARE
  {
    id: 'tech_software_dev',
    nameAr: 'تطوير البرمجيات والتطبيقات',
    nameEn: 'Software & App Development',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Technology & Software',
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
    groupEn: 'Technology & Software',
    icon: 'Bot',
    audienceReach: 620000,
    keywords: ['ذكاء اصطناعي', 'تعلم آلي', 'بيانات', 'ai', 'machine learning', 'data science', 'deep learning', 'automation'],
    isFeatured: true
  },
  {
    id: 'tech_web_hosting',
    nameAr: 'تصميم المواقع والاستضافة والسحابة',
    nameEn: 'Web Design, Cloud & Hosting',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Technology & Software',
    icon: 'Globe',
    audienceReach: 350000,
    keywords: ['مواقع', 'استضافة', 'سيرفرات', 'سحابة', 'web design', 'cloud', 'aws', 'vps', 'domains']
  },
  {
    id: 'tech_cybersecurity',
    nameAr: 'الأمن السيبراني وحماية البيانات',
    nameEn: 'Cybersecurity & Infosec',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Technology & Software',
    icon: 'ShieldCheck',
    audienceReach: 240000,
    keywords: ['أمن معلومات', 'حماية', 'اختراق', 'سيبراني', 'cybersecurity', 'firewall', 'pentesting', 'encryption']
  },
  {
    id: 'tech_hardware_phones',
    nameAr: 'الهواتف الذكية والأجهزة الذكية',
    nameEn: 'Smartphones & Gadgets',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Technology & Software',
    icon: 'Smartphone',
    audienceReach: 890000,
    keywords: ['جوالات', 'هواتف', 'ايفون', 'سامسونج', 'ايباد', 'phones', 'smartphones', 'iphone', 'samsung', 'gadgets'],
    isFeatured: true
  },
  {
    id: 'tech_computers_it',
    nameAr: 'الحواسيب والشبكات والدعم الفني',
    nameEn: 'Computers, Networks & IT Support',
    groupId: 'technology',
    groupAr: 'التكنولوجيا والبرمجيات',
    groupEn: 'Technology & Software',
    icon: 'Laptop',
    audienceReach: 410000,
    keywords: ['لابتوب', 'كمبيوتر', 'شبكات', 'صيانة حواسيب', 'laptops', 'pc', 'hardware', 'networking', 'it support']
  },

  // 2. BUSINESS & PROFESSIONAL SERVICES
  {
    id: 'biz_marketing_advertising',
    nameAr: 'التسويق الرقمي والإعلانات الممولة',
    nameEn: 'Digital Marketing & Paid Ads',
    groupId: 'business_services',
    groupAr: 'الأعمال والخدمات المهنية',
    groupEn: 'Business & Professional Services',
    icon: 'Megaphone',
    audienceReach: 520000,
    keywords: ['تسويق', 'إعلانات', 'سوشيال ميديا', 'سيو', 'حملات ممولة', 'marketing', 'digital marketing', 'ads', 'seo', 'growth'],
    isFeatured: true
  },
  {
    id: 'biz_graphic_design',
    nameAr: 'التصميم الجرافيكي والهوية البصرية',
    nameEn: 'Graphic Design & Branding',
    groupId: 'business_services',
    groupAr: 'الأعمال والخدمات المهنية',
    groupEn: 'Business & Professional Services',
    icon: 'Palette',
    audienceReach: 430000,
    keywords: ['تصميم', 'جرافيك', 'لوجو', 'هوية بصرية', 'موشن جرافيك', 'design', 'graphic design', 'branding', 'logo', 'motion']
  },
  {
    id: 'biz_accounting_finance',
    nameAr: 'المحاسبة وتدقيق الحسابات والضرائب',
    nameEn: 'Accounting, Audit & Tax',
    groupId: 'business_services',
    groupAr: 'الأعمال والخدمات المهنية',
    groupEn: 'Business & Professional Services',
    icon: 'Calculator',
    audienceReach: 280000,
    keywords: ['محاسبة', 'ضرائب', 'تدقيق', 'مالية', 'قوائم مالية', 'accounting', 'audit', 'tax', 'bookkeeping', 'finance']
  },
  {
    id: 'biz_legal_consulting',
    nameAr: 'المحاماة والاستشارات القانونية',
    nameEn: 'Legal Services & Law Firms',
    groupId: 'business_services',
    groupAr: 'الأعمال والخدمات المهنية',
    groupEn: 'Business & Professional Services',
    icon: 'Scale',
    audienceReach: 210000,
    keywords: ['محامي', 'قانون', 'استشارات قانونية', 'عقود', 'قضايا', 'lawyer', 'legal', 'attorney', 'contracts']
  },
  {
    id: 'biz_media_production',
    nameAr: 'الإنتاج الإعلامي والتصوير والمونتاج',
    nameEn: 'Media Production & Video Editing',
    groupId: 'business_services',
    groupAr: 'الأعمال والخدمات المهنية',
    groupEn: 'Business & Professional Services',
    icon: 'Video',
    audienceReach: 390000,
    keywords: ['تصوير', 'مونتاج', 'فيديو', 'إنتاج إعلامي', 'كاميرات', 'video production', 'editing', 'cinematography']
  },

  // 3. CONSTRUCTION & DECOR
  {
    id: 'const_general_contracting',
    nameAr: 'المقاولات العامة والبناء والتشييد',
    nameEn: 'General Contracting & Building',
    groupId: 'construction_home',
    groupAr: 'البناء والمقاولات والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Building',
    audienceReach: 370000,
    keywords: ['مقاولات', 'بناء', 'تشييد', 'خرسانة', 'عمار', 'contracting', 'construction', 'building', 'concrete'],
    isFeatured: true
  },
  {
    id: 'const_interior_design',
    nameAr: 'التصميم الداخلي وهندسة الديكور',
    nameEn: 'Interior Design & Decoration',
    groupId: 'construction_home',
    groupAr: 'البناء والمقاولات والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Layout',
    audienceReach: 490000,
    keywords: ['ديكور', 'تصميم داخلي', 'تشطيبات', 'جبس بورد', 'interior design', 'decor', 'finishing', 'gypsum']
  },
  {
    id: 'const_furniture_home',
    nameAr: 'الأثاث والمفروشات والمطابخ',
    nameEn: 'Furniture, Kitchens & Home Furnishing',
    groupId: 'construction_home',
    groupAr: 'البناء والمقاولات والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Armchair',
    audienceReach: 610000,
    keywords: ['أثاث', 'مفروشات', 'مطابخ', 'صالونات', 'غرف نوم', 'furniture', 'kitchens', 'living rooms', 'carpentry']
  },
  {
    id: 'const_building_materials',
    nameAr: 'مواد البناء والدهانات والأرضيات',
    nameEn: 'Building Supplies, Paints & Tiles',
    groupId: 'construction_home',
    groupAr: 'البناء والمقاولات والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Layers',
    audienceReach: 320000,
    keywords: ['سيراميك', 'دهانات', 'رخام', 'أسمنت', 'حديد', 'مواد بناء', 'tiles', 'paints', 'marble', 'cement', 'supplies']
  },
  {
    id: 'const_electric_solar',
    nameAr: 'أنظمة الطاقة الشمسية والتمديدات الكهربائية',
    nameEn: 'Solar Energy & Electrical Systems',
    groupId: 'construction_home',
    groupAr: 'البناء والمقاولات والديكور',
    groupEn: 'Construction & Decor',
    icon: 'Sun',
    audienceReach: 440000,
    keywords: ['طاقة شمسية', 'كهرباء', 'انفرتر', 'بطاريات', 'مولدات', 'solar energy', 'electrical', 'batteries', 'generators'],
    isFeatured: true
  },

  // 4. E-COMMERCE & RETAIL
  {
    id: 'retail_online_shopping',
    nameAr: 'المتاجر الإلكترونية والتسوق أونلاين',
    nameEn: 'E-Commerce Stores & Online Shopping',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'ShoppingBag',
    audienceReach: 950000,
    keywords: ['متجر الكتروني', 'تسوق', 'اونلاين', 'عروض', 'خصومات', 'ecommerce', 'online shopping', 'deals', 'store'],
    isFeatured: true
  },
  {
    id: 'retail_fashion_clothing',
    nameAr: 'الملابس والأزياء والأحذية',
    nameEn: 'Fashion, Clothing & Footwear',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Shirt',
    audienceReach: 870000,
    keywords: ['ملابس', 'أزياء', 'فساتين', 'أحذية', 'حقائب', 'fashion', 'clothing', 'shoes', 'dresses', 'style']
  },
  {
    id: 'retail_perfumes_cosmetics',
    nameAr: 'العطور ومستحضرات التجميل والعناية',
    nameEn: 'Perfumes, Cosmetics & Skincare',
    groupId: 'ecommerce_retail',
    groupAr: 'التجارة والتجزئة',
    groupEn: 'E-Commerce & Retail',
    icon: 'Sparkles',
    audienceReach: 760000,
    keywords: ['عطور', 'مكياج', 'تجميل', 'عناية بالبشرة', 'perfumes', 'cosmetics', 'makeup', 'skincare', 'beauty']
  },

  // 5. REAL ESTATE & PROPERTIES
  {
    id: 're_apartments_villas',
    nameAr: 'شقق وفلل للإيجار والبيع',
    nameEn: 'Apartments & Villas for Sale/Rent',
    groupId: 'real_estate',
    groupAr: 'العقارات والأراضي',
    groupEn: 'Real Estate & Properties',
    icon: 'Building2',
    audienceReach: 580000,
    keywords: ['شقق', 'فلل', 'إيجار', 'بيع', 'عقارات سكنية', 'apartments', 'villas', 'rent', 'real estate'],
    isFeatured: true
  },
  {
    id: 're_commercial_properties',
    nameAr: 'المحلات والمكاتب والعقارات التجارية',
    nameEn: 'Commercial Real Estate & Offices',
    groupId: 'real_estate',
    groupAr: 'العقارات والأراضي',
    groupEn: 'Real Estate & Properties',
    icon: 'Store',
    audienceReach: 310000,
    keywords: ['محلات', 'مكاتب', 'معارض', 'عقارات تجارية', 'commercial', 'offices', 'shops', 'retail space']
  },
  {
    id: 're_land_development',
    nameAr: 'الأراضي والتطوير والاستثمار العقاري',
    nameEn: 'Land & Property Investment',
    groupId: 'real_estate',
    groupAr: 'العقارات والأراضي',
    groupEn: 'Real Estate & Properties',
    icon: 'Compass',
    audienceReach: 290000,
    keywords: ['أراضي', 'استثمار عقاري', 'مخططات', 'طابو', 'land', 'plots', 'investment', 'development']
  },

  // 6. AUTOMOTIVE & TRANSPORT
  {
    id: 'auto_cars_sales',
    nameAr: 'معارض وتجارة السيارات الجديدة والمستعملة',
    nameEn: 'Car Dealerships & Auto Sales',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Car',
    audienceReach: 690000,
    keywords: ['سيارات', 'معارض سيارات', 'شراء سيارة', 'مركبات', 'cars', 'automobiles', 'dealerships', 'vehicles'],
    isFeatured: true
  },
  {
    id: 'auto_repair_parts',
    nameAr: 'قطع الغيار ومراكز الصيانة والكراجات',
    nameEn: 'Auto Repair & Spare Parts',
    groupId: 'automotive',
    groupAr: 'السيارات والنقل',
    groupEn: 'Automotive & Transport',
    icon: 'Wrench',
    audienceReach: 430000,
    keywords: ['قطع غيار', 'ميكانيك', 'صيانة سيارات', 'كراج', 'كهرباء سيارات', 'auto repair', 'spare parts', 'mechanic']
  },

  // 7. HEALTH & MEDICAL
  {
    id: 'health_clinics_doctors',
    nameAr: 'العيادات والمراكز الطبية والأطباء',
    nameEn: 'Medical Clinics & Doctors',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Stethoscope',
    audienceReach: 540000,
    keywords: ['أطباء', 'عيادات', 'مستشفيات', 'فحص طبي', 'طب أسنان', 'doctors', 'clinics', 'medical', 'dental'],
    isFeatured: true
  },
  {
    id: 'health_pharmacies_nutrition',
    nameAr: 'الصيدليات والمكملات الغذائية',
    nameEn: 'Pharmacies & Nutrition Supplements',
    groupId: 'health_medical',
    groupAr: 'الصحة والطب',
    groupEn: 'Health & Medical',
    icon: 'Pill',
    audienceReach: 420000,
    keywords: ['صيدلية', 'أدوية', 'فيتامينات', 'مكملات غذائية', 'pharmacy', 'supplements', 'vitamins', 'medicine']
  },

  // 8. DINING & HOSPITALITY
  {
    id: 'dining_restaurants_cafes',
    nameAr: 'المطاعم والكافيهات والوجبات السريعة',
    nameEn: 'Restaurants, Cafes & Fast Food',
    groupId: 'food_dining',
    groupAr: 'المطاعم والضيافة',
    groupEn: 'Dining & Hospitality',
    icon: 'Utensils',
    audienceReach: 980000,
    keywords: ['مطعم', 'كافيه', 'شاورما', 'برجر', 'وجبات سريعة', 'restaurants', 'cafes', 'food delivery', 'dining'],
    isFeatured: true
  },
  {
    id: 'dining_sweets_bakery',
    nameAr: 'الحلويات والمخابز والمعجنات',
    nameEn: 'Sweets, Bakeries & Pastries',
    groupId: 'food_dining',
    groupAr: 'المطاعم والضيافة',
    groupEn: 'Dining & Hospitality',
    icon: 'Cake',
    audienceReach: 680000,
    keywords: ['حلويات', 'كيك', 'مخبز', 'معجنات', 'شوكولاتة', 'sweets', 'bakery', 'pastries', 'cakes', 'chocolate']
  },

  // 9. EDUCATION & TRAINING
  {
    id: 'edu_universities_schools',
    nameAr: 'الجامعات والكليات والمدارس الخاصة',
    nameEn: 'Universities, Colleges & Schools',
    groupId: 'education_training',
    groupAr: 'التعليم والتدريب',
    groupEn: 'Education & Training',
    icon: 'GraduationCap',
    audienceReach: 510000,
    keywords: ['جامعات', 'مدارس', 'كليات', 'تسجيل جامعي', 'تعليم', 'universities', 'schools', 'colleges', 'education'],
    isFeatured: true
  },
  {
    id: 'edu_courses_training',
    nameAr: 'المراكز التدريبية والدورات المهنية',
    nameEn: 'Training Centers & Vocational Courses',
    groupId: 'education_training',
    groupAr: 'التعليم والتدريب',
    groupEn: 'Education & Training',
    icon: 'BookOpen',
    audienceReach: 470000,
    keywords: ['دورات', 'تدريب', 'كورسات', 'شهادات مهنية', 'لغات', 'courses', 'training', 'certifications', 'languages']
  }
];

/**
 * Get category groups for targeted ads and platform organization
 */
export function getCategoryGroups(): AdCategoryGroup[] {
  return MASTER_AD_CATEGORY_GROUPS;
}

/**
 * Get master categories list with optional database query and flexible filters
 */
export async function getMasterAdCategories(options: {
  query?: string;
  groupId?: string;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<{ categories: MasterAdCategory[]; groups: AdCategoryGroup[]; total: number }> {
  const { query, groupId, isFeatured, limit = 100, offset = 0 } = options;

  if (pool) {
    try {
      let sql = 'SELECT * FROM platform_categories WHERE 1=1';
      const params: any[] = [];
      let pIdx = 1;

      if (groupId && groupId !== 'all') {
        sql += ` AND group_id = $${pIdx++}`;
        params.push(groupId);
      }

      if (isFeatured !== undefined) {
        sql += ` AND is_featured = $${pIdx++}`;
        params.push(isFeatured);
      }

      if (query && query.trim()) {
        const q = `%${query.trim()}%`;
        sql += ` AND (name_ar ILIKE $${pIdx} OR name_en ILIKE $${pIdx} OR group_ar ILIKE $${pIdx} OR group_en ILIKE $${pIdx} OR $${pIdx + 1} = ANY(keywords))`;
        params.push(q, query.trim().toLowerCase());
        pIdx += 2;
      }

      const countSql = sql.replace('SELECT *', 'SELECT count(*)');
      const countRes = await pool.query(countSql, params);
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      sql += ` ORDER BY is_featured DESC, audience_reach DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
      params.push(limit, offset);

      const dbRes = await pool.query(sql, params);
      if (dbRes.rows && dbRes.rows.length > 0) {
        const mappedCategories: MasterAdCategory[] = dbRes.rows.map((row: any) => ({
          id: row.id,
          nameAr: row.name_ar,
          nameEn: row.name_en,
          groupId: row.group_id,
          groupAr: row.group_ar,
          groupEn: row.group_en,
          icon: row.icon || 'Layers',
          audienceReach: parseInt(row.audience_reach || '150000', 10),
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
          isFeatured: !!row.is_featured
        }));
        return {
          categories: mappedCategories,
          groups: MASTER_AD_CATEGORY_GROUPS,
          total
        };
      }
    } catch (err: any) {
      console.warn('[AdCategories] DB query error, falling back to in-memory taxonomy:', err?.message || err);
    }
  }

  // In-memory fallback
  let filtered = [...MASTER_AD_CATEGORIES];

  if (groupId && groupId !== 'all') {
    filtered = filtered.filter(c => c.groupId === groupId);
  }

  if (isFeatured !== undefined) {
    filtered = filtered.filter(c => !!c.isFeatured === isFeatured);
  }

  if (query && query.trim()) {
    const qLower = query.trim().toLowerCase();
    filtered = filtered.filter(c =>
      c.nameAr.toLowerCase().includes(qLower) ||
      c.nameEn.toLowerCase().includes(qLower) ||
      c.groupAr.toLowerCase().includes(qLower) ||
      c.groupEn.toLowerCase().includes(qLower) ||
      c.keywords.some(k => k.toLowerCase().includes(qLower))
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    categories: paginated,
    groups: MASTER_AD_CATEGORY_GROUPS,
    total
  };
}

/**
 * Synchronize Master Categories to Postgres database
 */
export async function syncMasterCategoriesToDatabase(targetPool: any = pool): Promise<number> {
  if (!targetPool) return 0;
  let synced = 0;
  try {
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS platform_categories (
        id VARCHAR(100) PRIMARY KEY,
        name_ar VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        group_id VARCHAR(100) NOT NULL,
        group_ar VARCHAR(255) NOT NULL,
        group_en VARCHAR(255) NOT NULL,
        icon VARCHAR(50) DEFAULT 'Layers',
        audience_reach BIGINT DEFAULT 150000,
        keywords TEXT[] DEFAULT '{}',
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_platform_categories_group ON platform_categories (group_id);
      CREATE INDEX IF NOT EXISTS idx_platform_categories_featured ON platform_categories (is_featured);
    `);

    for (const cat of MASTER_AD_CATEGORIES) {
      await targetPool.query(`
        INSERT INTO platform_categories (id, name_ar, name_en, group_id, group_ar, group_en, icon, audience_reach, keywords, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          name_ar = EXCLUDED.name_ar,
          name_en = EXCLUDED.name_en,
          group_id = EXCLUDED.group_id,
          group_ar = EXCLUDED.group_ar,
          group_en = EXCLUDED.group_en,
          icon = EXCLUDED.icon,
          audience_reach = EXCLUDED.audience_reach,
          keywords = EXCLUDED.keywords,
          is_featured = EXCLUDED.is_featured
      `, [
        cat.id,
        cat.nameAr,
        cat.nameEn,
        cat.groupId,
        cat.groupAr,
        cat.groupEn,
        cat.icon,
        cat.audienceReach,
        cat.keywords,
        cat.isFeatured || false
      ]);
      synced++;
    }
  } catch (err: any) {
    console.error('[AdCategories] Failed to sync master categories to database:', err.message);
  }
  return synced;
}


