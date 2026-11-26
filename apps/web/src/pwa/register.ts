export interface ServiceWorkerEnvironment {
  hasServiceWorker: boolean;
  isProduction: boolean;
  protocol: string;
  hostname: string;
  hasAndroidBridge: boolean;
}

let registrationPromise: Promise<ServiceWorkerRegistration | null> | undefined;

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
  registrationPromise ??= navigator.serviceWorker.register(`${baseUrl}sw.js`, { scope: baseUrl }).catch((error) => {
    console.warn('离线缓存注册失败；在线功能不受影响。', error);
    return null;
  });
}

export function watchWaitingUpdate(onReady: () => void): () => void {
  if (!registrationPromise) return () => {};
  const subscription = new AbortController();
  const { signal } = subscription;

  void registrationPromise.then((registration) => {
    if (!registration || signal.aborted) return;
    const watchInstall = () => {
      if (registration.waiting && registration.active) {
        onReady();
        return;
      }
      const installing = registration.installing;
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed' && registration.active && registration.active !== installing) onReady();
      }, { signal });
    };
    registration.addEventListener('updatefound', watchInstall, { signal });
    watchInstall();
  });

  return () => subscription.abort();
}
