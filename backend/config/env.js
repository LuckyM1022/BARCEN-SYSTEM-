const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];

  const envPath = envPaths.find((candidate) => fs.existsSync(candidate));

  if (!envPath) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const fallbackMongoUri = 'mongodb://127.0.0.1:27017';
const primaryMongoUri = process.env.PRIMARY_MONGODB_URI
  || process.env.MONGODB_URI
  || process.env.LOCAL_MONGODB_URI
  || process.env.ATLAS_MONGODB_URI
  || fallbackMongoUri;
const atlasMongoUri = process.env.ATLAS_MONGODB_URI
  || (primaryMongoUri.startsWith('mongodb+srv://') ? primaryMongoUri : '');
const syncEnabledByDefault = Boolean(atlasMongoUri && atlasMongoUri !== primaryMongoUri);

module.exports = {
  AUTH_SECRET: process.env.AUTH_SECRET || 'barcen-dev-secret-change-me',
  DB_NAME: process.env.MONGODB_DB || 'barcen',
  ENABLE_ATLAS_SYNC: String(process.env.ENABLE_ATLAS_SYNC || syncEnabledByDefault) === 'true',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '*',
  ATLAS_MONGODB_URI: atlasMongoUri,
  PORT: Number(process.env.API_PORT || process.env.PORT || 4000),
  PRIMARY_MONGODB_URI: primaryMongoUri,
  SYNC_INTERVAL_MS: Math.max(5000, Number(process.env.SYNC_INTERVAL_MS || 30000) || 30000),
};
