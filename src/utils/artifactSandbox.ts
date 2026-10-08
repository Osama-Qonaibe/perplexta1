import { Artifact, ProjectFiles, ProjectFile, getFileTypeFromPath } from '../types/artifact';

export const consoleOverrideScript = `
  <script>
    (function() {
      const _log = console.log;
      const _error = console.error;
      const _warn = console.warn;
      const _info = console.info;

      function sendToParent(type, args) {
        try {
          const text = args.map(arg => {
            if (arg instanceof Error) {
              return arg.stack || arg.message;
            }
            if (typeof arg === 'object' && arg !== null) {
              try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
            }
            return String(arg);
          }).join(' ');

          window.parent.postMessage({
            type: 'SANDBOX_CONSOLE',
            payload: {
              type: type,
              text: text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
            }
          }, '*');
        } catch(e) {}
      }

      console.log = function(...args) { _log.apply(console, args); sendToParent('log', args); };
      console.error = function(...args) { _error.apply(console, args); sendToParent('error', args); };
      console.warn = function(...args) { _warn.apply(console, args); sendToParent('warn', args); };
      console.info = function(...args) { _info.apply(console, args); sendToParent('info', args); };

      window.addEventListener('error', function(e) {
        sendToParent('error', [e.message + (e.filename ? ' at ' + e.filename + ':' + e.lineno : '')]);
      });

      window.addEventListener('unhandledrejection', function(e) {
        sendToParent('error', ['Unhandled Promise Rejection: ' + (e.reason?.message || e.reason)]);
      });
    })();
  </script>
`;

/**
 * Ensures artifact has files populated. If not, constructs project files based on type.
 */
export function ensureArtifactFiles(artifact: Artifact): {
  files: ProjectFiles;
  entryPath: string;
  activePath: string;
} {
  if (artifact.files && Object.keys(artifact.files).length > 0) {
    const entryPath = artifact.entryFilePath || (artifact.files['index.html'] ? 'index.html' : Object.keys(artifact.files)[0]);
    const activePath = artifact.activeFilePath || entryPath;
    return {
      files: artifact.files,
      entryPath,
      activePath
    };
  }

  const files: ProjectFiles = {};
  const lang = (artifact.language || artifact.type || '').toLowerCase();

  if (artifact.type === 'react' || lang === 'react' || lang === 'tsx' || lang === 'jsx') {
    files['App.tsx'] = {
      name: 'App.tsx',
      path: 'App.tsx',
      content: artifact.content,
      type: 'typescript',
      isEntry: true
    };
    files['style.css'] = {
      name: 'style.css',
      path: 'style.css',
      content: `/* Custom App Styles */\nbody {\n  margin: 0;\n  padding: 0;\n  background: transparent;\n}\n`,
      type: 'css'
    };
    return { files, entryPath: 'App.tsx', activePath: 'App.tsx' };
  }

  if (artifact.type === 'svg' || lang === 'svg') {
    files['graphic.svg'] = {
      name: 'graphic.svg',
      path: 'graphic.svg',
      content: artifact.content,
      type: 'svg',
      isEntry: true
    };
    return { files, entryPath: 'graphic.svg', activePath: 'graphic.svg' };
  }

  if (artifact.type === 'markdown' || lang === 'markdown' || lang === 'md') {
    files['document.md'] = {
      name: 'document.md',
      path: 'document.md',
      content: artifact.content,
      type: 'markdown',
      isEntry: true
    };
    return { files, entryPath: 'document.md', activePath: 'document.md' };
  }

  // Standard Web Project (HTML, CSS, JS)
  files['index.html'] = {
    name: 'index.html',
    path: 'index.html',
    content: artifact.content,
    type: 'html',
    isEntry: true
  };
  files['style.css'] = {
    name: 'style.css',
    path: 'style.css',
    content: `/* Project Stylesheet */\nbody {\n  margin: 0;\n  font-family: system-ui, -apple-system, sans-serif;\n}\n`,
    type: 'css'
  };
  files['main.js'] = {
    name: 'main.js',
    path: 'main.js',
    content: `// Main application logic\nconsole.log('Perplexta Canvas Live Runtime loaded');\n`,
    type: 'javascript'
  };

  return { files, entryPath: 'index.html', activePath: 'index.html' };
}

