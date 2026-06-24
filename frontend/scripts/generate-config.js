const fs = require('fs');
const path = require('path');

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  console.error('ERROR: API_BASE_URL environment variable is required for Vercel build.');
  console.error('Set it to your Render backend URL, e.g. https://banking-api.onrender.com');
  process.exit(1);
}

const normalized = apiBaseUrl.replace(/\/$/, '');
const content = `// Auto-generated at build time — do not edit
window.APP_CONFIG = {
  apiBaseUrl: '${normalized.replace(/'/g, "\\'")}',
};
`;

fs.writeFileSync(path.join(__dirname, '..', 'config.js'), content, 'utf8');
console.log('Generated config.js with apiBaseUrl:', normalized);
