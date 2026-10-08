import { RATAQ_TEMPLATES, StudioTemplate } from '../data/rataqTemplates';

export interface WorkspaceDimensions {
  width: number;
  height: number;
}

export interface TemplateFilterOptions {
  /**
   * Filter templates by category (e.g. 'quotes', 'tech', 'fitness', 'marketing', 'fashion', 'story', 'banner', 'real_estate', 'all')
   */
  category?: string;
  /**
   * Maximum allowed variance between template aspect ratio and active canvas aspect ratio.
   * Default: 0.05
   */
  aspectRatioTolerance?: number;
  /**
   * If set to true, only return templates whose aspect ratio matches the active canvas aspect ratio.
   * Automatically hides templates that do not match the aspect ratio of the user's active canvas.
   * Default: true
   */
  matchCanvasAspectRatio?: boolean;
  /**
   * If true, requires exact pixel width and height equality rather than aspect ratio matching.
   * Default: false
   */
  strictExactDimensions?: boolean;
}

/**
 * Calculates numerical aspect ratio (width / height)
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (!width || !height || height === 0) return 1;
  return width / height;
}

/**
 * Checks whether a template matches workspace dimensions or aspect ratio tolerance.
 */
export function isTemplateMatchingWorkspace(
  template: StudioTemplate,
  dimensions: WorkspaceDimensions,
  tolerance = 0.05
): boolean {
  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) return true;

  // Exact pixel dimensions match
  if (template.width === dimensions.width && template.height === dimensions.height) {
    return true;
  }

  const canvasRatio = calculateAspectRatio(dimensions.width, dimensions.height);
  const templateRatio = calculateAspectRatio(template.width, template.height);

  return Math.abs(canvasRatio - templateRatio) <= tolerance;
}

/**
 * Primary Service Layer Function:
 * Filters templates from the repository based on the current workspace dimensions,
 * automatically hiding templates that do not match the aspect ratio of the user's active canvas.
 *
 * @param templates - The templates array from repository
 * @param dimensions - The active canvas/workspace dimensions { width, height }
 * @param options - Additional filtering options (category, tolerance, matchCanvasAspectRatio, etc.)
 */
export function filterTemplatesByWorkspaceDimensions(
  templates: StudioTemplate[],
  dimensions: WorkspaceDimensions,
  options: TemplateFilterOptions = {}
): StudioTemplate[] {
  const {
    category = 'all',
    aspectRatioTolerance = 0.05,
    matchCanvasAspectRatio = true,
    strictExactDimensions = false
  } = options;

  if (!templates || !Array.isArray(templates)) {
    return [];
  }

  return templates.filter((template) => {
    // 1. Category Filter
    if (category && category !== 'all' && template.category !== category) {
      return false;
    }

    // 2. Aspect Ratio / Workspace Dimension Filter
    if (matchCanvasAspectRatio && dimensions && dimensions.width > 0 && dimensions.height > 0) {
      if (strictExactDimensions) {
        return template.width === dimensions.width && template.height === dimensions.height;
      }
      return isTemplateMatchingWorkspace(template, dimensions, aspectRatioTolerance);
    }

    return true;
  });
}

/**
 * Convenience service function to filter the default RATAQ_TEMPLATES repository directly
 * based on active workspace dimensions.
 */
export function getWorkspaceMatchingTemplates(
  dimensions: WorkspaceDimensions,
  options: TemplateFilterOptions = {}
): StudioTemplate[] {
  return filterTemplatesByWorkspaceDimensions(RATAQ_TEMPLATES, dimensions, options);
}

/**
 * Helper to resolve a human-readable aspect ratio label.
 */
export function getAspectRatioLabel(width: number, height: number, isAr = true): string {
  const ratio = calculateAspectRatio(width, height);
  if (Math.abs(ratio - 1) < 0.05) return isAr ? '1:1 (مربع)' : '1:1 (Square)';
  if (Math.abs(ratio - (9 / 16)) < 0.05) return isAr ? '9:16 (ستوري/ريلز)' : '9:16 (Story/Reels)';
  if (Math.abs(ratio - (1200 / 630)) < 0.05) return isAr ? '1.91:1 (فيسبوك/أغلفة)' : '1.91:1 (Facebook)';
  if (Math.abs(ratio - (16 / 9)) < 0.05) return isAr ? '16:9 (عريض/يوتيوب)' : '16:9 (Landscape)';
  if (Math.abs(ratio - (4 / 5)) < 0.05) return isAr ? '4:5 (بوستر عمودي)' : '4:5 (Vertical Poster)';
  return `${width}×${height}`;
}
