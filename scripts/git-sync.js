import { execSync } from 'child_process';

try {
  console.log('Running git add -A...');
  execSync('git add -A', { stdio: 'inherit' });
  
  try {
    console.log('Committing changes...');
    execSync('git commit -m "Clean UI: remove all emojis, simplify chat input, verify zero errors"', { stdio: 'inherit' });
  } catch (e) {
    console.log('Nothing to commit or already committed.');
  }

  console.log('Pushing to origin main...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Successfully pushed to origin main! Vercel auto-deploy initiated.');
} catch (err) {
  console.error('Git sync error:', err.message);
  process.exit(1);
}
