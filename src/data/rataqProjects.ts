// Perplexta / RATAQ Sovereign Studio - User Profile & Private Projects Architecture

import { CanvasElement, EditorFilters } from '../components/chat/artifacts/ArtifactImageEditor';

export interface StudioProject {
  id: string;
  userId: string; // User identity or guest identifier
  title: string;
  previewUrl: string; // Data URL or Image URL
  width: number;
  height: number;
  canvasBackground: string; // Base image data or color
  elements: CanvasElement[];
  filters?: EditorFilters;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  isFavorite?: boolean;
}

const DEFAULT_FILTERS: EditorFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0
};

export const DEFAULT_USER_STARTER_PROJECTS: StudioProject[] = [
  {
    id: 'project-starter-instagram',
    userId: 'global',
    title: 'تصميم منشور إنستغرام فاخر',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    width: 1080,
    height: 1080,
    canvasBackground: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
    elements: [
      {
        id: 'el-title-1',
        type: 'text',
        name: 'العنوان الرئيسي',
        x: 180,
        y: 220,
        w: 720,
        h: 90,
        text: 'انطلاقة الهوية الرقمية الجديدة',
        color: '#ffffff',
        strokeWidth: 0,
        fontSize: 52,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true,
        shadowColor: 'rgba(0,0,0,0.85)',
        shadowBlur: 10
      },
      {
        id: 'el-sub-1',
        type: 'text',
        name: 'العنوان الفرعي',
        x: 240,
        y: 330,
        w: 600,
        h: 50,
        text: 'جودة استثنائية • تصميم متقن • حضور رقمي مميز',
        color: '#38bdf8',
        strokeWidth: 0,
        fontSize: 24,
        fontFamily: 'Cairo, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-badge-rect',
        type: 'rect',
        name: 'إطار الإعلان',
        x: 140,
        y: 160,
        w: 800,
        h: 760,
        color: '#38bdf8',
        strokeColor: 'rgba(56, 189, 248, 0.5)',
        strokeWidth: 2,
        fillColor: 'transparent',
        cornerRadius: 24
      }
    ],
    filters: DEFAULT_FILTERS,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    tags: ['سوشيال ميديا', 'إنستغرام'],
    isFavorite: true
  },
  {
    id: 'project-starter-offer',
    userId: 'global',
    title: 'بانر عروض وخصومات مميزة',
    previewUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    width: 1200,
    height: 630,
    canvasBackground: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    elements: [
      {
        id: 'el-offer-1',
        type: 'text',
        name: 'عنوان العرض',
        x: 200,
        y: 180,
        w: 800,
        h: 80,
        text: 'عروض الموسم الحصرية خصم يصل 50%',
        color: '#fbbf24',
        strokeWidth: 0,
        fontSize: 44,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      }
    ],
    filters: DEFAULT_FILTERS,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    tags: ['تسويق', 'عروض'],
    isFavorite: false
  }
];

const getStorageKey = (userId?: number | string) => {
  const normalizedId = userId ? String(userId).trim() : 'guest';
  return `perplexta_studio_projects_user_${normalizedId}`;
};

export const getUserStudioProjects = (userId?: number | string): StudioProject[] => {
  if (!userId || userId === 'guest') {
    return []; // Unauthenticated guest visitors have zero private projects
  }
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Return starter templates for new profile
      return DEFAULT_USER_STARTER_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_USER_STARTER_PROJECTS;
  } catch (err) {
    console.error('Failed to load user studio projects:', err);
    return DEFAULT_USER_STARTER_PROJECTS;
  }
};

export const saveUserStudioProject = (
  userId: number | string | undefined, 
  project: StudioProject
): StudioProject[] => {
  try {
    const key = getStorageKey(userId);
    const existing = getUserStudioProjects(userId);
    const index = existing.findIndex(p => p.id === project.id);
    
    let updatedList: StudioProject[];
    const updatedProject = {
      ...project,
      userId: userId ? String(userId) : 'guest',
      updatedAt: Date.now()
    };

    if (index >= 0) {
      updatedList = existing.map((p, idx) => idx === index ? updatedProject : p);
    } else {
      updatedList = [updatedProject, ...existing];
    }

    localStorage.setItem(key, JSON.stringify(updatedList));
    return updatedList;
  } catch (err) {
    console.error('Failed to save user studio project:', err);
    return getUserStudioProjects(userId);
  }
};

export const deleteUserStudioProject = (
  userId: number | string | undefined, 
  projectId: string
): StudioProject[] => {
  try {
    const key = getStorageKey(userId);
    const existing = getUserStudioProjects(userId);
    const filtered = existing.filter(p => p.id !== projectId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete user studio project:', err);
    return getUserStudioProjects(userId);
  }
};

export const duplicateUserStudioProject = (
  userId: number | string | undefined, 
  projectId: string
): StudioProject[] => {
  try {
    const existing = getUserStudioProjects(userId);
    const target = existing.find(p => p.id === projectId);
    if (!target) return existing;

    const duplicated: StudioProject = {
      ...target,
      id: `project-${Date.now()}`,
      title: `${target.title} (نسخة)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return saveUserStudioProject(userId, duplicated);
  } catch (err) {
    console.error('Failed to duplicate user studio project:', err);
    return getUserStudioProjects(userId);
  }
};

export const toggleFavoriteStudioProject = (
  userId: number | string | undefined, 
  projectId: string
): StudioProject[] => {
  try {
    const key = getStorageKey(userId);
    const existing = getUserStudioProjects(userId);
    const updated = existing.map(p => p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to toggle favorite on user studio project:', err);
    return getUserStudioProjects(userId);
  }
};
