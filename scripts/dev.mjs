import {spawnSync, spawn} from 'node:child_process';
const result = spawnSync(process.execPath,['scripts/build.mjs'],{
  stdio:'inherit',env:{...process.env,BASE_PATH:'/',SITE_ORIGIN:'http://localhost:4173'},
});
if (result.status !== 0) process.exit(result.status ?? 1);
const server = spawn(process.execPath,['scripts/serve.mjs','--dist','--port','4173'],{stdio:'inherit'});
server.on('exit',code=>process.exit(code ?? 0));