export interface BuildArtifactOptions {
  language?: string;
  isDark?: boolean;
  frameBg?: 'auto' | 'light' | 'dark';
}

/**
 * Pre-processes HTML by resolving relative multi-file dependencies (CSS/JS/Images/Media/JSON)
 * directly into in-memory Blob Object URLs to prevent 404s inside the sandbox iframe.
 */
function resolveVirtualFilesWithBlobs(rawHtml: string, files: ProjectFiles): string {
  if (!rawHtml || typeof window === 'undefined') return rawHtml;

  let html = rawHtml;
  const projectFileKeys = Object.keys(files);

  // 1. Process CSS files
  projectFileKeys
    .filter(f => f.endsWith('.css'))
    .forEach(cssPath => {
      try {
        const file = files[cssPath];
        if (!file) return;
        const cssBlob = new Blob([file.content], { type: 'text/css;charset=utf-8' });
        const cssUrl = URL.createObjectURL(cssBlob);
        
        // Exact and relative matches: "style.css", "./style.css", "/style.css"
        const cleanName = cssPath.replace(/^\.\//, '').replace(/^\//, '');
        html = html.split(`"${cssPath}"`).join(`"${cssUrl}"`);
        html = html.split(`'${cssPath}'`).join(`'${cssUrl}'`);
        html = html.split(`"./${cleanName}"`).join(`"${cssUrl}"`);
        html = html.split(`'./${cleanName}'`).join(`'${cssUrl}'`);
        html = html.split(`"/${cleanName}"`).join(`"${cssUrl}"`);
        html = html.split(`'/${cleanName}'`).join(`'${cssUrl}'`);
      } catch (e) {
        console.warn('Failed to create Blob URL for CSS:', cssPath, e);
      }
    });

  // 2. Process JS / TS files
  projectFileKeys
    .filter(f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.ts'))
    .forEach(jsPath => {
      try {
        const file = files[jsPath];
        if (!file) return;
        const jsBlob = new Blob([file.content], { type: 'application/javascript;charset=utf-8' });
        const jsUrl = URL.createObjectURL(jsBlob);

        const cleanName = jsPath.replace(/^\.\//, '').replace(/^\//, '');
        html = html.split(`"${jsPath}"`).join(`"${jsUrl}"`);
        html = html.split(`'${jsPath}'`).join(`'${jsUrl}'`);
        html = html.split(`"./${cleanName}"`).join(`"${jsUrl}"`);
        html = html.split(`'./${cleanName}'`).join(`'${jsUrl}'`);
        html = html.split(`"/${cleanName}"`).join(`"${jsUrl}"`);
        html = html.split(`'/${cleanName}'`).join(`'${jsUrl}'`);
      } catch (e) {
        console.warn('Failed to create Blob URL for JS:', jsPath, e);
      }
    });

  // 3. Process SVG / Images / JSON files
  projectFileKeys
    .filter(f => f.endsWith('.svg') || f.endsWith('.json') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
    .forEach(assetPath => {
      try {
        const file = files[assetPath];
        if (!file) return;
        const mimeType = assetPath.endsWith('.svg')
          ? 'image/svg+xml'
          : assetPath.endsWith('.json')
          ? 'application/json'
          : 'text/plain';
        const blob = new Blob([file.content], { type: mimeType });
        const assetUrl = URL.createObjectURL(blob);

        const cleanName = assetPath.replace(/^\.\//, '').replace(/^\//, '');
        html = html.split(`"${assetPath}"`).join(`"${assetUrl}"`);
        html = html.split(`'${assetPath}'`).join(`'${assetUrl}'`);
        html = html.split(`"./${cleanName}"`).join(`"${assetUrl}"`);
        html = html.split(`'./${cleanName}'`).join(`'${assetUrl}'`);
        html = html.split(`"/${cleanName}"`).join(`"${assetUrl}"`);
        html = html.split(`'/${cleanName}'`).join(`'${assetUrl}'`);
      } catch (e) {
        console.warn('Failed to create Blob URL for asset:', assetPath, e);
      }
    });

  return html;
}

/**
 * Builds the complete srcDoc for sandboxed iframe execution with real multi-file injection.
 */
export function buildArtifactSrcDoc(artifact: Artifact, options: BuildArtifactOptions = {}): string {
  const language = options.language || 'ar';
  const frameBg = options.frameBg || 'auto';
  const isDark = options.isDark ?? true;

  const actualTheme = frameBg === 'auto' ? (isDark ? 'dark' : 'light') : frameBg;
  const isDarkBg = actualTheme === 'dark';

  const baseStyle = `
    <style>
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html {
        font-family: 'Tajawal', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background-color: ${isDarkBg ? '#0b101b' : '#ffffff'};
        color: ${isDarkBg ? '#f8fafc' : '#0f172a'};
        overflow-x: hidden;
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.3);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.5);
      }
    </style>
  `;

  // Real production helper libraries for Live Preview (Tailwind, Lucide, Chart.js, D3, Confetti, Marked, FontAwesome)
  const libraries = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Tajawal', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
              mono: ['JetBrains Mono', 'monospace'],
            }
          }
        }
      }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  `;

  const iconInitScript = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      });
    </script>
  `;

  const projectInfo = ensureArtifactFiles(artifact);
  const { files, entryPath } = projectInfo;
  const entryFile = files[entryPath] || files['index.html'] || Object.values(files)[0];
  const contentToRender = entryFile ? entryFile.content : artifact.content;

  const hasFullHTML = contentToRender.includes('<!DOCTYPE') || 
                      contentToRender.includes('<html') || 
                      contentToRender.includes('<body') || 
                      contentToRender.includes('<head');

  const isReact = !hasFullHTML && (
    artifact.type === 'react' || 
    (entryFile && entryFile.type === 'typescript' && entryFile.name.endsWith('.tsx')) ||
    contentToRender.includes('import ') || 
    contentToRender.includes('export default') ||
    contentToRender.includes('React.')
  );

  // Case 1: Full HTML Document with Virtual File Bundler (Blob URL injection)
  if (hasFullHTML) {
    let doc = resolveVirtualFilesWithBlobs(contentToRender, files);

    // Fallback inline resolution for tags whose href/src did not match exact quotes
    doc = doc.replace(/<link\s+[^>]*?href=["']([^"']+)["'][^>]*?>/gi, (fullMatch, href) => {
      if (href.startsWith('blob:') || href.startsWith('http://') || href.startsWith('https://')) {
        return fullMatch;
      }
      const cleanHref = href.replace(/^[./]+/, '');
      const matchedCss = files[cleanHref] || files[href];
      if (matchedCss && matchedCss.type === 'css') {
        return `<style data-file-href="${href}">\n${matchedCss.content}\n</style>`;
      }
      return fullMatch;
    });

    doc = doc.replace(/<script\s+[^>]*?src=["']([^"']+)["'][^>]*?>\s*<\/script>/gi, (fullMatch, src) => {
      if (src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://')) {
        return fullMatch;
      }
      const cleanSrc = src.replace(/^[./]+/, '');
      const matchedJs = files[cleanSrc] || files[src];
      if (matchedJs && (matchedJs.type === 'javascript' || matchedJs.type === 'typescript')) {
        return `<script data-file-src="${src}">\n${matchedJs.content}\n</script>`;
      }
      return fullMatch;
    });

    const injectedHead = `${consoleOverrideScript}${libraries}${baseStyle}${iconInitScript}`;

    if (doc.includes('<head>')) {
      doc = doc.replace('<head>', `<head>${injectedHead}`);
    } else if (doc.includes('<html>')) {
      doc = doc.replace('<html>', `<html><head>${injectedHead}</head>`);
    } else {
      doc = `<head>${injectedHead}</head>${doc}`;
    }

    if (isDarkBg && !doc.includes('class="dark"')) {
      doc = doc.replace('<html', '<html class="dark"');
    }

    return doc;
  }

  // Case 2: SVG Graphic
  if (artifact.type === 'svg' || contentToRender.trim().startsWith('<svg')) {
    return `
      <!DOCTYPE html>
      <html lang="${language}" class="${isDarkBg ? 'dark' : ''}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${consoleOverrideScript}
          ${libraries}
          ${baseStyle}
        </head>
        <body class="flex items-center justify-center min-h-screen p-6">
          <div class="max-w-full max-h-full flex items-center justify-center shadow-lg rounded-2xl bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800">
            ${contentToRender}
          </div>
        </body>
      </html>
    `;
  }

  // Case 3: Markdown Document
  if (artifact.type === 'markdown' || entryFile?.type === 'markdown') {
    const rawMarkdown = JSON.stringify(contentToRender);
    return `
      <!DOCTYPE html>
      <html lang="${language}" class="${isDarkBg ? 'dark' : ''}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${consoleOverrideScript}
          ${libraries}
          ${baseStyle}
        </head>
        <body class="p-6 max-w-4xl mx-auto">
          <div id="content" class="prose dark:prose-invert max-w-none"></div>
          <script>
            document.getElementById('content').innerHTML = marked.parse(${rawMarkdown});
          </script>
        </body>
      </html>
    `;
  }

  // Case 4: React Component (Single or Multi-file)
  if (isReact) {
    const cleanedCode = contentToRender
      .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
      .replace(/export\s+default\s+function\s+/, 'function ')
      .replace(/export\s+default\s+class\s+/, 'class ')
      .replace(/export\s+default\s+/, 'const App = ')
      .replace(/export\s+{[^}]*};?/g, '');

    const styleContent = files['style.css'] ? files['style.css'].content : '';

    return `
      <!DOCTYPE html>
      <html lang="${language}" class="${isDarkBg ? 'dark' : ''}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${consoleOverrideScript}
          ${libraries}
          ${baseStyle}
          ${styleContent ? `<style>${styleContent}</style>` : ''}
          <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            const { useState, useEffect, useRef, useMemo, useCallback } = React;

            try {
              ${cleanedCode}

              const ComponentToRender = typeof App !== 'undefined' ? App : (typeof Main !== 'undefined' ? Main : null);

              if (ComponentToRender) {
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(<ComponentToRender />);
                setTimeout(() => {
                  if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                  }
                }, 50);
              } else {
                document.getElementById('root').innerHTML = '<div style="padding: 24px; color: #e11d48; font-family: monospace;">No default component (App) found to render.</div>';
              }
            } catch (err) {
              console.error(err);
              const safeErrMsg = String(err && err.message ? err.message : err).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              document.getElementById('root').innerHTML = '<div style="padding: 24px; color: #e11d48; font-family: monospace;"><h3>Rendering Error:</h3><pre>' + safeErrMsg + '</pre></div>';
            }
          </script>
        </body>
      </html>
    `;
  }

  // Case 5: Plain HTML Fragment / CSS / JS Demo
  let resolvedFragment = resolveVirtualFilesWithBlobs(contentToRender, files);
  const styleContent = files['style.css'] ? files['style.css'].content : '';
  const scriptContent = files['main.js'] ? files['main.js'].content : (files['app.js'] ? files['app.js'].content : '');

  return `
    <!DOCTYPE html>
    <html lang="${language}" class="${isDarkBg ? 'dark' : ''}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${consoleOverrideScript}
        ${libraries}
        ${baseStyle}
        ${styleContent ? `<style>${styleContent}</style>` : ''}
        ${iconInitScript}
      </head>
      <body class="p-4 sm:p-6">
        ${resolvedFragment}
        ${scriptContent ? `<script>${scriptContent}</script>` : ''}
      </body>
    </html>
  `;
}
