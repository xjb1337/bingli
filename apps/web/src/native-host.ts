import { ANDROID_AI_RECEIVE } from '@dabingli/ai';

export interface BingliAndroidNativeBridge {
  aiStatus?: () => string;
  aiSettings?: () => void;
  aiRequest?: (id: string, payload: string) => void;
  aiCancel?: (id: string) => void;
  versionName?: () => string;
  stagedLegacy?: () => string;
  exportLegacyRaw?: () => void;
  retryLegacy?: () => void;
  legacyImportSucceeded?: () => void;
  legacyImportFailed?: (reason: string) => void;
  legacyLaunchSucceeded?: () => void;
  checkUpdates?: () => void;
  copy?: (text: string) => void;
  export?: (text: string, filename: string, mime: string) => void;
  share?: (text: string, filename: string, mime: string) => void;
  printDocument?: (html: string, title: string) => void;
}

export interface BingliWebHost {
  handleBack: () => boolean;
  flushPendingSave: () => void;
  receiveAi: (id: string, response: unknown) => void;
}

type HostWindow = Window & {
  BingliAndroid?: BingliAndroidNativeBridge;
  BingliWebHost?: BingliWebHost;
  [ANDROID_AI_RECEIVE]?: (id: string, response: unknown) => void;
};

export function getNativeAndroidBridge(): BingliAndroidNativeBridge | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as HostWindow).BingliAndroid;
  if (!candidate || typeof candidate !== 'object') return null;
  return candidate;
}

export function applyNativeInsetsClass(): void {
  if (typeof document === 'undefined') return;
  if (getNativeAndroidBridge()) {
    document.documentElement.classList.add('native-insets');
  } else {
    document.documentElement.classList.remove('native-insets');
  }
}

export function registerBingliWebHost(handlers: {
  handleBack: () => boolean;
  flushPendingSave: () => void;
}): () => void {
  if (typeof window === 'undefined') return () => {};
  const hostWindow = window as HostWindow;
  const host: BingliWebHost = {
    handleBack: handlers.handleBack,
    flushPendingSave: handlers.flushPendingSave,
    receiveAi: (id: string, response: unknown) => {
      const receiver = hostWindow[ANDROID_AI_RECEIVE];
      if (typeof receiver === 'function') {
        receiver(id, response);
      }
    },
  };
  hostWindow.BingliWebHost = host;
  return () => {
    if (hostWindow.BingliWebHost === host) {
      delete hostWindow.BingliWebHost;
    }
  };
}

export async function nativeCopyText(text: string): Promise<boolean> {
  const bridge = getNativeAndroidBridge();
  if (typeof bridge?.copy === 'function') {
    bridge.copy(text);
    return true;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    return true;
  } catch {
    return false;
  }
}

export function nativeExportFile(text: string, filename: string, mime: 'text/plain' | 'application/json'): void {
  const bridge = getNativeAndroidBridge();
  if (typeof bridge?.export === 'function') {
    bridge.export(text, filename, mime);
    return;
  }
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function nativeShareText(
  text: string,
  filename: string,
  title: string,
): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const bridge = getNativeAndroidBridge();
  if (typeof bridge?.share === 'function') {
    bridge.share(text, filename, 'text/plain');
    return 'shared';
  }
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    }
  }
  return (await nativeCopyText(text)) ? 'copied' : 'failed';
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildPrintableHtml(title: string, text: string): string {
  return [
    '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    '<style>@page{size:A4;margin:16mm}body{margin:0;color:#111;background:#fff;font-family:"Noto Serif CJK SC","Songti SC",serif;font-size:12pt;line-height:1.75}h1{margin:0 0 12pt;text-align:center;font-size:16pt}pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}</style>',
    '</head><body>',
    `<h1>${escapeHtml(title)}</h1>`,
    `<pre>${escapeHtml(text)}</pre>`,
    '</body></html>',
  ].join('');
}

export function nativePrintDocument(title: string, text: string): boolean {
  const bridge = getNativeAndroidBridge();
  if (typeof bridge?.printDocument === 'function') {
    bridge.printDocument(buildPrintableHtml(title, text), title);
    return true;
  }
  if (typeof window.print !== 'function') return false;

  const node = document.createElement('article');
  node.className = 'print-document';
  const heading = document.createElement('h1');
  heading.textContent = title;
  const body = document.createElement('pre');
  body.textContent = text;
  node.append(heading, body);
  document.body.appendChild(node);
  document.body.classList.add('printing-document');
  const cleanup = () => {
    document.body.classList.remove('printing-document');
    node.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  try {
    window.print();
  } catch {
    cleanup();
    return false;
  }
  window.setTimeout(cleanup, 3000);
  return true;
}

export function readNativeStagedLegacy(): string {
  const bridge = getNativeAndroidBridge();
  if (typeof bridge?.stagedLegacy !== 'function') return '';
  try {
    return bridge.stagedLegacy() || '';
  } catch {
    return '';
  }
}

export function notifyNativeLegacyImported(): void {
  try {
    getNativeAndroidBridge()?.legacyImportSucceeded?.();
  } catch {
    // Ignore native callback failures during teardown.
  }
}

export function notifyNativeLegacyImportFailed(reason: string): void {
  try {
    getNativeAndroidBridge()?.legacyImportFailed?.(reason);
  } catch {
    // Keep the import error visible if the native bridge is unavailable.
  }
}

export function notifyNativeLegacyLaunched(): void {
  try {
    getNativeAndroidBridge()?.legacyLaunchSucceeded?.();
  } catch {
    // Ignore native callback failures during teardown.
  }
}
