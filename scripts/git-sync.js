import { execSync } from 'child_process';

if (process.env.VERCEL || process.env.CI) {
  console.log('CI environment detected (Vercel): skipping git sync.');
  process.exit(0);
}

try {
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "Build config: ensure standard build command without CI side effects"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('Successfully synced with GitHub origin/main.');
  } catch (e) {
    console.log('Working tree clean, nothing to commit.');
  }
} catch (err) {
  console.log('Git sync skipped:', err.message);
}
