import { safeStorageGet, safeStorageSet, safeStorageRemove } from "@/utils/safeStorage";

export interface GoogleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// Re-export type alias for backwards compatibility
export type User = GoogleUser;

export const GOOGLE_CONTACTS_SCOPES = [
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/directory.readonly',
  'https://www.googleapis.com/auth/user.addresses.read',
  'https://www.googleapis.com/auth/user.birthday.read',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.gender.read',
  'https://www.googleapis.com/auth/user.organization.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read'
];

export const GOOGLE_CHAT_SCOPES = [
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.memberships',
  'https://www.googleapis.com/auth/chat.memberships.readonly'
];

// Fallback dummy provider to prevent breaking imports
export const googleProvider = {
  addScope: (_s: string) => {},
  setCustomParameters: (_p: any) => {}
};

let cachedAccessToken: string | null = safeStorageGet('google_access_token');
let cachedUser: GoogleUser | null = null;
const authListeners: Array<(user: GoogleUser | null, token: string | null) => void> = [];

function notifyListeners() {
  authListeners.forEach(listener => {
    try {
      listener(cachedUser, cachedAccessToken);
    } catch (e) {
      console.warn('[GoogleAuth] Listener error:', e);
    }
  });
}

// Load Google Identity Services script if not already loaded
function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

// Fetch user profile information using access token
async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUser> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        uid: data.sub || String(Date.now()),
        displayName: data.name || data.given_name || 'Google User',
        email: data.email || null,
        photoURL: data.picture || null
      };
    }
  } catch (err) {
    console.warn('[GoogleAuth] Failed to fetch userinfo:', err);
  }
  return {
    uid: 'google_user_' + Date.now(),
    displayName: 'Google Account',
    email: null,
    photoURL: null
  };
}

/** Initializer for auth state listener */
export const initGoogleAuth = (
  onAuthSuccess?: (user: GoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  const listener = (user: GoogleUser | null, token: string | null) => {
    if (user && token) {
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };

  authListeners.push(listener);

  // Immediately notify of current state if available
  if (cachedAccessToken && cachedUser) {
    if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
  } else if (cachedAccessToken && !cachedUser) {
    fetchGoogleUserProfile(cachedAccessToken).then(user => {
      cachedUser = user;
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken!);
    }).catch(() => {
      if (onAuthFailure) onAuthFailure();
    });
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
};

/** Sign in with Google Popup using standard Google OAuth */
export const googleSignIn = async (
  requestedScopes: string[] = GOOGLE_CONTACTS_SCOPES
): Promise<{ user: GoogleUser; accessToken: string } | null> => {
  try {
    // Attempt standard GSI token client if available
    await loadGsiScript().catch(() => {});

    // Check meta tag, window global, Vite environment variable, or fetch from backend endpoint
    const metaClientId = document.querySelector('meta[name="google-signin-client_id"]')?.getAttribute('content');
    let clientId = metaClientId || (window as any).__GOOGLE_CLIENT_ID__ || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
      try {
        const configRes = await fetch('/api/auth/google/client-id');
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.clientId) {
            clientId = configData.clientId;
          }
        }
      } catch (err) {
        console.warn('[GoogleAuth] Failed to fetch clientId from server config:', err);
      }
    }

    if (!clientId) {
      throw new Error('Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in Control Panel or .env');
    }

    if ((window as any).google?.accounts?.oauth2) {
      const token = await new Promise<string>((resolve, reject) => {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: requestedScopes.join(' '),
            callback: (response: any) => {
              if (response.error) {
                reject(new Error(response.error_description || response.error));
              } else if (response.access_token) {
                resolve(response.access_token);
              } else {
                reject(new Error('Failed to obtain access token'));
              }
            },
            error_callback: (err: any) => {
              reject(err);
            }
          });
          client.requestAccessToken({ prompt: 'consent' });
        } catch (err) {
          reject(err);
        }
      });

      cachedAccessToken = token;
      safeStorageSet('google_access_token', token);
      const user = await fetchGoogleUserProfile(token);
      cachedUser = user;
      notifyListeners();
      return { user, accessToken: token };
    }

    // Fallback direct OAuth popup flow if GSI is not blocked
    const redirectUri = window.location.origin;
    const scopeStr = encodeURIComponent(requestedScopes.join(' '));
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scopeStr}&prompt=select_account`;

    const popup = window.open(authUrl, 'google_oauth_popup', 'width=500,height=600,menubar=no,toolbar=no');
    if (!popup) {
      throw new Error('Popup blocked by browser. Please allow popups for this site.');
    }

    const token = await new Promise<string>((resolve, reject) => {
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            reject(new Error('Sign-in popup closed by user'));
            return;
          }
          if (popup.location && popup.location.href.includes(redirectUri)) {
            const hash = popup.location.hash;
            const params = new URLSearchParams(hash.replace(/^#/, ''));
            const accessToken = params.get('access_token');
            if (accessToken) {
              clearInterval(checkPopup);
              popup.close();
              resolve(accessToken);
            }
          }
        } catch (e) {
          // Cross-origin access until redirected to origin; ignore
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkPopup);
        if (!popup.closed) popup.close();
        reject(new Error('Google sign-in timed out.'));
      }, 120000);
    });

    cachedAccessToken = token;
    safeStorageSet('google_access_token', token);
    const user = await fetchGoogleUserProfile(token);
    cachedUser = user;
    notifyListeners();
    return { user, accessToken: token };
  } catch (error: any) {
    console.error('[GoogleAuth] Sign-in failed:', error);
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isInIframe) {
      error.message = 'Sign-in failed due to iframe restrictions. Please try opening the app in a new tab.';
    }
    throw error;
  }
};

/** Get the current cached token */
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken || safeStorageGet('google_access_token');
};

/** Set token manually */
export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    safeStorageSet('google_access_token', token);
    fetchGoogleUserProfile(token).then(user => {
      cachedUser = user;
      notifyListeners();
    }).catch(() => {});
  } else {
    safeStorageRemove('google_access_token');
    cachedUser = null;
    notifyListeners();
  }
};

/** Log out Google integration */
export const googleSignOut = async () => {
  cachedAccessToken = null;
  cachedUser = null;
  safeStorageRemove('google_access_token');
  notifyListeners();
};
