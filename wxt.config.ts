import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  publicDir: 'src/public',
  outDir: 'build',
  zip: {
    excludeSources: ['coverage/**'],
  },
  vite: () => ({
    build: {
      modulePreload: false,
    },
  }),
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (manifest.options_ui) {
        manifest.options_ui.open_in_tab = true;
      }
    },
  },
  manifestVersion: 3,
  manifest: ({ browser }) => {
    const isFirefox = browser === 'firefox';

    return {
      name: 'LinkedIn Slop Detector',
      description:
        'Detects formulaic writing clichés and stylistic slop patterns in LinkedIn posts.',
      permissions: ['storage'],
      host_permissions: ['*://*.linkedin.com/*'],
      action: {
        default_title: 'LinkedIn Slop Detector',
        default_popup: 'popup/index.html',
      },
      icons: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
      },
      ...(isFirefox
        ? {
            browser_specific_settings: {
              gecko: {
                id: 'linkedin-slop-detector@pragith.dev',
                strict_min_version: '109.0',
                data_collection_permissions: {
                  required: ['none'],
                },
              },
            },
          }
        : {}),
    };
  },
});
