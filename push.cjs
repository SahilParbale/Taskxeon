const { execSync } = require('child_process');

try {
  console.log('1. Adding files...');
  execSync('git add -A', { stdio: 'inherit' });
  console.log('2. Committing...');
  execSync('git commit -m "Implement AES-256-GCM End-to-End Encryption, Team vs Personal Chat UI redesign, and Vercel configuration"', { stdio: 'inherit' });
  console.log('3. Pushing to origin main...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Successfully pushed to GitHub!');
} catch (e) {
  console.log('Push process output:', e.message);
}
