# Barcen Backend

Node.js API for the Barcen Census Platform.

## Responsibilities

- authentication
- users and roles
- resident records
- census submissions
- admin and validator settings

## Internal structure

- `config/`: environment configuration
- `lib/`: shared utilities, serializers, and errors
- `repositories/`: MongoDB access layer
- `services/`: business logic and authorization
- `routes/`: HTTP endpoint dispatch

## Local setup

Install dependencies:

```sh
npm install
```

Create `backend/.env` from `backend/.env.example`, then start the server:

```sh
npm run dev
```

The API runs on `http://localhost:4000` by default.

## Environment variables

- `API_PORT`
- `FRONTEND_ORIGIN`
- `AUTH_SECRET`
- `LOCAL_MONGODB_URI`
- `ATLAS_MONGODB_URI`
- `ENABLE_ATLAS_SYNC`
- `SYNC_INTERVAL_MS`
- `MONGODB_URI` (legacy fallback when you only have one database target)
- `MONGODB_DB`

Recommended local development setup:

- set `MONGODB_URI` or `LOCAL_MONGODB_URI` to `mongodb://127.0.0.1:27017`
- set `ATLAS_MONGODB_URI` when you want background Atlas sync
- leave `PRIMARY_MONGODB_URI` empty unless you need to force a specific primary database
- leave `ENABLE_ATLAS_SYNC=true` for offline-first local storage plus later cloud sync

With the current backend startup flow, local MongoDB stays the primary database in local-first mode. If Atlas is unreachable, the backend keeps writing to local MongoDB and retries queued sync work later when Atlas becomes reachable again.

## Utility scripts

```sh
npm run check
npm run sync:live-api
```

`sync:live-api` copies data from a running local API into the MongoDB database defined in `backend/.env`.

Passwords are stored as hashed values, and authenticated API requests use signed bearer tokens.

## Offline-first Raspberry Pi mode

To run on a Raspberry Pi and keep collecting data while offline:

1. Set `LOCAL_MONGODB_URI` to the MongoDB instance running on the Pi.
2. Set `ATLAS_MONGODB_URI` to your Atlas connection string.
3. Set `ENABLE_ATLAS_SYNC=true`.
4. Point the frontend at the Pi backend with `REACT_APP_API_BASE_URL=http://<pi-ip>:4000`.

The backend writes new census records and resident updates to the local database first, stores pending Atlas sync work in the `syncQueue` collection, and retries in the background every `SYNC_INTERVAL_MS`. If the internet is down, data stays in local MongoDB until Atlas is reachable again.

You can inspect the current sync backlog at `GET /api/sync/status`.
