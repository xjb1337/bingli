import { describe, expect, it } from 'vitest';
import {
  shouldRegisterServiceWorker,
  type ServiceWorkerEnvironment,
} from '../pwa/register';

const securePages: ServiceWorkerEnvironment = {
  hasServiceWorker: true,
  isProduction: true,
  protocol: 'https:',
  hostname: 'xjb1337.github.io',
  hasAndroidBridge: false,
};

describe('service worker registration guard', () => {
  it('registers on the production HTTPS site', () => {
    expect(shouldRegisterServiceWorker(securePages)).toBe(true);
  });

  it('does not register inside Android WebView or at file URLs', () => {
    expect(shouldRegisterServiceWorker({
      ...securePages,
      hostname: 'appassets.androidplatform.net',
    })).toBe(false);
    expect(shouldRegisterServiceWorker({
      ...securePages,
      protocol: 'file:',
      hostname: '',
    })).toBe(false);
    expect(shouldRegisterServiceWorker({
      ...securePages,
      hasAndroidBridge: true,
    })).toBe(false);
  });

  it('does not register during development or on insecure remote origins', () => {
    expect(shouldRegisterServiceWorker({
      ...securePages,
      isProduction: false,
    })).toBe(false);
    expect(shouldRegisterServiceWorker({
      ...securePages,
      protocol: 'http:',
      hostname: 'example.com',
    })).toBe(false);
    expect(shouldRegisterServiceWorker({
      ...securePages,
      hasServiceWorker: false,
    })).toBe(false);
  });

  it('allows production HTTP only on localhost', () => {
    expect(shouldRegisterServiceWorker({
      ...securePages,
      protocol: 'http:',
      hostname: 'localhost',
    })).toBe(true);
    expect(shouldRegisterServiceWorker({
      ...securePages,
      protocol: 'http:',
      hostname: '127.0.0.1',
    })).toBe(true);
  });
});
