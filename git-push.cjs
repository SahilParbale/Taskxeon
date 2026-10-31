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

try {
  run('git status');
  run('git add -A');
  run('git commit -m "feat: complete end-to-end realtime sync for messages, ringing notifications, presence, and tasks"');
  run('git push origin main');
  run('git status');
} catch (e) {
  console.error(e);
}
