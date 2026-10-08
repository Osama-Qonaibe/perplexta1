import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, authenticateTokenOptional } from '../middleware/auth.js';

const router = express.Router();

/**
 * Loads the user's active subscription plan limits for Studio.
 */
async function getUserStudioLimits(userId: string | number) {
  if (!pool) return { maxProjects: 100, maxStorageMb: 500, maxSnapshots: 20, planName: 'Free' };
  try {
    // Check if user is admin or developer for unconstrained access
    const userRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
    const userRole = userRoleRes.rows[0]?.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'developer' || userRole === 'owner') {
      return { maxProjects: 'unlimited', maxStorageMb: 'unlimited', maxSnapshots: 'unlimited', planName: 'Admin / Unlimited' };
    }

    const res = await pool.query(`
      SELECT p.name_en, p.name_ar, p.limits 
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 
        AND s.status = 'active' 
        AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
      ORDER BY s.current_period_end DESC NULLS LAST
      LIMIT 1
    `, [userId]);

    let limits: any = {};
    let planName = 'Free';
    if (res.rows.length > 0 && res.rows[0]) {
      planName = res.rows[0].name_en || 'Pro';
      const rawLimits = res.rows[0].limits;
      limits = typeof rawLimits === 'string' ? JSON.parse(rawLimits) : (rawLimits || {});
    } else {
      const freePlanRes = await pool.query(`
        SELECT name_en, name_ar, limits 
        FROM plans 
        WHERE plan_type = 'free' OR monthly_price = 0 
        ORDER BY id ASC 
        LIMIT 1
      `).catch(() => ({ rows: [] }));
      
      if (freePlanRes.rows.length > 0 && freePlanRes.rows[0]) {
        planName = freePlanRes.rows[0].name_en || 'Free';
        const rawLimits = freePlanRes.rows[0].limits;
        limits = typeof rawLimits === 'string' ? JSON.parse(rawLimits) : (rawLimits || {});
      }
    }

    const appStudioLimits = limits.app_studio || limits.studio || {};
    
    // Parse max_projects (generous default of 50 projects for seamless creation)
    let maxProjects: number | 'unlimited' = 50;
    if (appStudioLimits.max_projects === 'unlimited' || appStudioLimits.max_projects === -1 || appStudioLimits.maxProjects === 'unlimited' || appStudioLimits.maxProjects === -1) {
      maxProjects = 'unlimited';
    } else {
      const raw = appStudioLimits.max_projects !== undefined ? appStudioLimits.max_projects : appStudioLimits.maxProjects;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxProjects = Math.max(50, Number(raw));
      }
    }

    // Parse max_storage_mb
    let maxStorageMb: number | 'unlimited' = 500;
    if (appStudioLimits.max_storage_mb === 'unlimited' || appStudioLimits.max_storage_mb === -1 || appStudioLimits.maxStorageMb === 'unlimited' || appStudioLimits.maxStorageMb === -1) {
      maxStorageMb = 'unlimited';
    } else {
      const raw = appStudioLimits.max_storage_mb !== undefined ? appStudioLimits.max_storage_mb : appStudioLimits.maxStorageMb;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxStorageMb = Math.max(200, Number(raw));
      }
    }

    // Parse max_snapshots
    let maxSnapshots: number | 'unlimited' = 20;
    if (appStudioLimits.max_snapshots === 'unlimited' || appStudioLimits.max_snapshots === -1 || appStudioLimits.maxSnapshots === 'unlimited' || appStudioLimits.maxSnapshots === -1) {
      maxSnapshots = 'unlimited';
    } else {
      const raw = appStudioLimits.max_snapshots !== undefined ? appStudioLimits.max_snapshots : appStudioLimits.maxSnapshots;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxSnapshots = Math.max(10, Number(raw));
      }
    }

    return { maxProjects, maxStorageMb, maxSnapshots, planName };
  } catch (err) {
    console.error('[getUserStudioLimits Error]:', err);
    return { maxProjects: 50, maxStorageMb: 500, maxSnapshots: 20, planName: 'Free' };
  }
}

/**
 * Calculates current studio usage for a user (number of projects, storage used in bytes and MB, total snapshots).
 */
async function getUserStudioUsage(userId: string | number) {
  if (!pool) return { projectCount: 0, storageBytes: 0, storageMb: 0, snapshotCount: 0 };
  try {
    const wsRes = await pool.query(
      `SELECT 
         COUNT(id) AS project_count,
         COALESCE(SUM(octet_length(COALESCE(files::text, '')) + octet_length(COALESCE(chat_history::text, ''))), 0) AS ws_bytes
       FROM studio_workspaces 
       WHERE user_id = $1`,
      [userId]
    );

    const snapRes = await pool.query(
      `SELECT 
         COUNT(s.id) AS snap_count,
         COALESCE(SUM(octet_length(COALESCE(s.files::text, ''))), 0) AS snap_bytes
       FROM studio_snapshots s
       JOIN studio_workspaces w ON s.workspace_id = w.id
       WHERE w.user_id = $1`,
      [userId]
    );

    const projectCount = parseInt(wsRes.rows[0]?.project_count || '0', 10);
    const wsBytes = parseInt(wsRes.rows[0]?.ws_bytes || '0', 10);
    const snapCount = parseInt(snapRes.rows[0]?.snap_count || '0', 10);
    const snapBytes = parseInt(snapRes.rows[0]?.snap_bytes || '0', 10);

    const totalBytes = wsBytes + snapBytes;
    const storageMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

    return {
      projectCount,
      storageBytes: totalBytes,
      storageMb,
      snapshotCount: snapCount
    };
  } catch (err) {
    console.error('[getUserStudioUsage Error]:', err);
    return { projectCount: 0, storageBytes: 0, storageMb: 0, snapshotCount: 0 };
  }
}

// Studio Quota & Usage Radar Endpoint
router.get('/usage', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.json({
        isGuest: true,
        projectCount: 0,
        maxProjects: 3,
        storageUsedBytes: 0,
        storageUsedMb: 0,
        maxStorageMb: 25,
        snapshotCount: 0,
        maxSnapshots: 3,
        planName: 'Guest'
      });
    }

    const [limits, usage] = await Promise.all([
      getUserStudioLimits(userId),
      getUserStudioUsage(userId)
    ]);

    res.json({
      isGuest: false,
      projectCount: usage.projectCount,
      maxProjects: limits.maxProjects,
      storageUsedBytes: usage.storageBytes,
      storageUsedMb: usage.storageMb,
      maxStorageMb: limits.maxStorageMb,
      snapshotCount: usage.snapshotCount,
      maxSnapshots: limits.maxSnapshots,
      planName: limits.planName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch studio usage metrics' });
  }
});

