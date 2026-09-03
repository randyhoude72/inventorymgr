const fs = require('fs');
const path = require('path');

const rootDirectory = path.resolve(__dirname, '..');
const customizationsDirectory = path.join(rootDirectory, 'customizations');
const configFile = path.join(customizationsDirectory, 'orgConfig.json');
const buildConfigFile = path.join(rootDirectory, 'build', 'public', 'config', 'orgConfig.json');
const buildDirectory = path.join(rootDirectory, 'build');

// Files that, when present in customizations/, override the checked-in public/ versions.
const OVERRIDABLE_ASSETS = ['favicon.ico', 'logo192.png', 'logo512.png'];

const mode = process.argv[2];

function assertConfigExists() {
  if (!fs.existsSync(configFile)) {
    throw new Error(
      `Missing required file: ${configFile}\n` +
      `Copy customizations/orgConfig.json.example to customizations/orgConfig.json and fill in your organization's values.`
    );
  }
}

function copyOverridableAssets() {
  for (const assetName of OVERRIDABLE_ASSETS) {
    const sourceFile = path.join(customizationsDirectory, assetName);
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, path.join(buildDirectory, assetName));
    }
  }
}

if (mode === 'check') {
  assertConfigExists();
} else if (mode === 'publish') {
  assertConfigExists();
  fs.mkdirSync(path.dirname(buildConfigFile), { recursive: true });
  fs.copyFileSync(configFile, buildConfigFile);
  // Overwrite the public/ defaults last so custom branding wins.
  copyOverridableAssets();
} else {
  throw new Error('Usage: node scripts/copy-org-config.js <check|publish>');
}