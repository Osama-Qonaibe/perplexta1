/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module 'ffprobe-static';
declare module '*.mdx?raw' {
  const content: string;
  export default content;
}
declare module '*.mdx' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAIL: string
}


interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  dataLayer?: any[];
  gtag?: (...args: any[]) => void;
}
