import React, { useState, useMemo } from 'react';
import { useArtifact } from '../../../context/ArtifactContext';
import { useAppContext } from '../../../context/AppContext';
import { ProjectFile, getFileTypeFromPath } from '../../../types/artifact';
import { toast } from '@/design-system';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Plus,
  Trash2,
  Edit2,
  Star,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  PanelLeftClose
} from 'lucide-react';

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
  file?: ProjectFile;
}

export function CanvasFileTree() {
  const {
    files,
    activeFilePath,
    entryFilePath,
    setActiveFile,
    createFile,
    renameFile,
    deleteFile,
    setEntryFile,
    setShowFileTree,
    setActiveTab
  } = useArtifact();
  const { language, dir } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '': true,
    'src': true,
    'components': true,
    'css': true,
    'js': true
  });
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [editingFilePath, setEditingFilePath] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  // Build hierarchical folder tree from flat file map
  const treeRoot = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      path: '',
      isFolder: true,
      children: {}
    };

    for (const [filePath, file] of Object.entries(files)) {
      const parts = filePath.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const currentSubPath = parts.slice(0, i + 1).join('/');

        if (isLast) {
          current.children[part] = {
            name: part,
            path: filePath,
            isFolder: false,
            children: {},
            file
          };
        } else {
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: currentSubPath,
              isFolder: true,
              children: {}
            };
          }
          current = current.children[part];
        }
      }
    }

    return root;
  }, [files]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFilePath.trim().replace(/^\/+/, '');
    if (!trimmed) return;

    if (files[trimmed]) {
      toast.error(isAr ? 'الملف موجود بالفعل بهذا الاسم' : 'File already exists with this path');
      return;
    }

    let starter = '';
    const type = getFileTypeFromPath(trimmed);
    if (type === 'html') {
      starter = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${trimmed}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>${trimmed}</h1>\n</body>\n</html>`;
    } else if (type === 'css') {
      starter = `/* ${trimmed} */\nbody {\n  margin: 0;\n  padding: 1rem;\n}`;
    } else if (type === 'javascript') {
      starter = `// ${trimmed}\nconsole.log('${trimmed} loaded');\n`;
    } else if (type === 'typescript') {
      starter = `// ${trimmed}\nexport function init() {\n  console.log('${trimmed} ready');\n}\n`;
    } else if (type === 'json') {
      starter = `{\n  "name": "${trimmed}",\n  "items": []\n}`;
    } else if (type === 'svg') {
      starter = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <circle cx="50" cy="50" r="40" fill="#0284c7" />\n</svg>`;
    } else if (type === 'markdown') {
      starter = `# ${trimmed}\n\nContent here.\n`;
    }

    createFile(trimmed, starter);
    setNewFilePath('');
    setIsCreatingFile(false);
    toast.success(isAr ? `تم إنشاء الملف: ${trimmed}` : `Created file: ${trimmed}`);
  };

  const handleStartRename = (filePath: string) => {
    setEditingFilePath(filePath);
    setEditNameValue(filePath);
  };

  const handleRenameSubmit = (oldPath: string) => {
    const trimmed = editNameValue.trim().replace(/^\/+/, '');
    if (trimmed && trimmed !== oldPath) {
      renameFile(oldPath, trimmed);
      toast.info(isAr ? `تمت إعادة التسمية إلى: ${trimmed}` : `Renamed to: ${trimmed}`);
    }
    setEditingFilePath(null);
  };

  const handleDelete = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (Object.keys(files).length <= 1) {
      toast.warning(isAr ? 'لا يمكن حذف آخر ملف في المشروع' : 'Cannot delete the only file in project');
      return;
    }
    deleteFile(filePath);
    toast.info(isAr ? `تم حذف: ${filePath}` : `Deleted file: ${filePath}`);
  };

  const handleSetEntry = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEntryFile(filePath);
    toast.success(isAr ? `تم تحديد ${filePath} كنقطة بدء المعاينة` : `Set ${filePath} as preview entry`);
  };

  const getFileIcon = (type: string, path: string) => {
    if (path.endsWith('.json')) return <FileJson size={13} className="text-amber-400 shrink-0" />;
    if (path.endsWith('.css')) return <FileText size={13} className="text-sky-400 shrink-0" />;
    if (path.endsWith('.html') || path.endsWith('.htm')) return <FileCode size={13} className="text-orange-400 shrink-0" />;
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')) {
      return <FileCode size={13} className="text-yellow-400 shrink-0" />;
    }
    if (path.endsWith('.svg')) return <FileCode size={13} className="text-[var(--fg-success)] shrink-0" />;
    if (path.endsWith('.md') || path.endsWith('.markdown')) return <FileText size={13} className="text-indigo-400 shrink-0" />;
    return <FileText size={13} className="text-[var(--text-muted)] shrink-0" />;
  };

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const childrenKeys = Object.keys(node.children).sort((a, b) => {
      const aNode = node.children[a];
      const bNode = node.children[b];
      if (aNode.isFolder && !bNode.isFolder) return -1;
      if (!aNode.isFolder && bNode.isFolder) return 1;
      return a.localeCompare(b);
    });

    return (
      <div className="flex flex-col select-none">
        {childrenKeys.map(key => {
          const item = node.children[key];

          if (item.isFolder) {
            const isExpanded = expandedFolders[item.path] ?? true;
            return (
              <div key={item.path} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleFolder(item.path)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-shape-xs transition-colors group cursor-pointer text-start"
                  style={{ paddingInlineStart: `${depth * 14 + 8}px` }}
                >
                  <span className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </span>
                  {isExpanded ? (
                    <FolderOpen size={14} className="text-amber-500/90 shrink-0" />
                  ) : (
                    <Folder size={14} className="text-amber-500/90 shrink-0" />
                  )}
                  <span className="truncate">{item.name}</span>
                </button>

                {isExpanded && (
                  <div className="flex flex-col">
                    {renderTree(item, depth + 1)}
                  </div>
                )}
              </div>
            );
          }

          const isActive = activeFilePath === item.path;
          const isEntry = entryFilePath === item.path;
          const isEditing = editingFilePath === item.path;

          return (
            <div
              key={item.path}
              className={`group flex items-center justify-between px-2 py-1.5 text-xs rounded-shape-xs transition-colors cursor-pointer relative ${
                isActive
                  ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
              }`}
              style={{ paddingInlineStart: `${depth * 14 + 14}px` }}
              onClick={() => {
                setActiveFile(item.path);
                if (isActive) setActiveTab('code');
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {getFileIcon(item.file?.type || '', item.path)}

                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameSubmit(item.path);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 flex-1 min-w-0"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(item.path)}
                      className="w-full bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-accent)] rounded-shape-xs px-1.5 py-0.5 text-xs focus:outline-none"
                    />
                    <button type="submit" className="text-[var(--fg-success)] hover:text-[var(--fg-success)]">
                      <Check size={12} />
                    </button>
                  </form>
                ) : (
                  <span className="truncate flex-1 font-mono text-[11px] leading-tight">
                    {item.name}
                  </span>
                )}

                {isEntry && (
                  <span
                    className="px-1 py-0.2 rounded-shape-xs bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] text-[9px] font-bold shrink-0 flex items-center gap-0.5"
                    title={isAr ? 'ملف المعاينة الرئيسي' : 'Main Entry Point'}
                  >
                    <Star size={9} className="fill-current" />
                    <span>{isAr ? 'بدء' : 'entry'}</span>
                  </span>
                )}
              </div>

              {!isEditing && (
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ms-1 bg-[var(--surface-card)]/90 px-1 py-0.5 rounded-shape-xs shadow-2xs border border-[var(--border-default)]">
                  {!isEntry && (
                    <button
                      type="button"
                      onClick={(e) => handleSetEntry(item.path, e)}
                      className="p-1 text-[var(--text-muted)] hover:text-amber-500 rounded-shape-xs"
                      title={isAr ? 'تعيين كنقطة انطلاق للمعاينة' : 'Set as Entry Point'}
                    >
                      <Star size={11} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(item.path);
                    }}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-shape-xs"
                    title={isAr ? 'إعادة تسمية' : 'Rename'}
                  >
                    <Edit2 size={11} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.path, e)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded-shape-xs"
                    title={isAr ? 'حذف الملف' : 'Delete File'}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const fileCount = Object.keys(files).length;

  return (
    <div className="flex flex-col w-60 h-full border-e border-[var(--border-default)] bg-[var(--surface-card)] shrink-0 select-none transition-theme">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Folder size={14} className="text-[var(--fg-accent)] shrink-0" />
          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
            {isAr ? 'ملفات المشروع' : 'Project Files'}
          </span>
          <span className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-muted)]">
            {fileCount}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreatingFile(true)}
            className="w-6 h-6 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] transition-colors flex items-center justify-center cursor-pointer relative before:absolute before:-inset-2.5 before:content-['']"
            title={isAr ? 'ملف جديد' : 'New File'}
          >
            <Plus size={14} />
          </button>

          <button
            type="button"
            onClick={() => setShowFileTree(false)}
            className="w-6 h-6 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] transition-colors flex items-center justify-center cursor-pointer relative before:absolute before:-inset-2.5 before:content-['']"
            title={isAr ? 'إخفاء الشجرة' : 'Collapse Tree'}
          >
            <PanelLeftClose size={13} className={isAr ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      {/* Inline New File Form */}
      {isCreatingFile && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]/70">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-[var(--text-muted)]">
              {isAr ? 'مسار الملف الجديد (مثال: js/utils.js)' : 'New file path (e.g. js/utils.js)'}
            </span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder={isAr ? 'اسم_الملف.js' : 'filename.js'}
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                className="flex-1 min-w-0 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-xs px-2 py-1 text-xs font-mono focus:border-[var(--border-accent)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newFilePath.trim()}
                className="px-2 py-1 rounded-shape-xs bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-xs font-bold disabled:opacity-50"
                title={isAr ? 'تأكيد' : 'Confirm'}
              >
                <Check size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFile(false);
                  setNewFilePath('');
                }}
                className="px-1.5 py-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] text-xs"
                title={isAr ? 'إلغاء' : 'Cancel'}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
        {renderTree(treeRoot)}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span className="truncate">
          {isAr ? 'النشط: ' : 'Active: '}
          <strong className="text-[var(--text-primary)] font-mono">{activeFilePath}</strong>
        </span>
        <button
          type="button"
          onClick={() => setIsCreatingFile(true)}
          className="text-[var(--fg-accent)] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus size={10} />
          <span>{isAr ? 'ملف جديد' : 'Add File'}</span>
        </button>
      </div>
    </div>
  );
}
