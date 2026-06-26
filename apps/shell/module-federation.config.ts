import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'shell',
  remotes: [],
  shared: (libraryName, defaultConfig) => {
    if (libraryName.startsWith('@angular/material')) {
      return { ...defaultConfig, singleton: true, strictVersion: false };
    }
    return defaultConfig;
  }
};

export default config;