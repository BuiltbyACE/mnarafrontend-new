import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'portalStudent',
  exposes: {
    './Routes': 'apps/portalStudent/src/app/remote-entry/entry.routes.ts',
  },
  shared: (libraryName, defaultConfig) => {
    if (libraryName.startsWith('@angular/material')) {
      return { ...defaultConfig, singleton: true, strictVersion: false };
    }
    return defaultConfig;
  }
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
