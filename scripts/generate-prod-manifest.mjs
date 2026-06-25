import fs from 'fs';
import path from 'path';

const remotes = {
  portalAdmin: process.env.MF_REMOTE_PORTAL_ADMIN,
  portalStudent: process.env.MF_REMOTE_PORTAL_STUDENT,
  portalTeacher: process.env.MF_REMOTE_PORTAL_TEACHER,
  portalParent: process.env.MF_REMOTE_PORTAL_PARENT,
  portalTransport: process.env.MF_REMOTE_PORTAL_TRANSPORT,
  portalFinance: process.env.MF_REMOTE_PORTAL_FINANCE,
};

const manifest = {};
for (const [name, url] of Object.entries(remotes)) {
  if (url) manifest[name] = `${url}/mf-manifest.json`;
}

const outDir = path.resolve('apps/shell/public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'module-federation.manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('Generated production manifest:', manifest);