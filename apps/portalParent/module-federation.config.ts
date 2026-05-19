import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'portalParent',
  exposes: {
    './Routes': 'apps/portalParent/src/app/portal-parent.routes.ts',
  },
};

export default config;
