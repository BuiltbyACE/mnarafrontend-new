import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'portalFinance',
  exposes: {
    './Routes': 'apps/portalFinance/src/app/remote-entry/entry.routes.ts',
  },
};

export default config;
