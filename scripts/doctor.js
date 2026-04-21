const fs = require('fs');
const path = require('path');

const checks = [
  {
    label: 'frontend package',
    ok: fs.existsSync(path.join(process.cwd(), 'frontend', 'package.json')),
    fix: 'Make sure you are running this command from the project root.',
  },
  {
    label: 'backend package',
    ok: fs.existsSync(path.join(process.cwd(), 'backend', 'package.json')),
    fix: 'Make sure you are running this command from the project root.',
  },
  {
    label: 'frontend env file',
    ok: fs.existsSync(path.join(process.cwd(), 'frontend', '.env')),
    fix: 'Create frontend/.env from frontend/.env.example.',
  },
  {
    label: 'backend env file',
    ok: fs.existsSync(path.join(process.cwd(), 'backend', '.env')),
    fix: 'Create backend/.env from backend/.env.example.',
  },
  {
    label: 'frontend dependencies',
    ok: fs.existsSync(path.join(process.cwd(), 'frontend', 'node_modules', 'react-scripts')),
    fix: 'Run npm install at the project root or npm install --prefix frontend.',
  },
  {
    label: 'backend dependencies',
    ok: fs.existsSync(path.join(process.cwd(), 'backend', 'node_modules', 'mongodb')),
    fix: 'Run npm install at the project root or npm install --prefix backend.',
  },
];

const failedChecks = checks.filter((check) => !check.ok);

if (failedChecks.length === 0) {
  console.log('Barcen doctor check passed.');
  console.log('Frontend and backend folders, env files, and dependencies are present.');
  process.exit(0);
}

console.log('Barcen doctor found setup issues:');
failedChecks.forEach((check) => {
  console.log(`- Missing ${check.label}: ${check.fix}`);
});

process.exit(1);
