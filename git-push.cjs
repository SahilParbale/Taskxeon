const { execSync } = require('child_process');
const fs = require('fs');

const logFile = 'git-result.txt';
let output = [];

function run(cmd) {
  output.push(`\n=== RUNNING: ${cmd} ===`);
  console.log(`[GIT] Running: ${cmd}`);
  try {
    const res = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    output.push(res);
    console.log(res);
    return { success: true, output: res };
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    const msg = `ERROR (${err.status || err.code}):\nSTDOUT: ${stdout}\nSTDERR: ${stderr}\nMESSAGE: ${err.message}`;
    output.push(msg);
    console.error(msg);
    return { success: false, error: msg, stdout, stderr };
  }
}

try {
  run('git init');

  // Ensure git user config exists locally if not global
  try {
    execSync('git config user.name', { stdio: 'pipe' });
  } catch {
    run('git config user.name "SahilParbale"');
  }

  try {
    execSync('git config user.email', { stdio: 'pipe' });
  } catch {
    run('git config user.email "sahilparbale@users.noreply.github.com"');
  }

  // Set remote
  const remoteCheck = run('git remote -v');
  if (remoteCheck.output && remoteCheck.output.includes('origin')) {
    run('git remote set-url origin https://github.com/SahilParbale/Taskxeon.git');
  } else {
    run('git remote add origin https://github.com/SahilParbale/Taskxeon.git');
  }

  run('git branch -M main');
  run('git status');
  run('git add -A');
  run('git commit -m "Taskxeon: Complete Enterprise Task Management & Collaboration Platform"');
  
  // Attempt push
  const pushRes = run('git push -u origin main');
  if (!pushRes.success) {
    // If remote repository already has a commit (like README or license), try pull --rebase or force push if needed
    if (pushRes.stderr && (pushRes.stderr.includes('fetch first') || pushRes.stderr.includes('rejected'))) {
      run('git pull --rebase origin main');
      run('git push -u origin main');
    }
  }

  run('git log -n 3 --oneline');
  run('git status');
} catch (e) {
  output.push('UNCAUGHT EXCEPTION: ' + e.message);
} finally {
  fs.writeFileSync(logFile, output.join('\n'), 'utf8');
  console.log(`[GIT] Finished. Log saved to ${logFile}`);
}
