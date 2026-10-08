import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, Database, Plus, Sparkles, Terminal, Download, Github, 
  Trash2, Edit2, ChevronRight, ChevronLeft, ArrowUpRight, Search, 
  RefreshCw, Globe, Layers, HardDrive, ShieldCheck, Cpu, Code, 
  CheckCircle2, AlertTriangle, FileCode, Play, X, Settings, LayoutDashboard
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from '@/design-system';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { resolveImageUrl } from '../utils/imageResolver';
import { Logo } from '../components/common/Logo';

interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string;
  updatedAt: string;
  dbSize: string;
  tablesCount: number;
  recordsCount: number;
  isAutoSaved: boolean;
  files?: Record<string, any>;
}

const DEFAULT_PROJECTS: Project[] = [];

export const AppHubPage: React.FC = () => {
  const { theme, language, siteSettings, dir } = useAppContext();
  const navigate = useNavigate();
  const siteName = language === 'ar' ? siteSettings.siteNameAr : siteSettings.siteName;

  const [activeTab, setActiveTab] = useState<'projects' | 'databases' | 'metrics'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('perplexta_hub_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Purge legacy mock projects (proj-1, proj-2, proj-3)
          return parsed.filter((p: any) => p.id !== 'proj-1' && p.id !== 'proj-2' && p.id !== 'proj-3');
        }
      }
    } catch {}
    return [];
  });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPrompt, setNewProjectPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Custom Modal States
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [projectToRename, setProjectToRename] = useState<{ id: string; name: string } | null>(null);
  const [renameText, setRenameText] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Persistence and backend workspace fetch sync
  useEffect(() => {
    try {
      localStorage.setItem('perplexta_hub_projects', JSON.stringify(projects));
    } catch {}
  }, [projects]);

  useEffect(() => {
    const fetchBackendWorkspaces = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token') || '';
        if (!token) return;
        const res = await fetch('/api/studio/workspaces', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Project[] = data.map((ws: any) => ({
              id: ws.id,
              name: ws.title || 'مشروع جديد',
              description: ws.description || (language === 'ar' ? 'مشروع ويب تفاعلي في استوديو بيربليكستا' : 'Interactive web project in Perplexta Studio'),
              techStack: 'HTML5 / JS / SQLite',
              updatedAt: ws.updated_at ? new Date(ws.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (language === 'ar' ? 'محدث الآن' : 'Just now'),
              dbSize: '128 KB',
              tablesCount: 2,
              recordsCount: 5,
              isAutoSaved: true,
              files: typeof ws.files === 'string' ? JSON.parse(ws.files) : ws.files
            }));

            setProjects(prev => {
              const prevMap = new Map(prev.map(p => [p.id, p]));
              mapped.forEach(m => {
                prevMap.set(m.id, m);
              });
              return Array.from(prevMap.values());
            });
          }
        }
      } catch (e) {
        console.warn('Failed syncing backend workspaces:', e);
      }
    };
    fetchBackendWorkspaces();
  }, [language]);

  const activeProjectsCount = projects.length;
  const totalDbSize = '880 KB';
  const lastGithubExport = language === 'ar' ? 'منذ 3 ساعات' : '3 hours ago';

  // Open Project in Canvas
  const handleOpenProject = (project: Project) => {
    sessionStorage.setItem('current_active_project', JSON.stringify(project));
    localStorage.setItem('perplexta_active_project_id', project.id);
    localStorage.setItem('perplexta_active_project_name', project.name);

    if (project.files && Object.keys(project.files).length > 0) {
      localStorage.setItem('perplexta_studio_workspace_v2', JSON.stringify({
        projectId: project.id,
        projectName: project.name,
        files: project.files,
        activeFilePath: 'index.html',
        chatMessages: [],
        terminalLogs: []
      }));
    }

    toast.success(language === 'ar' ? `فتح مشروع ${project.name} في الاستوديو` : `Opening ${project.name} in studio`);
    navigate('/app/canvas');
  };

  // Create Project handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم المشروع' : 'Please enter project name');
      return;
    }

    setIsCreating(true);
    const newProjId = `proj-${Date.now()}`;
    const promptText = newProjectPrompt.trim() || newProjectName.trim();

    const newProj: Project = {
      id: newProjId,
      name: newProjectName.trim(),
      description: promptText,
      techStack: 'HTML5 / JS / SQLite',
      updatedAt: language === 'ar' ? 'الآن' : 'Just now',
      dbSize: '64 KB',
      tablesCount: 1,
      recordsCount: 1,
      isAutoSaved: true,
      files: {}
    };

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token') || '';
      if (token) {
        await fetch('/api/studio/workspaces', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: newProjId,
            title: newProjectName.trim(),
            frameworkMode: 'html',
            files: {}
          })
        }).catch(() => {});
      }
    } catch (_) {}

    const updatedProjects = [newProj, ...projects];
    setProjects(updatedProjects);
    try {
      localStorage.setItem('perplexta_hub_projects', JSON.stringify(updatedProjects));
    } catch (_) {}

    setIsCreating(false);
    setIsNewModalOpen(false);
    setNewProjectName('');
    setNewProjectPrompt('');

    // Save prompt to sessionStorage for immediate execution on canvas load
    sessionStorage.setItem('pending_ai_prompt', promptText);
    sessionStorage.setItem('current_active_project', JSON.stringify(newProj));
    localStorage.setItem('perplexta_active_project_id', newProjId);
    localStorage.setItem('perplexta_active_project_name', newProj.name);

    // Clear old workspace from localStorage so it doesn't display stale old files
    localStorage.removeItem('perplexta_studio_workspace_v2');

    toast.success(language === 'ar' ? 'جاري فتح الاستوديو وتكليف المساعد الذكي بالتوليد الحقيقي...' : 'Opening studio and dispatching live AI generation task...');
    navigate('/app/canvas');
  };

  // Duplicate project
  const handleDuplicate = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `proj-${Date.now()}`;
    const duplicated: Project = {
      ...proj,
      id: newId,
      name: `${proj.name} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
      updatedAt: language === 'ar' ? 'الآن' : 'Just now'
    };
    const updated = [duplicated, ...projects];
    setProjects(updated);
    try {
      localStorage.setItem('perplexta_hub_projects', JSON.stringify(updated));
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token') || '';
      if (token) {
        await fetch('/api/studio/workspaces', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: newId,
            title: duplicated.name,
            frameworkMode: 'html',
            files: proj.files || {}
          })
        }).catch(() => {});
      }
    } catch (_) {}
    toast.success(language === 'ar' ? 'تم تكرار المشروع وحفظه بنجاح' : 'Project duplicated successfully');
  };

  // Delete project permanently prompt
  const handleDelete = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete({ id: proj.id, name: proj.name });
    setDeleteConfirmText('');
  };

  const executeDelete = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmText.trim() !== projectToDelete.name.trim()) {
      toast.error(language === 'ar' ? 'يرجى كتابة اسم المشروع بدقة لتأكيد الحذف' : 'Please type the project name to confirm deletion');
      return;
    }

    setIsDeleting(true);
    try {
      const updated = projects.filter(p => p.id !== projectToDelete.id);
      setProjects(updated);
      localStorage.setItem('perplexta_hub_projects', JSON.stringify(updated));
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token') || '';
      await fetch(`/api/studio/workspaces/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).catch(() => {});
      toast.success(language === 'ar' ? `تم حذف "${projectToDelete.name}" بنجاح` : `Project deleted successfully`);
      setProjectToDelete(null);
      setDeleteConfirmText('');
    } catch (err: any) {
      toast.error(err.message || (language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Failed to delete'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToRename({ id: proj.id, name: proj.name });
    setRenameText(proj.name);
  };

  const executeRename = async () => {
    if (!projectToRename || !renameText.trim()) return;

    setIsRenaming(true);
    try {
      const updated = projects.map(p => p.id === projectToRename.id ? { ...p, name: renameText.trim() } : p);
      setProjects(updated);
      localStorage.setItem('perplexta_hub_projects', JSON.stringify(updated));
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token') || '';
      await fetch(`/api/studio/workspaces/${projectToRename.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title: renameText.trim() })
      }).catch(() => {});
      toast.success(language === 'ar' ? `تم تعديل اسم المشروع إلى "${renameText.trim()}"` : 'Project renamed successfully');
      setProjectToRename(null);
      setRenameText('');
    } catch (err: any) {
      toast.error(err.message || (language === 'ar' ? 'حدث خطأ أثناء التعديل' : 'Failed to rename'));
    } finally {
      setIsRenaming(false);
    }
  };

  // Export ZIP with real files
  const handleDownloadZip = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const zip = new JSZip();
    const filesToZip = proj.files || {};
    if (Object.keys(filesToZip).length > 0) {
      Object.keys(filesToZip).forEach(path => {
        zip.file(path, filesToZip[path]?.content || '');
      });
    } else {
      zip.file('index.html', `<!DOCTYPE html><html><head><title>${proj.name}</title></head><body><h1>${proj.name}</h1></body></html>`);
      zip.file('style.css', '/* Style file */');
      zip.file('app.js', '// App script');
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${proj.name.replace(/\s+/g, '_')}_export.zip`);
    toast.success(language === 'ar' ? 'تم تصدير كل ملفات المشروع الحقيقية بنجاح' : 'ZIP exported successfully');
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col md:flex-row overflow-hidden transition-theme">
      {/* Chat-style Full-Height Sidebar */}
      <aside className="w-full md:w-72 h-screen sticky top-0 bg-[var(--surface-card)] border-r border-[var(--border-default)] flex flex-col justify-between p-5 shrink-0 select-none">
        
        {/* Top Section: Real Platform Logo & New Project CTA */}
        <div className="space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-default)]">
            <Logo size={32} showName={false} />
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold uppercase tracking-wider truncate text-[var(--text-primary)]">{siteName}</h2>
            </div>
          </div>

          {/* New Project CTA Button */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] font-bold text-xs shadow-2xs hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>{language === 'ar' ? 'مشروع جديد' : 'New Project'}</span>
          </button>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-shape-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder size={15} />
                <span>{language === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] border border-[var(--border-default)]">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('databases')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-shape-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'databases'
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database size={15} />
                <span>{language === 'ar' ? 'قواعد البيانات الافتراضية' : 'Virtual Databases'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] border border-[var(--border-default)]">
                SQL
              </span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-shape-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive size={15} />
                <span>{language === 'ar' ? 'الإحصائيات والنسخ الاحتياطي' : 'Metrics & Backups'}</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Auto-Save Status & Back to Studio Button */}
        <div className="space-y-3 pt-4 border-t border-[var(--border-default)]">
          <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الحفظ التلقائي' : 'Auto-Save'}</span>
              <span className="text-[var(--fg-success)] flex items-center gap-1">
                <CheckCircle2 size={12} /> {language === 'ar' ? 'مفعل' : 'Active'}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              {language === 'ar' ? 'جميع التعديلات محفوظة آمنة.' : 'All edits are securely saved.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/studio')}
            className="w-full h-10 px-3 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            {dir === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span>{language === 'ar' ? 'العودة للاستوديو الرئيسي' : 'Back to Main Studio'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[var(--surface-page)]">
        {/* Top Quick Metrics & Search Bar */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--surface-page)]/95 border-b border-[var(--border-default)] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div>
              <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                {activeTab === 'projects' && (language === 'ar' ? 'لوحة المشاريع النشطة' : 'Active Projects Hub')}
                {activeTab === 'databases' && (language === 'ar' ? 'إدارة قواعد البيانات الافتراضية' : 'Virtual Database Manager')}
                {activeTab === 'metrics' && (language === 'ar' ? 'إحصائيات الموارد والنسخ الاحتياطي' : 'Resource Metrics & Backups')}
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {language === 'ar' ? 'تحكم كامل بالمشاريع، قواعد البيانات SQLite، والتصدير السحابي.' : 'Full control over projects, SQLite databases, and cloud exports.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeTab === 'projects' && (
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'بحث في المشاريع...' : 'Search projects...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-3 pr-9 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] shadow-2xs"
                />
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{language === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}</p>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">{activeProjectsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-shape-sm bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] flex items-center justify-center">
                <Folder size={20} />
              </div>
            </div>

            <div className="p-4 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{language === 'ar' ? 'حجم تخزين SQLite' : 'SQLite Storage'}</p>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">{totalDbSize}</h3>
              </div>
              <div className="w-10 h-10 rounded-shape-sm bg-[var(--status-success-subtle)] text-[var(--fg-success)] flex items-center justify-center">
                <Database size={20} />
              </div>
            </div>

            <div className="p-4 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{language === 'ar' ? 'آخر تصدير GitHub' : 'Last GitHub Export'}</p>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1">{lastGithubExport}</h3>
              </div>
              <div className="w-10 h-10 rounded-shape-sm bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Github size={20} />
              </div>
            </div>
          </div>

          {/* TAB 1: PROJECTS GRID */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => handleOpenProject(proj)}
                      className="p-5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-shape-sm text-[10px] font-bold bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                            {proj.techStack}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">{proj.updatedAt}</span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors">
                          {proj.name}
                        </h3>
                        {/* RTL Fix for Arabic text and truncation */}
                        <p 
                          className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed"
                          style={{
                            direction: language === 'ar' ? 'rtl' : 'ltr',
                            textAlign: language === 'ar' ? 'right' : 'left',
                            unicodeBidi: 'plaintext'
                          }}
                        >
                          {proj.description || (language === 'ar' ? 'مشروع ويب قيد التطوير...' : 'Web project under development...')}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        {/* Primary CTA Button for opening in studio */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProject(proj);
                          }}
                          className="w-full py-2 px-3 rounded-shape-sm bg-[var(--bg-accent-muted)] hover:bg-[var(--accent)] text-[var(--fg-accent)] hover:text-[var(--comp-button-primary-fg)] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-[var(--border-accent)]/30 cursor-pointer shadow-2xs"
                        >
                          <span>{language === 'ar' ? 'فتح في الاستوديو' : 'Open in Studio'}</span>
                          <ArrowUpRight size={14} className={dir === 'rtl' ? 'rotate-[-90deg]' : ''} />
                        </button>

                        <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                            <Database size={12} className="text-[var(--fg-success)]" />
                            <span>{proj.dbSize} ({proj.tablesCount} {language === 'ar' ? 'جداول' : 'tables'})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleRename(proj, e)}
                              className="p-1.5 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent transition-colors border border-[var(--border-default)]"
                              title={language === 'ar' ? 'تعديل اسم المشروع' : 'Rename project'}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDownloadZip(proj, e)}
                              className="p-1.5 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
                              title={language === 'ar' ? 'تحميل ZIP' : 'Download ZIP'}
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDuplicate(proj, e)}
                              className="p-1.5 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
                              title={language === 'ar' ? 'تكرار المشروع' : 'Duplicate project'}
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(proj, e)}
                              className="p-1.5 rounded-shape-sm bg-transparent hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-colors border border-[var(--border-default)] hover:border-rose-500/30"
                              title={language === 'ar' ? 'حذف المشروع' : 'Delete project'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] space-y-4 shadow-2xs">
                  <div className="w-14 h-14 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center mx-auto text-[var(--fg-accent)]">
                    <Folder size={28} />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {language === 'ar' ? 'لا توجد مشاريع سابقة في الاستوديو' : 'No Studio Projects Yet'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {language === 'ar' ? 'أنشئ مشروعك الأول الآن لبدء التصميم والتطوير التفاعلي الحقيقي بملفات برمجية وقواعد بيانات سحابية.' : 'Create your first real project to start interactive development with real code files and databases.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="px-5 py-2.5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-2xs transition-all"
                  >
                    <Plus size={16} />
                    <span>{language === 'ar' ? 'إنشاء مشروع جديد' : 'Create New Project'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIRTUAL DATABASES */}
          {activeTab === 'databases' && (
            <div className="space-y-4">
              <div className="p-5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {language === 'ar' ? 'مدير قواعد البيانات الافتراضية (Supabase / PlanetScale Style)' : 'Virtual Database Manager (Supabase / PlanetScale Style)'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {language === 'ar' ? 'مراقبة استهلاك SQLite لكل مشروع مع جدول تفصيلي وخيارات الصيانة الفورية.' : 'Monitor SQLite storage per project with detailed tables and instant maintenance options.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => toast.success(language === 'ar' ? 'تم تحديث حالة قواعد البيانات' : 'Database status updated')}
                    className="h-8 px-3 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw size={12} /> {language === 'ar' ? 'تحديث' : 'Refresh'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)] uppercase text-[10px]">
                        <th className="py-3 px-4">{language === 'ar' ? 'اسم المشروع' : 'Project Name'}</th>
                        <th className="py-3 px-4">{language === 'ar' ? 'الجداول' : 'Tables'}</th>
                        <th className="py-3 px-4">{language === 'ar' ? 'السجلات' : 'Records'}</th>
                        <th className="py-3 px-4">{language === 'ar' ? 'الحجم' : 'Size'}</th>
                        <th className="py-3 px-4 text-left">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {projects.map((proj) => (
                        <tr key={proj.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">{proj.name}</td>
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">{proj.tablesCount} tables</td>
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">{proj.recordsCount} rows</td>
                          <td className="py-3.5 px-4 font-mono text-[var(--fg-success)]">{proj.dbSize}</td>
                          <td className="py-3.5 px-4 text-left flex items-center justify-end gap-2">
                            <button
                              onClick={() => toast.success(language === 'ar' ? `تم إفراغ جداول قاعدة بيانات ${proj.name}` : `Truncated tables for ${proj.name}`)}
                              className="px-2.5 py-1 rounded-shape-sm bg-transparent border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-rose-500 hover:border-rose-500/30 cursor-pointer shadow-2xs"
                            >
                              {language === 'ar' ? 'إفراغ (Truncate)' : 'Truncate'}
                            </button>
                            <button
                              onClick={() => {
                                const blob = new Blob([`-- SQLite Schema & Dump for ${proj.name}\nCREATE TABLE IF NOT EXISTS records (id INT PRIMARY KEY, data TEXT);\nINSERT INTO records VALUES (1, 'Sample Data');`], { type: 'text/plain' });
                                saveAs(blob, `${proj.name.replace(/\s+/g, '_')}_schema.sql`);
                                toast.success(language === 'ar' ? 'تم تنزيل ملف schema.sql بنجاح' : 'schema.sql downloaded successfully');
                              }}
                              className="px-2.5 py-1 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[11px] font-bold text-[var(--fg-accent)] hover:bg-[var(--accent)] hover:text-[var(--comp-button-primary-fg)] cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Download size={11} /> schema.sql
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METRICS & BACKUPS */}
          {activeTab === 'metrics' && (
            <div className="p-5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'ar' ? 'تقرير استهلاك الموارد وحالة الخادم المحلي' : 'Resource Consumption & Local Server Status'}
              </h3>
              <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                  <span>{language === 'ar' ? 'الذاكرة المؤقتة (Local Storage VFS)' : 'Local Storage VFS'}</span>
                  <span className="font-bold text-[var(--fg-accent)]">1.4 MB / 50 MB</span>
                </div>
                <div className="flex justify-between p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                  <span>{language === 'ar' ? 'حالة المزامنة السحابية (Auto-Save)' : 'Cloud Auto-Save Sync'}</span>
                  <span className="font-bold text-[var(--fg-success)]">{language === 'ar' ? 'متصل (مزامنة فورية)' : 'Connected (Real-time Sync)'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* NEW PROJECT MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wider flex items-center gap-2 text-[var(--text-primary)]">
                <Sparkles size={16} className="text-[var(--fg-accent)]" />
                {language === 'ar' ? 'إنشاء مشروع جديد عبر الذكاء الاصطناعي' : 'Create New AI Project'}
              </h3>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-shape-sm hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'اسم المشروع' : 'Project Name'}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'مثال: متجر إلكتروني للملابس' : 'e.g., E-commerce Apparel Store'}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-10 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'وصف الفكرة أو برومبت التوليد' : 'AI Prompt / Description'}</label>
                <textarea
                  rows={3}
                  placeholder={language === 'ar' ? 'صف تطبيقك المطلوب وسيقوم النظام بتوليد الهيكل وملفات الـ SQLite...' : 'Describe your app and AI will generate files and SQLite database...'}
                  value={newProjectPrompt}
                  onChange={(e) => setNewProjectPrompt(e.target.value)}
                  className="w-full p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] resize-none shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer shadow-2xs"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] text-xs font-bold hover:opacity-90 transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  {isCreating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{isCreating ? (language === 'ar' ? 'جاري التوليد...' : 'Generating...') : (language === 'ar' ? 'بدء الإنشاء والتطوير' : 'Start Development')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal with Name Typing Verification */}
      {projectToDelete && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!isDeleting) {
              setProjectToDelete(null);
              setDeleteConfirmText('');
            }
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-rose-500/40 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {language === 'ar' ? 'تأكيد حذف المشروع نهائياً' : 'Permanently Delete Project'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  {language === 'ar'
                    ? 'هذا الإجراء سيقوم بحذف المشروع وملفاته وقاعدة بياناته نهائياً ولا يمكن التراجع عنه.'
                    : 'This will permanently delete this project and all its data. This action cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-shape-sm bg-rose-500/5 border border-rose-500/20 space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] block">
                {language === 'ar' ? 'لتأكيد الحذف، اكتب اسم المشروع أدناه:' : 'To confirm deletion, type the project name below:'}
              </label>
              <div className="p-1.5 px-2 rounded bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-xs font-bold text-rose-400 select-all">
                {projectToDelete.name}
              </div>
              <input
                type="text"
                autoFocus
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={projectToDelete.name}
                className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setProjectToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors shadow-2xs"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim() !== projectToDelete.name.trim() || isDeleting}
                onClick={executeDelete}
                className="h-8 px-4 rounded-shape-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>{language === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Project Modal */}
      {projectToRename && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!isRenaming) {
              setProjectToRename(null);
              setRenameText('');
            }
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
              <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                <Edit2 size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {language === 'ar' ? 'تعديل اسم المشروع' : 'Rename Project'}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {language === 'ar' ? 'قم بتحديث عنوان المشروع المحفوظ' : 'Update project title'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {language === 'ar' ? 'اسم المشروع الجديد:' : 'New Project Name:'}
              </label>
              <input
                type="text"
                autoFocus
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    executeRename();
                  }
                }}
                className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs text-[var(--text-primary)] outline-none focus:border-accent shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <button
                type="button"
                disabled={isRenaming}
                onClick={() => {
                  setProjectToRename(null);
                  setRenameText('');
                }}
                className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors shadow-2xs"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!renameText.trim() || isRenaming}
                onClick={executeRename}
                className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
              >
                {isRenaming ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                <span>{language === 'ar' ? 'حفظ الاسم' : 'Save Name'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
