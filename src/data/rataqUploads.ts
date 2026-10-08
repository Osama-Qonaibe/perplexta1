// Perplexta / RATAQ Sovereign Studio - Uploads & Media Assets Data Architecture

export interface StudioUploadItem {
  id: string;
  name: string;
  type: 'image' | 'font' | 'video' | 'pdf';
  url: string; // Base64, Object URL, or remote URL
  size?: string;
  dimensions?: string;
  fontFamily?: string;
  duration?: string;
  pageCount?: number;
  thumbnail?: string;
  createdAt: number;
}

export const DEFAULT_STUDIO_UPLOADS: StudioUploadItem[] = [
  {
    id: 'upload-img-badge',
    name: 'شعار رينكس المائي (ختم ذهبي شفاف)',
    type: 'image',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23fbbf24"/><stop offset="50%" stop-color="%23d97706"/><stop offset="100%" stop-color="%23b45309"/></linearGradient></defs><circle cx="150" cy="150" r="130" fill="none" stroke="url(%23gold)" stroke-width="8" stroke-dasharray="8 6"/><circle cx="150" cy="150" r="115" fill="none" stroke="url(%23gold)" stroke-width="2"/><polygon points="150,55 175,115 240,115 188,155 208,215 150,175 92,215 112,155 60,115 125,115" fill="url(%23gold)" opacity="0.9"/><text x="150" y="245" font-family="sans-serif" font-weight="900" font-size="20" fill="%23fbbf24" text-anchor="middle" letter-spacing="2">RINEX VERIFIED</text></svg>',
    size: '14 KB',
    dimensions: '300x300',
    createdAt: Date.now() - 1000 * 60 * 60 * 24
  },
  {
    id: 'upload-img-watermark',
    name: 'علامة مائية توثيق رسمية (PNG شفاف)',
    type: 'image',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120"><rect x="10" y="10" width="380" height="100" rx="16" fill="rgba(15,23,42,0.85)" stroke="%2338bdf8" stroke-width="2"/><circle cx="50" cy="60" r="24" fill="%230284c7"/><path d="M40 60 L47 67 L62 52" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="52" font-family="sans-serif" font-weight="bold" font-size="18" fill="white">PERPLEXTA SOVEREIGN</text><text x="90" y="78" font-family="sans-serif" font-size="13" fill="%2338bdf8">ORIGINAL LICENSED CREATIVE</text></svg>',
    size: '18 KB',
    dimensions: '400x120',
    createdAt: Date.now() - 1000 * 60 * 60 * 12
  },
  {
    id: 'upload-font-cairo',
    name: 'خط القاهرة الحديث (Cairo ExtraBold)',
    type: 'font',
    fontFamily: 'Cairo, sans-serif',
    url: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap',
    size: '124 KB',
    createdAt: Date.now() - 1000 * 60 * 60 * 8
  },
  {
    id: 'upload-font-tajawal',
    name: 'خط تجوال الاحترافي (Tajawal Bold)',
    type: 'font',
    fontFamily: 'Tajawal, sans-serif',
    url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap',
    size: '98 KB',
    createdAt: Date.now() - 1000 * 60 * 60 * 6
  },
  {
    id: 'upload-font-amiri',
    name: 'خط أميري الكلاسيكي (Amiri Arabic)',
    type: 'font',
    fontFamily: 'Amiri, serif',
    url: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap',
    size: '142 KB',
    createdAt: Date.now() - 1000 * 60 * 60 * 4
  },
  {
    id: 'upload-video-reel',
    name: 'مقطع عرض موشن موكب (Product Showcase 4K)',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    duration: '0:15',
    size: '4.2 MB',
    createdAt: Date.now() - 1000 * 60 * 60 * 2
  },
  {
    id: 'upload-pdf-guide',
    name: 'دليل الهوية البصرية والمقاسات (Brand Specs PDF)',
    type: 'pdf',
    url: '/assets/sample-brand-guidelines.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    pageCount: 12,
    size: '1.8 MB',
    createdAt: Date.now() - 1000 * 60 * 60
  }
];

const STORAGE_PREFIX = 'perplexta_studio_uploads_';

