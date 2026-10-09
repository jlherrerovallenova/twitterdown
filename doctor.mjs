import { execSync } from 'node:child_process';

const args = process.argv.slice(2).join(' ');
const cmd = `npx react-doctor ${args || '--verbose'}`;

try {
  execSync(cmd, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NAPI_RS_FORCE_WASI: 'true',
    },
  });
} catch (error) {
  process.exit(error.status || 1);
}