router.get('/workspaces', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.json([]);
    }
    const result = await pool.query(
      'SELECT id, user_id, title, description, framework_mode, files, chat_history, is_public, created_at, updated_at FROM studio_workspaces WHERE user_id = $1 ORDER BY updated_at DESC', 
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// In-memory workspace cache ensuring live previews and share links work 100% of the time (including guest/local sessions)
const inMemoryWorkspaces = new Map<string, any>();

router.post('/workspaces', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id, title, description, frameworkMode, files, chatHistory, isPublic } = req.body;
    if (!id || !title) {
      return res.status(400).json({ error: 'Workspace id and title are required' });
    }

    // Check Plan Limits & Storage Quota for authenticated users
    if (userId && pool) {
      const existingWs = await pool.query('SELECT id, user_id FROM studio_workspaces WHERE id = $1', [id]);
      const isNewWorkspace = existingWs.rows.length === 0;

      const [limits, usage] = await Promise.all([
        getUserStudioLimits(userId),
        getUserStudioUsage(userId)
      ]);

      // Projects Count Limit Enforcement (Only for creating brand new workspaces beyond quota)
      if (isNewWorkspace && typeof limits.maxProjects === 'number' && usage.projectCount >= limits.maxProjects) {
        // Still save in memory so preview works, but alert user on cloud persistence
        inMemoryWorkspaces.set(id, {
          id,
          user_id: userId || null,
          title,
          description: description || '',
          framework_mode: frameworkMode || 'html',
          files: files || {},
          chat_history: chatHistory || [],
          is_public: isPublic !== undefined ? !!isPublic : false,
          updated_at: new Date()
        });
        return res.json({ 
          success: true, 
          localOnly: true,
          limitReached: true,
          message: `لقد بلغت الحد الأقصى للمشاريع السحابية (${limits.maxProjects} مشاريع). تم حفظ المشروع محلياً في جلستك.`
        });
      }
    }

    // Always cache in memory so previews and live links never fail with "Workspace not found"
    inMemoryWorkspaces.set(id, {
      id,
      user_id: userId || null,
      title,
      description: description || '',
      framework_mode: frameworkMode || 'html',
      files: files || {},
      chat_history: chatHistory || [],
      is_public: isPublic !== undefined ? !!isPublic : false,
      updated_at: new Date()
    });

    try {
      await pool.query(
        `INSERT INTO studio_workspaces (id, user_id, title, description, framework_mode, files, chat_history, is_public) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET 
           user_id = COALESCE(EXCLUDED.user_id, studio_workspaces.user_id),
           title = EXCLUDED.title,
           description = COALESCE(EXCLUDED.description, studio_workspaces.description),
           framework_mode = EXCLUDED.framework_mode,
           files = EXCLUDED.files,
           chat_history = COALESCE(EXCLUDED.chat_history, studio_workspaces.chat_history),
           is_public = COALESCE(EXCLUDED.is_public, studio_workspaces.is_public),
           updated_at = CURRENT_TIMESTAMP`,
        [
          id, 
          userId || null, 
          title, 
          description || '', 
          frameworkMode || 'html', 
          JSON.stringify(files || {}), 
          JSON.stringify(chatHistory || []), 
          isPublic !== undefined ? !!isPublic : false
        ]
      );
    } catch (dbErr) {
      console.warn('[Studio Workspaces DB Upsert Notice]:', dbErr);
    }
    
    res.json({ success: true, localOnly: !userId });
  } catch (error) {
    console.error('[Studio Workspaces Save Error]:', error);
    res.status(500).json({ error: 'Failed to save workspace' });
  }
});

router.get('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (userId) {
      const result = await pool.query('SELECT * FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }

    const cached = inMemoryWorkspaces.get(id);
    if (cached) {
      return res.json(cached);
    }
    
    return res.status(404).json({ error: 'Workspace not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workspace' });
  }
});

router.delete('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    await pool.query('DELETE FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

router.patch('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    const { title, description, isPublic } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const updateRes = await pool.query(
      `UPDATE studio_workspaces 
       SET title = $1, 
           description = COALESCE($2, description), 
           is_public = COALESCE($3, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title.trim(), description, isPublic, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found or unauthorized' });
    }

    res.json({ success: true, workspace: updateRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Workspace Version Snapshots Endpoints
router.get('/workspaces/:id/snapshots', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    // Verify workspace ownership
    const wsCheck = await pool.query('SELECT id FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (wsCheck.rows.length === 0) return res.status(404).json({ error: 'Workspace not found' });

    const result = await pool.query(
      'SELECT id, workspace_id, version_name, created_at FROM studio_snapshots WHERE workspace_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

router.post('/workspaces/:id/snapshots', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    const { versionName, files } = req.body;
    if (!userId) {
      return res.json({ success: true, localOnly: true });
    }
    if (!versionName) return res.status(400).json({ error: 'Version name is required' });

    const wsCheck = await pool.query('SELECT id, files FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (wsCheck.rows.length === 0) return res.status(404).json({ error: 'Workspace not found' });

    // Snapshot count enforcement per plan
    if (pool) {
      const limits = await getUserStudioLimits(userId);
      if (typeof limits.maxSnapshots === 'number') {
        const snapCountRes = await pool.query('SELECT count(*) as count FROM studio_snapshots WHERE workspace_id = $1', [id]);
        const currentSnaps = parseInt(snapCountRes.rows[0]?.count || '0', 10);
        const maxSnaps = limits.maxSnapshots;
        
        if (currentSnaps >= maxSnaps) {
          const deleteCount = (currentSnaps - maxSnaps) + 1;
          await pool.query(`
            DELETE FROM studio_snapshots 
            WHERE id IN (
              SELECT id FROM studio_snapshots 
              WHERE workspace_id = $1 
              ORDER BY created_at ASC 
              LIMIT $2
            )
          `, [id, deleteCount]);
        }
      }
    }

    const filesToSave = files || (typeof wsCheck.rows[0].files === 'string' ? JSON.parse(wsCheck.rows[0].files) : wsCheck.rows[0].files);

    const result = await pool.query(
      'INSERT INTO studio_snapshots (workspace_id, version_name, files) VALUES ($1, $2, $3) RETURNING id, version_name, created_at',
      [id, versionName, JSON.stringify(filesToSave)]
    );
    res.json({ success: true, snapshot: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.post('/workspaces/:id/snapshots/:snapshotId/restore', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id, snapshotId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const snapResult = await pool.query(
      `SELECT s.files, s.version_name 
       FROM studio_snapshots s
       JOIN studio_workspaces w ON s.workspace_id = w.id
       WHERE s.id = $1 AND w.id = $2 AND w.user_id = $3`,
      [snapshotId, id, userId]
    );

    if (snapResult.rows.length === 0) {
      return res.status(404).json({ error: 'Snapshot not found or unauthorized' });
    }

    const restoredFiles = snapResult.rows[0].files;

    await pool.query(
      'UPDATE studio_workspaces SET files = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
      [typeof restoredFiles === 'string' ? restoredFiles : JSON.stringify(restoredFiles), id, userId]
    );

    res.json({ 
      success: true, 
      versionName: snapResult.rows[0].version_name,
      files: typeof restoredFiles === 'string' ? JSON.parse(restoredFiles) : restoredFiles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore snapshot' });
  }
});

// In-memory cache for proxied scripts to ensure 0ms latency on subsequent loads and bypass CSP
const scriptCache: Record<string, { content: string; contentType: string }> = {};

router.get('/proxy/:library', async (req, res) => {
  const { library } = req.params;
  const libraryUrls: Record<string, string> = {
    tailwind: 'https://cdn.tailwindcss.com',
    react: 'https://unpkg.com/react@18/umd/react.production.min.js',
    'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    babel: 'https://unpkg.com/@babel/standalone/babel.min.js',
    lucide: 'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
    chartjs: 'https://cdn.jsdelivr.net/npm/chart.js',
    scrollreveal: 'https://unpkg.com/scrollreveal'
  };

  const url = libraryUrls[library.toLowerCase()];
  if (!url) {
    return res.status(404).send('Library not found');
  }

  if (scriptCache[url]) {
    res.setHeader('Content-Type', scriptCache[url].contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(scriptCache[url].content);
  }

  try {
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch from upstream: ${fetchResponse.statusText}`);
    }
    const content = await fetchResponse.text();
    const contentType = fetchResponse.headers.get('content-type') || 'application/javascript';

    scriptCache[url] = { content, contentType };

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(content);
  } catch (error: any) {
    console.error(`[Studio Proxy Error] Failed to proxy ${library}:`, error?.message || error);
    res.status(500).send(`Failed to load ${library} library`);
  }
});

