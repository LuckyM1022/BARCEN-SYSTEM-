const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { hashPassword, isPasswordHashed } = require('../lib/security');

loadEnvFile();

const SOURCE_API = process.env.SOURCE_API || 'http://localhost:4000';
const SOURCE_API_EMAIL = process.env.SOURCE_API_EMAIL || 'andrea.reyes@barcen.local';
const SOURCE_API_PASSWORD = process.env.SOURCE_API_PASSWORD || 'admin123';
const SOURCE_API_TOKEN = process.env.SOURCE_API_TOKEN || '';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'barcen';

const demoPasswordsByEmail = {
  'andrea.reyes@barcen.local': 'admin123',
  'john.delacruz@barcen.local': 'validator123',
  'liza.manalo@barcen.local': 'census123',
  'carlo.tolentino@barcen.local': 'census123',
};

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

function toObjectId(value) {
  if (ObjectId.isValid(value) && String(new ObjectId(value)) === value) {
    return new ObjectId(value);
  }

  return value;
}

function toDate(value) {
  if (!value) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

async function getSourceToken() {
  if (SOURCE_API_TOKEN) {
    return SOURCE_API_TOKEN;
  }

  const response = await fetch(`${SOURCE_API}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: SOURCE_API_EMAIL,
      password: SOURCE_API_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate against source API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

async function getJson(pathname, token) {
  const response = await fetch(`${SOURCE_API}${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${pathname}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required.');
  }

  const sourceToken = await getSourceToken();

  const [usersData, residentsData, recordsData, rolesData, adminSettingsData, validatorSettingsData] = await Promise.all([
    getJson('/api/users', sourceToken),
    getJson('/api/residents', sourceToken),
    getJson('/api/census-records', sourceToken),
    getJson('/api/admin/roles', sourceToken),
    getJson('/api/admin/settings', sourceToken),
    getJson('/api/validator/settings', sourceToken),
  ]);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(DB_NAME);

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('residents').createIndex({ name: 1 });
  await db.collection('censusRecords').createIndex({ createdAt: -1 });
  await db.collection('roles').createIndex({ name: 1 }, { unique: true });
  await db.collection('settings').createIndex({ scope: 1 }, { unique: true });

  const userResults = [];

  for (const user of usersData.users || []) {
    const existingUser = await db.collection('users').findOne({ email: user.email });
    const sourcePassword = existingUser?.password || demoPasswordsByEmail[user.email] || 'changeme123';
    const password = isPasswordHashed(sourcePassword) ? sourcePassword : await hashPassword(sourcePassword);

    const result = await db.collection('users').updateOne(
      { email: user.email },
      {
        $set: {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          password,
        },
      },
      { upsert: true }
    );

    userResults.push(result);
  }

  const roleResults = await Promise.all(
    (rolesData.roles || []).map((role) =>
      db.collection('roles').updateOne(
        { name: role.name },
        {
          $set: {
            name: role.name,
            access: role.access,
            members: role.members,
          },
        },
        { upsert: true }
      )
    )
  );

  const settingsResults = await Promise.all(
    [adminSettingsData.settings, validatorSettingsData.settings]
      .filter(Boolean)
      .map((settings) =>
        db.collection('settings').updateOne(
          { scope: settings.scope },
          { $set: settings },
          { upsert: true }
        )
      )
  );

  const recordResults = [];

  for (const record of recordsData.records || []) {
    const { id, createdAt, ...rest } = record;
    await db.collection('censusRecords').replaceOne(
      { _id: toObjectId(id) },
      {
        _id: toObjectId(id),
        ...rest,
        createdAt: toDate(createdAt),
      },
      { upsert: true }
    );
    recordResults.push(id);
  }

  const residentResults = [];

  for (const resident of residentsData.residents || []) {
    const { id, createdAt, censusRecordId, ...rest } = resident;
    await db.collection('residents').replaceOne(
      { _id: toObjectId(id) },
      {
        _id: toObjectId(id),
        ...rest,
        ...(censusRecordId ? { censusRecordId: toObjectId(censusRecordId) } : {}),
        ...(createdAt ? { createdAt: toDate(createdAt) } : {}),
      },
      { upsert: true }
    );
    residentResults.push(id);
  }

  const summary = {
    users: usersData.users?.length || 0,
    roles: rolesData.roles?.length || 0,
    adminSettings: adminSettingsData.settings ? 1 : 0,
    validatorSettings: validatorSettingsData.settings ? 1 : 0,
    residents: residentsData.residents?.length || 0,
    censusRecords: recordsData.records?.length || 0,
    userWrites: userResults.map((result) => ({
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    })),
    roleWrites: roleResults.map((result) => ({
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    })),
    settingsWrites: settingsResults.map((result) => ({
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    })),
  };

  console.log(JSON.stringify(summary, null, 2));

  await client.close();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