export function getStoredStudioUploads(userId?: string | number): StudioUploadItem[] {
  if (!userId || userId === 'guest') {
    return []; // Unauthenticated guest visitors have zero private uploads
  }
  try {
    const key = `${STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_STUDIO_UPLOADS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse studio uploads from storage', err);
  }
  return DEFAULT_STUDIO_UPLOADS;
}

const DB_NAME = 'PerplextaStudioUploadsDB';
const STORE_NAME = 'uploads';

export function syncUploadsToDB(userId: string | number | undefined, items: StudioUploadItem[]): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'storeId' });
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // Retrieve all existing store items first
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          const allItems = getAllRequest.result || [];
          const userScopeKey = String(userId || 'guest');
          
          // Delete items from DB that are no longer in the provided items list
          const currentIds = new Set(items.map(item => item.id));
          allItems.forEach((dbItem: any) => {
            if (dbItem.userId === userScopeKey && !currentIds.has(dbItem.id)) {
              store.delete(dbItem.storeId);
            }
          });
          
          // Add/Update current items
          items.forEach(item => {
            const storeId = `${userScopeKey}_${item.id}`;
            store.put({ ...item, storeId, userId: userScopeKey });
          });
          
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      };
      request.onerror = () => {
        resolve();
      };
    } catch (err) {
      resolve();
    }
  });
}

export function getUploadsFromDB(userId: string | number | undefined): Promise<StudioUploadItem[]> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'storeId' });
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          const allItems = getAllRequest.result || [];
          const userItems = allItems
            .filter((item: any) => item.userId === String(userId || 'guest'))
            .map(({ storeId, ...rest }: any) => rest as StudioUploadItem);
          db.close();
          resolve(userItems);
        };
        getAllRequest.onerror = () => {
          db.close();
          resolve([]);
        };
      };
      request.onerror = () => {
        resolve([]);
      };
    } catch (err) {
      resolve([]);
    }
  });
}

export function saveStoredStudioUploads(userId: string | number | undefined, items: StudioUploadItem[]): void {
  // 1. Safe Save to localStorage (as synchronous fallback, only saves small files or handles exception silently)
  try {
    const key = `${STORAGE_PREFIX}${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn('LocalStorage limit exceeded, falling back to IndexedDB for large uploads:', err);
  }

  // 2. Persistent Save to IndexedDB (unlimited quota)
  syncUploadsToDB(userId, items);
}

/**
 * Dynamically injects an @font-face rule or FontFace API into the document so text on the canvas
 * immediately renders with the custom uploaded font.
 */
export async function registerDynamicCustomFont(fontName: string, sourceUrlOrBase64: string): Promise<boolean> {
  try {
    // If it's a binary font dataUrl / blob
    const font = new FontFace(fontName, `url(${sourceUrlOrBase64})`);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
    return true;
  } catch (err) {
    console.warn(`FontFace API failed for ${fontName}, injecting style tag fallback`, err);
    try {
      const styleId = `font-face-${fontName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${sourceUrlOrBase64}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      return true;
    } catch (fallbackErr) {
      console.error('All font registration fallbacks failed', fallbackErr);
      return false;
    }
  }
}

// IndexedDB Session Storage Helpers to bypass localStorage size limits (unlimited quota)
const SESSION_DB_NAME = 'PerplextaStudioSessionDB';
const SESSION_STORE_NAME = 'session';

export function saveStudioSessionToDB(data: any): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(SESSION_DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
          db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(SESSION_STORE_NAME, 'readwrite');
        const store = tx.objectStore(SESSION_STORE_NAME);
        store.put({ id: 'active_session', data, updatedAt: Date.now() });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
      request.onerror = () => resolve();
    } catch (err) {
      resolve();
    }
  });
}

export function getStudioSessionFromDB(): Promise<any | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(SESSION_DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
          db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(SESSION_STORE_NAME, 'readonly');
        const store = tx.objectStore(SESSION_STORE_NAME);
        const getRequest = store.get('active_session');
        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result?.data || null);
        };
        getRequest.onerror = () => {
          db.close();
          resolve(null);
        };
      };
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

export function clearStudioSessionFromDB(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(SESSION_DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
          db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(SESSION_STORE_NAME, 'readwrite');
        const store = tx.objectStore(SESSION_STORE_NAME);
        store.delete('active_session');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
      request.onerror = () => resolve();
    } catch (err) {
      resolve();
    }
  });
}