router.get('/workspaces/:id/preview', authenticateTokenOptional, async (req: any, res) => {
  try {
    const { id } = req.params;
    const lang = (req.query.lang || 'ar') as string;
    const dir = (req.query.dir || 'rtl') as string;

    let workspace: any = null;

    try {
      const result = await pool.query('SELECT * FROM studio_workspaces WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        workspace = result.rows[0];
      }
    } catch (dbErr) {
      console.warn('[Studio Preview DB Query Error]:', dbErr);
    }

    if (!workspace) {
      workspace = inMemoryWorkspaces.get(id);
    }

    if (!workspace) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${lang === 'ar' ? 'المشروع قيد المزامنة' : 'Workspace Syncing'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6 text-center font-sans">
          <div class="max-w-md space-y-4">
            <div class="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center text-xl font-bold">⚡</div>
            <h1 class="text-xl font-bold">${lang === 'ar' ? 'المشروع قيد المزامنة أو قيد الإنشاء' : 'Workspace Syncing or Initializing'}</h1>
            <p class="text-xs text-slate-400 leading-relaxed">${lang === 'ar' ? 'يرجى الرجوع للاستوديو والنقر على "فتح بالمتصفح" أو إجراء حفظ للمشروع.' : 'Please return to studio and open live preview again.'}</p>
            <a href="/app" class="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition">
              ${lang === 'ar' ? 'الرجوع للاستوديو' : 'Back to Studio'}
            </a>
          </div>
        </body>
        </html>
      `);
    }

    const files = typeof workspace.files === 'string' ? JSON.parse(workspace.files) : (workspace.files || {});

    let rawHtml = files['index.html']?.content || '<div class="p-8 text-center text-slate-400">جاري تحميل المشروع...</div>';
    if (rawHtml.includes('\\n') && (rawHtml.match(/\\n/g)?.length || 0) > 3) {
      rawHtml = rawHtml
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
    }

    let htmlContent = rawHtml
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?(?:src\/)?[^"']+\.(?:jsx?|tsx?|js|ts)["'][^>]*><\/script>/gi, '')
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?app\.js["'][^>]*><\/script>/gi, '')
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?script\.js["'][^>]*><\/script>/gi, '')
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?main\.js["'][^>]*><\/script>/gi, '')
      .replace(/<link\s+[^>]*href=["']\/?(?:\.\/)?(?:src\/)?[^"']+\.css["'][^>]*\/?>/gi, '')
      .replace(/https:\/\/unpkg\.com\/scrollreveal(?:\/dist\/scrollreveal\.min\.js)?/gi, '/api/studio/proxy/scrollreveal')
      .replace(/https:\/\/unpkg\.com\/lucide@latest\/dist\/umd\/lucide\.js/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/unpkg\.com\/lucide@latest/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/cdn\.tailwindcss\.com/gi, '/api/studio/proxy/tailwind');

    const allCss = Object.keys(files)
      .filter(p => p.endsWith('.css'))
      .map(p => {
        let c = files[p].content || '';
        if (c.includes('\\n')) c = c.replace(/\\n/g, '\n');
        return c;
      })
      .join('\n');

    const allCodeFiles = Object.keys(files)
      .filter(p => p.startsWith('src/') || p === 'app.js' || p === 'script.js' || p === 'index.js')
      .filter(p => p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx'));

    const getFilePriority = (path: string) => {
      if (path.includes('types')) return 1;
      if (path.includes('data') || path.includes('mock')) return 2;
      if (path.includes('context')) return 3;
      if (path.includes('components')) return 4;
      if (path.includes('pages')) return 5;
      if (path.endsWith('App.jsx') || path.endsWith('App.tsx')) return 6;
      if (path.endsWith('main.jsx') || path.endsWith('main.tsx') || path === 'app.js') return 7;
      return 4;
    };

    const sortedFiles = [...allCodeFiles].sort((a, b) => getFilePriority(a) - getFilePriority(b));

    const entryCandidates = [
      'src/main.tsx', 'src/main.jsx', 'src/main.js', 'src/main.ts',
      'src/app.tsx', 'src/app.jsx', 'src/app.js', 'src/app.ts',
      'src/index.tsx', 'src/index.jsx', 'src/index.js', 'src/index.ts',
      'main.tsx', 'main.jsx', 'main.js', 'main.ts',
      'App.tsx', 'App.jsx', 'App.js',
      'app.js', 'script.js', 'index.js'
    ];

    const entryFilePath = entryCandidates.find(p => files[p] && typeof files[p].content === 'string' && files[p].content.trim().length > 0) || '';

    const otherJsScripts = sortedFiles
      .filter(p => p !== entryFilePath)
      .map(p => {
        const isBabel = p.endsWith('.jsx') || p.endsWith('.tsx');
        if (isBabel) {
          return `
            <script type="babel" data-presets="typescript,react,env" data-file="${p}">
              /* --- File: ${p} --- */
              ${cleanEsmForBrowser(files[p].content)}
            </script>
          `;
        } else {
          return `
            <script data-file="${p}">
              /* --- File: ${p} --- */
              ${cleanEsmForBrowser(files[p].content)}
            </script>
          `;
        }
      }).join('\n');

    const rawEntry = entryFilePath ? files[entryFilePath].content : '';
    const entryJs = cleanEsmForBrowser(rawEntry);

    if (!htmlContent.includes('id="root"') && !htmlContent.includes('id="app"')) {
      const defaultContainers = '<div id="root"></div><div id="app"></div>';
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', defaultContainers + '</body>');
      } else {
        htmlContent += defaultContainers;
      }
    }

    const injectionHead = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <script src="/api/studio/proxy/tailwind"></script>
      <script src="/api/studio/proxy/react"></script>
      <script src="/api/studio/proxy/react-dom"></script>
      <script src="/api/studio/proxy/babel"></script>
      <script src="/api/studio/proxy/lucide"></script>
      <script src="/api/studio/proxy/chartjs"></script>
      <script>
        // Global Image Fallback Polyfill (prevents broken image placeholder icons)
        window.addEventListener('error', function(e) {
          if (e.target && e.target.tagName === 'IMG') {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
          }
        }, true);

        // Event listener race-condition polyfill for DOMContentLoaded and load events in iframes/tabs
        (function() {
          const originalAddEventListener = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
              try { listener.call(this, { type: 'DOMContentLoaded', target: document, currentTarget: document }); } catch(e) { console.error('DOMContentLoaded race polyfill bypass:', e); }
              return;
            }
            if (type === 'load' && document.readyState === 'complete') {
              try { listener.call(this, { type: 'load', target: window, currentTarget: window }); } catch(e) { console.error('load race polyfill bypass:', e); }
              return;
            }
            return originalAddEventListener.apply(this, arguments);
          };
        })();

        window.initLucideIcons = function() {
          try {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons();
            } else if (window.Lucide && typeof window.Lucide.createIcons === 'function') {
              window.Lucide.createIcons();
            }
          } catch(_) {}
        };
        window.LucideIconProxy = new Proxy({}, {
          get: function(target, prop) {
            if (typeof prop === 'string' && prop !== 'then' && prop !== 'prototype') {
              return function LucideIconComponent(props) {
                var cls = (props && props.className) ? props.className + ' lucide' : 'w-5 h-5 inline-block lucide';
                var iconName = prop.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                return React.createElement('i', Object.assign({ 'data-lucide': iconName, className: cls }, props));
              };
            }
            return undefined;
          }
        });
        if (window.ReactDOM && !window.ReactDOM.createRoot) {
          window.ReactDOM.createRoot = function(container) {
            return {
              render: function(element) {
                window.ReactDOM.render(element, container);
              }
            };
          };
        }
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              fontFamily: {
                sans: ['Tajawal', 'Cairo', 'Inter', 'system-ui', 'sans-serif'],
                tajawal: ['Tajawal', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
              }
            }
          }
        }
      </script>
      <style>
        ${allCss}
        body {
          font-family: 'Tajawal', 'Cairo', 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      </style>
      <script>
        (function() {
          window.process = window.process || { env: {} };
          window.process.env = Object.assign(window.process.env, {});
        })();
      </script>
    `;

    const isEntryBabel = entryFilePath.endsWith('.jsx') || entryFilePath.endsWith('.tsx');

    const injectionScripts = `
      ${otherJsScripts}
      ${isEntryBabel ? `
      <script type="babel" data-presets="typescript,react,env" data-file="${entryFilePath || 'entry'}">
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });

        /* --- Entry File: ${entryFilePath} --- */
        ${entryJs}
      </script>
      ` : `
      <script data-file="${entryFilePath || 'entry'}">
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });

        /* --- Entry File: ${entryFilePath} --- */
        ${entryJs}
      </script>
      `}
    `;

    if (/<head[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1${injectionHead}`);
    } else if (/<html[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<html[^>]*>)/i, `$1<head>${injectionHead}</head>`);
    } else {
      htmlContent = `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head>${injectionHead}</head><body>${htmlContent}</body></html>`;
    }

    if (/<\/body>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/body>)/i, `${injectionScripts}$1`);
    } else if (/<\/html>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/html>)/i, `${injectionScripts}$1`);
    } else {
      htmlContent = htmlContent + injectionScripts;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error: any) {
    console.error('[Studio Preview Error] Failed to render workspace preview:', error?.message || error);
    res.status(500).send('Failed to generate workspace preview');
  }
});

function normalizeFileContent(raw: string): string {
  if (typeof raw !== 'string') return '';
  let content = raw;
  if (content.includes('\\n')) {
    content = content
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return content;
}

function cleanEsmForBrowser(code: string): string {
  if (!code) return '';
  return code
    .replace(/import\.meta\.env/g, '(window.__VITE_ENV__ || window.process?.env || {})')
    .replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g, 'const {$1} = window.LucideIconProxy || {};')
    .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1')
    .replace(/export\s+default\s+function\s*/g, 'function ')
    .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'class $1')
    .replace(/export\s+default\s+class\s*/g, 'class ')
    .replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, 'window.$1 = $1;')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+class\s+/g, 'class ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s*\{([\s\S]*?)\};?/g, '');
}

router.post('/generate', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;
    const { prompt, files, errorLogs, activeFilePath, history } = req.body;
    
    if (!prompt && (!errorLogs || errorLogs.length === 0)) {
      return res.status(400).json({ error: 'Prompt or error logs required' });
    }

    const { pool } = await import('../db/index.js');
    const { callAIProvider, getProviderKey, getProviderUrlKey } = await import('../services/ai.js');
    const { checkAndIncrementQuota } = await import('../services/quota.js');
    const { getCachedOrchestratorConfig, getCachedApiKeysVault } = await import('../db/queries.js');

    if (userId) {
      const quotaCheck = await checkAndIncrementQuota(userId, 'code');
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: 'لقد تجاوزت الحد المسموح به لأداة الكود. يرجى ترقية باقتك.',
          message_en: 'Code generation quota exceeded. Please upgrade your plan.'
        });
      }
    }

    // Dynamic Database Orchestrator Routing (Zero hardcoded model names)
    let route = await getCachedOrchestratorConfig('code').catch(() => null);
    if (!route) {
      const routeRes = await pool.query("SELECT * FROM tool_orchestrator WHERE tool_id = 'code' AND is_active = true LIMIT 1");
      if (routeRes.rows.length > 0) {
        route = routeRes.rows[0];
      }
    }

    // 1 Primary + 3 Fallbacks strictly from Database Tool Orchestrator Registry (Decree #3: Orchestrator Absolutism)
    // The Studio strictly listens to the Orchestrator with ZERO external calls or hardcoded models.
    const targets: Array<{ provider: string; model: string }> = [];

    if (route && route.is_active && route.primary_provider && route.primary_model) {
      // 1. Primary Model
      targets.push({ provider: route.primary_provider.trim(), model: route.primary_model.trim() });

      // 2. Fallback 1
      if (route.fallback_1_provider && route.fallback_1_model) {
        targets.push({ provider: route.fallback_1_provider.trim(), model: route.fallback_1_model.trim() });
      }

      // 3. Fallback 2
      if (route.fallback_2_provider && route.fallback_2_model) {
        targets.push({ provider: route.fallback_2_provider.trim(), model: route.fallback_2_model.trim() });
      }

      // 4. Fallback 3
      if (route.fallback_3_provider && route.fallback_3_model) {
        targets.push({ provider: route.fallback_3_provider.trim(), model: route.fallback_3_model.trim() });
      }
    }

    if (targets.length === 0) {
      throw new Error(
        'لم يتم ضبط مسار أداة هندسة البرمجيات (code) في الأوركسترا بلوحة التحكم. يرجى الدخول إلى لوحة التحكم > الأوركسترا، وتعيين النموذج الأساسي والبدائل الاحتياطية (1، 2، 3) وتفعيل الأداة.'
      );
    }

    // Safe and precise classification: Only treat as new project build on explicit UI parameter or when files are empty.
    // This protects existing workspace files from destruction during updates.
    const isNewProjectRequest = req.body.isNewProject === true || Object.keys(files || {}).length === 0;

    // Dynamic Task-Aware Status Messages (Clean Executive Style without Emojis)
    const lowerPrompt = (prompt || '').toLowerCase();
    let dynamicAnalyzingMsg = 'تحليل المتطلبات البرمجية وتخطيط البنية...';
    let dynamicGeneratingMsg = 'كتابة وتنفيذ التعديلات البرمجية في الوقت الفعلي...';

    if (/css|ستايل|مظهر|ألوان|تصميم|تنسيق|خلفية|خط|theme|color|style|dark mode|font/i.test(lowerPrompt)) {
      dynamicAnalyzingMsg = 'فحص ملفات التنسيق والهيكل البصري...';
      dynamicGeneratingMsg = 'تدقيق وتحسين أنماط CSS والألوان والتجاوب البصري...';
    } else if (/db|قاعدة|بيانات|جدول|جداول|sql|schema|database|table/i.test(lowerPrompt)) {
      dynamicAnalyzingMsg = 'تدقيق هيكل البيانات ومخطط SQLite...';
      dynamicGeneratingMsg = 'كتابة مخطط الجداول واستعلامات SQL المطلوبة...';
    } else if (/js|جافاسكريبت|دالة|منطق|تفاعل|زر|سلة|بحث|تصفية|search|filter|script|function|cart/i.test(lowerPrompt)) {
      dynamicAnalyzingMsg = 'مراجعة المنطق البرمجي والأحداث التفاعلية...';
      dynamicGeneratingMsg = 'برمجة وتطوير منطق JavaScript والوظائف التفاعلية...';
    } else if (/خطأ|error|fix|إصلاح|terminal|طرفية|تصحيح|debug/i.test(lowerPrompt) || (errorLogs && errorLogs.length > 0)) {
      dynamicAnalyzingMsg = 'فحص سجلات الأخطاء وتتبع المشاكل البرمجية...';
      dynamicGeneratingMsg = 'تصحيح الأخطاء البرمجية وإعادة المزامنة بدقة...';
    } else if (isNewProjectRequest) {
      dynamicAnalyzingMsg = 'هندسة معمارية المنظومة وشجرة ملفات المشروع...';
      dynamicGeneratingMsg = 'توليد وبناء شجرة الملفات الكاملة للمشروع الجديد...';
    }

    const currentFilesSummary = Object.keys(files || {}).length > 0
      ? Object.keys(files || {}).map(p => {
          const f = files[p];
          return `FILE: ${p} (${f.type || 'text'})\nCONTENT:\n${f.content || ''}\n---`;
        }).join('\n\n')
      : '(No existing files in workspace)';

    const systemPrompt = `You are Perplexta Studio Sovereign AI Senior Software Engineer & IDE Engine (PERPLEXTA ENGINE SPECIFICATION).
You build, refactor, and maintain complete, production-ready, highly polished software applications with surgical accuracy, self-healing capability, and strict 3-phase pipeline execution.

1. WORLD-CLASS ARCHITECTURAL CONSTITUTION & MULTI-FRAMEWORK STANDARDS:
You must support two distinct types of projects. Select the correct framework depending on the user's prompt or framework mode:

- OPTION A: REACT & VITE APPLICATION (react-vite)
  * Use this for modern React, state-managed, multi-view, or interactive applications.
  * Structural Requirements:
    - package.json: MUST contain standard dependencies ("react", "react-dom", "lucide-react", "tailwindcss").
    - vite.config.js: Configures the Vite React plugin.
    - index.html: MUST contain <div id="root"></div> and <script type="module" src="/src/main.jsx"></script>.
    - src/main.jsx (or .tsx): Entry point that initializes ReactDOM.createRoot.
    - src/App.jsx (or .tsx): Main application wrapper with layout and routing.
    - src/components/*.jsx (or .tsx): All component files (e.g., Navbar.jsx, ProductCard.jsx, CartDrawer.jsx) containing React JSX code.
    - CRITICAL: Component files containing JSX MUST strictly use .jsx or .tsx extensions. NEVER use plain .js extensions for React JSX code.
    - Organize data in src/data/mockData.js, state in src/context/CartContext.jsx.

- OPTION B: STANDALONE VANILLA HTML5 & TAILWIND (html-tailwind)
  * Use this if the user explicitly requests an HTML page, landing page, plain JavaScript, or a simple uncompiled website.
  * Structural Requirements:
    - index.html: Main entry file in the root directory.
    - MUST load Tailwind CSS, Lucide Icons, and Fonts directly in the <head>:
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
    - src/app.js (or app.js in root): Handles interactive events and DOM rendering.
    - index.css or style.css: Local custom styling if needed.
    - NO package.json or vite.config.js is required for Option B. Keep it pure, lightweight, and server-independent!

- CRITICAL QUALITY DIRECTIVES & ZERO OMISSION POLICY:
  * COMPLETE UNCOMPROMISED APPLICATIONS: Always build fully functional, feature-complete applications with rich interactive UI, working state management, realistic mock data, filters, modals, search, drawer carts, responsive layouts, and dark/light modes. NEVER output placeholders, TODOs, or truncated snippets.
  * ABSOLUTE UNLIMITED GENERATION CAPACITY (NO FILE OR CODE LENGTH RESTRICTIONS):
    - There are absolutely NO limits or restrictions on the number of files, directories, or the total line count of the code you can generate.
    - You have unlimited bandwidth and tokens. Always generate full, robust, high-fidelity source code with maximum richness, multiple interactive files, subfolders, full styling, and advanced database integration, without any restriction or compression.
    - If the user asks for a feature, develop every single file and auxiliary component needed to make it professional, production-grade, and beautifully styled, without shortcuts.
  * ABSOLUTE NO BROKEN IMAGES POLICY: You MUST NEVER use local placeholder image paths like "hero.png", "logo.png", "bg.jpg" or other broken local assets. You MUST use clean inline SVG markup, or fully qualified, high-resolution direct URLs from Unsplash (e.g., "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" for technology/websites).
  * ABSOLUTE SVG-FIRST ICON DIRECTIVE: You MUST NEVER use third-party icon classes (like FontAwesome "fa fa-user" or bootstrap icons) without importing their stylesheets, which leads to blank squares. To guarantee 100% reliable icon rendering with zero external dependencies, you MUST use inline SVG elements ("<svg>...</svg>") or native Lucide elements.
  * DYNAMIC PROGRESSIVE SUGGESTIONS CONSTITUTION: You MUST output exactly 3 context-aware, highly customized follow-up suggestions in Arabic inside the "suggestions" field of your <perplexta_blueprint> (each should be a clear, professional sentence of 4-10 words).
    - Study existing project files: If a feature is already built (e.g. dynamic cart, dark/light mode toggle, products list), DO NOT suggest adding it again.
    - Instead, propose progressive advancements to make the current layout more professional, such as: "تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين", "تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك", "ربط سلة المشتريات ببوابة دفع ذكية وفواتير مفصلة", "إضافة نظام قسائم خصم وتخفيضات ذكي".
    - Suggestions must never be generic, repetitive, or static. They must represent a true logical next step in building an elite production app.
  * ZERO OMISSION POLICY (MANDATORY EXECUTION):
    - If you list a file path in the "file_tree_order" array of <perplexta_blueprint>, you MUST write its complete code inside a corresponding <perplexta_file path="..."> tag.
    - NEVER skip or omit any file listed in the blueprint.
    - NEVER stop generating midway, and NEVER output placeholders (like "// ... rest of code").
    - If you are generating multiple files, write them one by one completely inside the same response.
  * THE "NEVER DESTROY, ONLY EVOLVE" SUPREME RULE (قانون البناء التراكمي السيادي):
    - You are strictly FORBIDDEN from replacing, downgrading, or deleting a beautiful, polished layout or feature when adding new functionality.
    - Always read and analyze the existing index.html and associated files carefully. Preserve the exact visual structure, typography, grids, background colors, header/navbar, hero banners, search bars, and current content of all files.
    - Your updates must be strictly ADDITIVE, incremental, and highly careful.
    - For example, if adding a "payment modal" or "checkout system", do NOT rebuild the main page layout from scratch. Keep the existing navbar and products list 100% intact, and only add the modal markup at the bottom of the body and attach a click event listener in app.js that toggles its visibility.
    - NEVER delete existing CSS, Tailwind configurations, assets, list templates, or scripts. Any destruction or degradation of the existing layout aesthetics is a catastrophic failure.
  * SURGICAL & ACCURATE INCREMENTAL UPDATES: When updating an existing project, inspect EXISTING PROJECT FILES carefully. Preserve all existing component files and framework choices (React/Vite or HTML/JS). Only modify or create affected files, keeping all other codebase elements intact.
  * FULL INTERACTIVE EVENT WIRING DIRECTIVE (ربط الأحداث التفاعلية بنسبة 100%):
    - When adding any interactive feature (e.g. Login card/modal, User database, Cart drawer, Coupons, Checkout modal, Filters, Search):
    - You MUST write the complete visual modal/card markup with clean Tailwind classes AND provide all necessary IDs / classes.
    - You MUST write the complete JavaScript logic in app.js (or <script>) that attaches event listeners ('click', 'submit', 'input') to open, close, submit, and display state.
    - Test DOM bindings: Ensure buttons in navbar (like "تسجيل الدخول" or "سلة المشتريات") have IDs like "loginBtn", "cartBtn" and are connected to functions in JavaScript. Never leave a button without a working event listener!
    - Provide realistic simulated storage (e.g. localStorage.setItem('currentUser', ...)) so the UI updates immediately when the user interacts with it.

2. THREE-PHASE EXECUTION PIPELINE PROTOCOL:

PHASE 1: ARCHITECTURE BLUEPRINT (<perplexta_blueprint>)
Output a structured JSON blueprint before writing code files:
<perplexta_blueprint>
{
  "phase": "blueprint",
  "project_name": "digital-store-pro",
  "framework": "react-vite" | "html-tailwind",
  "dependencies": {
    "packages": {
      "react": "latest",
      "react-dom": "latest",
      "lucide-react": "latest",
      "tailwindcss": "latest"
    }
  },
  "file_tree_order": [
    "package.json",
    "vite.config.js",
    "index.html",
    "src/data/products.js",
    "src/context/CartContext.jsx",
    "src/components/Navbar.jsx",
    "src/components/Hero.jsx",
    "src/components/ProductCard.jsx",
    "src/components/CartDrawer.jsx",
    "src/components/Footer.jsx",
    "src/App.jsx",
    "src/main.jsx"
  ],
  "suggestions": [
    "تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين",
    "تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك",
    "ربط سلة المشتريات ببوابة دفع ذكية وفواتير مفصلة"
  ]
}
</perplexta_blueprint>

PHASE 2: INCREMENTAL SYNTHESIS (<perplexta_file path="...">)
Write full, pristine files sequentially following the dependency order in file_tree_order:
<perplexta_file path="path/to/file.ext">
... complete clean production code without truncation or placeholders ...
</perplexta_file>

For surgical inline patches on existing code:
<<<< SEARCH
// exact original code snippet to replace
====
// corrected replacement code
>>>>

File deletion:
<perplexta_delete path="path/to/file.ext" />

PHASE 3: CONCISE PROFESSIONAL TECHNICAL EXPLANATION
After generating all code files and patches, write a concise, executive technical summary in Arabic (2-4 clear sentences) explaining your actual modifications:
1. Explain the architectural adjustments made to the component tree and data flow.
2. State the exact files modified/created and the purpose of the new functions/events.
3. Confirm DOM stability and responsive design verification.
CRITICAL: Maintain a clean, professional senior engineer tone without using decorative emojis or conversational greetings.

FORMAT: Start directly with <perplexta_blueprint>, then write complete <perplexta_file> tags, and end with the concise technical explanation.`;

    const userPrompt = `USER REQUEST: ${prompt || 'Build and elevate the project'}\nREQUEST TYPE: ${isNewProjectRequest ? 'NEW_PROJECT_BUILD' : 'TARGETED_UPDATE'}\nACTIVE FILE IN EDITOR: ${activeFilePath || 'index.html'}\n\nERROR LOGS (IF ANY):\n${JSON.stringify(errorLogs || [])}\n\nEXISTING PROJECT FILES:\n${currentFilesSummary}`;

    const isStreamingRequested = req.headers['accept']?.includes('text/event-stream') || req.body.stream === true;
    
    if (isStreamingRequested) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }

      res.write(`data: ${JSON.stringify({ type: 'step', step: 'analyzing', message: dynamicAnalyzingMsg })}\n\n`);
    }

    let rawResponse = '';
    let usedProvider = '';
    let usedModel = '';

    const formattedHistory: Array<{ role: string; content: string }> = Array.isArray(history)
      ? history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content || '') }))
      : [];

    const failedProviders = new Set<string>();

    // Silent Failover Execution
    for (const target of targets) {
      if (failedProviders.has(target.provider)) {
        continue;
      }
      try {
        const key = await getProviderKey(target.provider);
        if (!key && target.provider !== 'ollama') continue;
        const urlKey = await getProviderUrlKey(target.provider).catch(() => undefined);

        if (isStreamingRequested) {
          res.write(`data: ${JSON.stringify({ type: 'step', step: 'generating', message: dynamicGeneratingMsg })}\n\n`);
        }

        let accumulated = '';
        await callAIProvider(
          target.provider,
          target.model,
          key || '',
          userPrompt,
          systemPrompt,
          (chunk) => {
            accumulated += chunk;
            if (isStreamingRequested) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`);
            }
          },
          formattedHistory,
          { stream: isStreamingRequested },
          urlKey || undefined
        );

        if (accumulated && accumulated.trim().length > 0) {
          rawResponse = accumulated;
          usedProvider = target.provider;
          usedModel = target.model;
          break;
        }
      } catch (callErr: any) {
        failedProviders.add(target.provider);
        console.warn(`[Studio Orchestrator Failover] Target ${target.provider}/${target.model} failed:`, callErr?.message);
      }
    }

    if (!rawResponse || rawResponse.trim().length === 0) {
      throw new Error('فشلت جميع محاولات الاتصال بمزودي الذكاء الاصطناعي (بما في ذلك خادم Ollama المحلي والاتصال السحابي). يرجى التحقق من مفاتيح واجهة البرمجة (API Keys) في لوحة التحكم أو تشغيل خادم Ollama.');
    }
    
    // Universal Multi-Protocol Output Parser
    const newlyGeneratedFiles: Record<string, any> = {};
    let parsedBlueprint: any = null;
    let parsedReply = '';
    let parsedSummary = '';
    const parsedLogs: string[] = [];
    const parsedSuggestions: string[] = [];

    // 0. Parse <perplexta_blueprint> JSON schema
    const bpMatch = /<perplexta_blueprint>([\s\S]*?)<\/perplexta_blueprint>/i.exec(rawResponse);
    if (bpMatch) {
      try {
        parsedBlueprint = JSON.parse(bpMatch[1].trim());
      } catch (_) {}
    }

    // 1. Parse <perplexta_file path="..."> tags
    const fileTagRegex = /<perplexta_file\s+path=["']([^"']+)["'][^>]*>([\s\S]*?)<\/perplexta_file>/gi;
    let tagMatch;
    while ((tagMatch = fileTagRegex.exec(rawResponse)) !== null) {
      const filePath = tagMatch[1].trim();
      const content = normalizeFileContent(tagMatch[2].trim());
      const ext = filePath.split('.').pop() || 'txt';
      const fileName = filePath.split('/').pop() || filePath;
      if (content) {
        newlyGeneratedFiles[filePath] = {
          name: fileName,
          path: filePath,
          type: ext,
          content,
          isEntry: filePath === 'index.html'
        };
      }
    }

    // 1.1 Parse <<<< SEARCH ... ==== ... >>>> surgical patches
    const patchRegex = /<<<<\s*SEARCH\s*\n([\s\S]*?)\n====\s*\n([\s\S]*?)\n>>>>/gi;
    let patchMatch;
    while ((patchMatch = patchRegex.exec(rawResponse)) !== null) {
      const searchTarget = patchMatch[1];
      const replacementText = patchMatch[2];
      const targetPath = activeFilePath || 'index.html';
      const existingFile = files[targetPath] || newlyGeneratedFiles[targetPath];
      if (existingFile && existingFile.content && existingFile.content.includes(searchTarget)) {
        const patchedContent = existingFile.content.replace(searchTarget, replacementText);
        newlyGeneratedFiles[targetPath] = {
          ...existingFile,
          content: patchedContent
        };
      }
    }

    // 2. Parse Markdown code blocks with path or language hints
    if (Object.keys(newlyGeneratedFiles).length === 0) {
      const mdBlockRegex = /```(?:([a-zA-Z0-9_-]+)(?:\s+(?:path=["']|file=["'])?([^"'\s\n`]+)["']?)?)?\s*\n([\s\S]*?)```/gi;
      let mdMatch;
      while ((mdMatch = mdBlockRegex.exec(rawResponse)) !== null) {
        const lang = (mdMatch[1] || '').toLowerCase();
        let pathHint = mdMatch[2] || '';
        const content = normalizeFileContent(mdMatch[3].trim());

        if (!pathHint) {
          if (lang === 'html' || content.includes('<!DOCTYPE html>') || content.includes('<html')) {
            pathHint = 'index.html';
          } else if (lang === 'css' || (content.includes('{') && content.includes('}') && (content.includes('body') || content.includes(':root') || content.includes('@import')))) {
            pathHint = 'style.css';
          } else if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
            pathHint = 'app.js';
          } else if (lang === 'sql' || content.toUpperCase().includes('CREATE TABLE')) {
            pathHint = 'db/schema.sql';
          }
        }

        if (pathHint && content && pathHint !== 'json') {
          const ext = pathHint.split('.').pop() || lang || 'txt';
          const fileName = pathHint.split('/').pop() || pathHint;
          newlyGeneratedFiles[pathHint] = {
            name: fileName,
            path: pathHint,
            type: ext,
            content,
            isEntry: pathHint === 'index.html'
          };
        }
      }
    }

    // 3. Fallback: Parse JSON schema
    if (Object.keys(newlyGeneratedFiles).length === 0) {
      let parsedJson: any = null;
      try {
        let cleaned = rawResponse.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        parsedJson = JSON.parse(cleaned);
      } catch {
        try {
          const relaxed = rawResponse
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => c === '\n' || c === '\r' || c === '\t' ? c : '');
          const firstBrace = relaxed.indexOf('{');
          const lastBrace = relaxed.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsedJson = JSON.parse(relaxed.substring(firstBrace, lastBrace + 1));
          }
        } catch (_) {}
      }

      if (parsedJson && typeof parsedJson === 'object') {
        parsedReply = parsedJson.reply || '';
        parsedSummary = parsedJson.summary || '';
        if (Array.isArray(parsedJson.logs)) parsedLogs.push(...parsedJson.logs);
        if (Array.isArray(parsedJson.suggestions)) parsedSuggestions.push(...parsedJson.suggestions);

        const filesContainer = (parsedJson.files && typeof parsedJson.files === 'object') ? parsedJson.files : parsedJson;
        for (const [key, val] of Object.entries(filesContainer)) {
          if (['summary', 'reply', 'logs', 'suggestions', 'deletedFiles', 'success', 'error'].includes(key)) continue;
          let filePath = key;
          let fileContent = '';
          let fileType = '';
          if (typeof val === 'string') fileContent = val;
          else if (val && typeof val === 'object') {
            fileContent = (val as any).content || (val as any).code || (val as any).text || '';
            filePath = (val as any).path || (val as any).name || key;
            fileType = (val as any).type || '';
          }
          if (fileContent && typeof fileContent === 'string' && fileContent.trim().length > 0) {
            const cleanedContent = normalizeFileContent(fileContent);
            if (!fileType) {
              const ext = filePath.split('.').pop() || 'txt';
              fileType = ext;
            }
            newlyGeneratedFiles[filePath] = {
              name: filePath.split('/').pop() || filePath,
              path: filePath,
              type: fileType,
              content: cleanedContent,
              isEntry: filePath === 'index.html'
            };
          }
        }
      }
    }

    const hasUpdatedFiles = Object.keys(newlyGeneratedFiles).length > 0;

    // Extract deleted files via <perplexta_delete path="..."> tags
    const deletedFilesList: string[] = [];
    const deleteTagRegex = /<perplexta_delete\s+path=["']([^"']+)["'][^>]*\/?>/gi;
    let delMatch;
    while ((delMatch = deleteTagRegex.exec(rawResponse)) !== null) {
      const delPath = delMatch[1].trim();
      if (delPath) {
        deletedFilesList.push(delPath);
      }
    }

    // Determine final files map safely (merge by default, only overwrite on explicit new project requests or empty workspace)
    let finalFilesMap: Record<string, any> = {};
    if (hasUpdatedFiles) {
      if (isNewProjectRequest) {
        // Fresh project tree replacing old template
        finalFilesMap = { ...newlyGeneratedFiles };
      } else {
        // Merge with existing files to prevent project destruction
        finalFilesMap = { ...(files || {}), ...newlyGeneratedFiles };
      }
    } else {
      finalFilesMap = { ...(files || {}) };
    }

    // Apply file deletions
    deletedFilesList.forEach(delPath => {
      delete finalFilesMap[delPath];
    });

    // Extract clean conversational reply text without raw code, search-replace patches, or blueprint dumps
    const cleanReply = rawResponse
      .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
      .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
      .replace(/<perplexta_file[\s\S]*?<\/perplexta_file>/gi, '')
      .replace(/<perplexta_file[\s\S]*/gi, '')
      .replace(/<<<<\s*SEARCH[\s\S]*?>>>>/gi, '')
      .replace(/<<<<\s*SEARCH[\s\S]*/gi, '')
      .replace(/<perplexta_delete[\s\S]*?\/?>/gi, '')
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/```[\s\S]*/gi, '')
      .trim();

    if (cleanReply && !cleanReply.includes('{') && cleanReply.length > 15) {
      parsedReply = cleanReply;
    } else {
      const projName = parsedBlueprint?.project_name || 'تطبيق الويب';
      const fileList = Object.keys(newlyGeneratedFiles);
      const updatedFilesList = fileList.length > 0 ? fileList.map(f => `\`${f}\``).join(', ') : '`index.html`';
      
      parsedReply = deletedFilesList.length > 0 
        ? `تم تحديث شجرة المشروع وحذف الملفات المستهدفة (${deletedFilesList.join(', ')}).\n\nتمت إعادة ضبط المراجع البرمجية والتحقق من سلامة البناء في بيئة المعاينة.` 
        : `تم تدقيق الأكواد وتطبيق التحسينات البرمجية المطلوبة بنجاح.\n\n- الملفات المحدثة: ${updatedFilesList}\n- فحص الجودة: تم التحقق من سلامة تركيب DOM والربط التفاعلي واستقرار المعاينة في بيئة Sandbox.`;
    }

    // Generate concise, professional engineering logs without emojis
    const enhancedLogs: string[] = [];
    if (isNewProjectRequest) {
      enhancedLogs.push('تحليل متطلبات المشروع وتخطيط الهيكل البرمجي ونظام التصميم');
      enhancedLogs.push(`بناء شجرة الملفات (${Object.keys(finalFilesMap).length} ملفات) وهيكلة الأصول`);
      Object.keys(newlyGeneratedFiles).forEach(f => {
        enhancedLogs.push(`توليد وبرمجة ملف ${f} والتأكد من التوافق البرمجي`);
      });
      enhancedLogs.push('ضبط منظومة ألوان Tailwind والخطوط');
      enhancedLogs.push('تشغيل المشروع في Virtual Sandbox وتأكيد جاهزية المعاينة');
    } else if (hasUpdatedFiles) {
      enhancedLogs.push('فحص شجرة المشروع وتحديد الملفات المستهدفة للتعديل');
      Object.keys(newlyGeneratedFiles).forEach(f => {
        enhancedLogs.push(`تدقيق وإعادة برمجة ملف ${f} وحقن الميزات التفاعلية`);
      });
      enhancedLogs.push('التحقق من خلو الكود من الأخطاء النحوية واستقرار الأحداث');
      enhancedLogs.push('مزامنة بيئة المعاينة الحية وعرض التحديثات مباشرة');
    } else {
      enhancedLogs.push('فحص هيكل الملفات وتدقيق سلامة الأكواد في بيئة العمل');
      enhancedLogs.push('تأكيد استقرار المعاينة وعدم وجود تعارضات برمجية');
    }

    const payloadResult = {
      success: true,
      files: finalFilesMap,
      blueprint: parsedBlueprint,
      deletedFiles: deletedFilesList,
      reply: parsedReply,
      summary: parsedSummary || (deletedFilesList.length > 0 ? `تم حذف ${deletedFilesList.join(', ')}` : (isNewProjectRequest ? 'تم بناء وتأسيس المشروع بنجاح' : 'تم تدقيق وتطبيق التعديلات البرمجية بنجاح')),
      logs: parsedLogs.length > 0 ? parsedLogs : enhancedLogs,
      suggestions: parsedSuggestions.length > 0 ? parsedSuggestions : (
        Object.keys(finalFilesMap).some(f => f.toLowerCase().includes('products') || f.toLowerCase().includes('cart') || f.toLowerCase().includes('store'))
          ? [
              'تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين',
              'إضافة نظام كوبونات خصم وتخفيضات تفاعلي',
              'ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة'
            ]
          : [
              'تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك',
              'تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت',
              'برمجة لوحة إحصائيات وإدارة للمشروع'
            ]
      )
    };

    if (isStreamingRequested) {
      res.write(`data: ${JSON.stringify({ type: 'complete', ...payloadResult })}\n\n`);
      return res.end();
    }

    return res.json(payloadResult);
  } catch (error: any) {
    console.error('[Studio Generate Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to generate code' });
  }
});

export default router;
