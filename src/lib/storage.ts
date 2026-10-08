import { Preferences } from '@capacitor/preferences';

const isNative = 
    typeof window !== 'undefined' &&
    typeof (window as any).Capacitor !== 'undefined' && 
    (window as any).Capacitor.isNativePlatform?.();

class SecureStorage {
    private memoryCache: Map<string, string> = new Map();
    private isInitialized = false;

    constructor() {
        this.initMemoryCache();
    }

    private initMemoryCache(): void {
        if (typeof window === 'undefined') return;

        // 1. Preload from localStorage immediately
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const val = localStorage.getItem(key);
                    if (val !== null) {
                        this.memoryCache.set(key, val);
                    }
                }
            }
        } catch (_) {}

        // 2. If on native platform, warm up from Preferences in background
        if (isNative) {
            Preferences.keys().then(async ({ keys }) => {
                for (const k of keys) {
                    try {
                        const { value } = await Preferences.get({ key: k });
                        if (value !== null) {
                            this.memoryCache.set(k, value);
                        }
                    } catch (_) {}
                }
                this.isInitialized = true;
            }).catch(() => {
                this.isInitialized = true;
            });
        } else {
            this.isInitialized = true;
        }
    }

    async set(key: string, value: string): Promise<void> {
        this.memoryCache.set(key, value);
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } catch (_) {}

        if (isNative) {
            try {
                await Preferences.set({ key, value });
            } catch (_) {}
        }
    }

    async get(key: string): Promise<string | null> {
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key) ?? null;
        }

        if (isNative) {
            try {
                const { value } = await Preferences.get({ key });
                if (value !== null) {
                    this.memoryCache.set(key, value);
                    return value;
                }
            } catch (_) {}
        }

        try {
            if (typeof window !== 'undefined') {
                const val = localStorage.getItem(key);
                if (val !== null) {
                    this.memoryCache.set(key, val);
                    return val;
                }
            }
        } catch (_) {}

        return null;
    }

    async remove(key: string): Promise<void> {
        this.memoryCache.delete(key);
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (_) {}

        if (isNative) {
            try {
                await Preferences.remove({ key });
            } catch (_) {}
        }
    }

    async clear(preserveKeys: string[] = []): Promise<void> {
        const preserved: Map<string, string> = new Map();
        for (const k of preserveKeys) {
            const val = this.getSync(k);
            if (val !== null) preserved.set(k, val);
        }

        this.memoryCache.clear();

        try {
            if (typeof window !== 'undefined') {
                localStorage.clear();
            }
        } catch (_) {}

        if (isNative) {
            try {
                await Preferences.clear();
            } catch (_) {}
        }

        for (const [k, v] of preserved.entries()) {
            await this.set(k, v);
        }
    }

    clearSync(preserveKeys: string[] = []): void {
        const preserved: Map<string, string> = new Map();
        for (const k of preserveKeys) {
            const val = this.getSync(k);
            if (val !== null) preserved.set(k, val);
        }

        this.memoryCache.clear();

        try {
            if (typeof window !== 'undefined') {
                localStorage.clear();
            }
        } catch (_) {}

        for (const [k, v] of preserved.entries()) {
            this.memoryCache.set(k, v);
            try {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(k, v);
                }
            } catch (_) {}
        }

        if (isNative) {
            Preferences.clear().then(() => {
                for (const [k, v] of preserved.entries()) {
                    Preferences.set({ key: k, value: v }).catch(() => {});
                }
            }).catch(() => {});
        }
    }

    // Synchronous read - guaranteed instant return from synchronized in-memory cache
    getSync(key: string): string | null {
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key) ?? null;
        }

        try {
            if (typeof window !== 'undefined') {
                const val = localStorage.getItem(key);
                if (val !== null) {
                    this.memoryCache.set(key, val);
                    return val;
                }
            }
        } catch (_) {}

        return null;
    }
}

export const secureStorage = new SecureStorage();
