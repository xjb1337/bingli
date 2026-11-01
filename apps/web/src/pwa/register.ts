export interface ServiceWorkerEnvironment {
  hasServiceWorker: boolean;
  isProduction: boolean;
  protocol: string;
  hostname: string;
  hasAndroidBridge: boolean;
}

export function shouldRegisterServiceWorker(env: ServiceWorkerEnvironment): boolean {
  const localHost = env.hostname === 'localhost' || env.hostname === '127.0.0.1';
  return env.hasServiceWorker
    && env.isProduction
    && (env.protocol === 'https:' || localHost)
    && env.hostname !== 'appassets.androidplatform.net'
    && !env.hasAndroidBridge;
}

function hasAndroidBridge(): boolean {
  const candidate = window as Window & {
    AndroidBridge?: unknown;
    BingliAndroid?: unknown;
  };
  return candidate.AndroidBridge != null || candidate.BingliAndroid != null;
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  const shouldRegister = shouldRegisterServiceWorker({
    hasServiceWorker: true,
    isProduction: import.meta.env.PROD,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    hasAndroidBridge: hasAndroidBridge(),
  });
  if (!shouldRegister) return;

  const baseUrl = import.meta.env.BASE_URL;
  void navigator.serviceWorker.register(`${baseUrl}sw.js`, { scope: baseUrl }).catch((error) => {
    console.warn('离线缓存注册失败；在线功能不受影响。', error);
  });
}
