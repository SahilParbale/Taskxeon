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

  if (fs.existsSync('./scratch-clear-messages.cjs')) {
    run('node ./scratch-clear-messages.cjs');
    fs.unlinkSync('./scratch-clear-messages.cjs');
  }

  run('git status');
  run('git add -A');
  run('git commit -m "feat: clear team messages, add clear chat functionality, and sync with cloud"');
  run('git push origin main');
  run('git status');
} catch (e) {
  console.error(e);
}
