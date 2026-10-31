const { execSync } = require('child_process');

function run(cmd) {
  try {
    const res = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log(res);
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    console.error(`ERROR running ${cmd}:\nSTDOUT: ${stdout}\nSTDERR: ${stderr}\nMSG: ${err.message}`);
  }
}

const fs = require('fs');

try {
  const pkgPath = './package.json';
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts.build = 'tsc && vite build';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  run('git add package.json git-push.cjs');
  run('git commit -m "chore: restore standard tsc and vite build script for GitHub Actions"');
  run('git push origin main');
  run('git status');
} catch (e) {
  console.error(e);
}
