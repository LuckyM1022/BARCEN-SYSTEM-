# Barcen Census Platform

Barcen is a two-application project for barangay census intake, resident management, and administrative validation workflows.

## Repository structure

```text
barcen/
├── frontend/    React client application
├── backend/     Node.js + MongoDB API
├── .vscode/     Workspace debug configuration
└── README.md    Project setup and architecture guide
```

Backend layout:

```text
backend/
├── config/         Environment loading
├── lib/            Shared helpers and utilities
├── repositories/   MongoDB data-access modules
├── routes/         HTTP route dispatch
├── services/       Business logic and auth rules
└── server.js       Application bootstrap
```

## Why this structure

- The frontend and backend now have their own package manifests and environment files.
- Each application can be installed, run, tested, and deployed independently.
- The root package is only an orchestration layer for developer convenience.

## Technology stack

- Frontend: React, React Router, Material UI
- Backend: Node.js HTTP server, MongoDB Native Driver
- Database: MongoDB Atlas or local MongoDB
- Authentication: signed bearer tokens with server-side role checks

## First-time setup

### 1. Install dependencies

From the repository root:

```sh
npm install
```

That single command now installs both the frontend and backend dependencies.

You can still install each application separately:

```sh
npm install --prefix frontend
npm install --prefix backend
```

### 2. Configure environment files

Create these files:

```text
frontend/.env
backend/.env
```

Use the example files as a template:

```sh
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

#### `frontend/.env`

```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

#### `backend/.env`

```env
API_PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
AUTH_SECRET=replace-this-with-a-long-random-string
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/barcen?retryWrites=true&w=majority&appName=barcen
MONGODB_DB=barcen
```

For another developer's laptop, `MONGODB_URI` is the easiest and safest option. They do not need local MongoDB installed if they are using Atlas.

### 3. Configure MongoDB Atlas network access

This is the part that usually breaks on another machine.

If you use MongoDB Atlas, the database will reject connections from devices that are not in the Atlas network allowlist.

In MongoDB Atlas:

1. Open your project.
2. Go to `Network Access`.
3. Add your current public IP address, or temporarily allow `0.0.0.0/0` for development.
4. Confirm that your database user has permission to access the target database.

Without this step, the backend may work on one machine and fail on another even when the code is correct.

## Running the project locally

Start the backend:

```sh
npm run server
```

Start the frontend in a second terminal:

```sh
npm start
```

Application URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`

## Build and verification

Build the frontend:

```sh
npm run build
```

Check backend syntax:

```sh
npm run check:backend
```

## Common troubleshooting

### Backend cannot connect to MongoDB

Check:

- `backend/.env` exists
- `MONGODB_URI` is set to a reachable MongoDB instance
- `AUTH_SECRET` is set
- Atlas IP allowlist includes the machine running the backend
- Atlas database user credentials are correct

### Frontend says "Failed to fetch"

Check:

- the backend is running
- `REACT_APP_API_BASE_URL` points to the correct backend URL
- `FRONTEND_ORIGIN` matches the frontend URL

### Another developer cannot run the project

Make sure they have:

- Node.js installed
- their own `frontend/.env` and `backend/.env`
- Atlas network access configured for their IP
- ran `npm install` from the project root after unzipping

### Partner quick start

On another laptop, the recommended flow is:

```sh
npm install
npm run doctor
npm run server
```

In a second terminal:

```sh
npm start
```

## Development notes

- `frontend/` contains all user-facing React code.
- `backend/repositories/` handles database access only.
- `backend/services/` contains business rules and auth logic.
- `backend/routes/` maps HTTP endpoints to service calls.
- Sensitive values must stay in `.env` files and out of Git.
- The generated `build/` folder should not be treated as source code.

## Raspberry Pi offline deployment

For an offline-first Raspberry Pi 4 setup, run the backend and a local MongoDB instance on the Pi, then point the frontend to the Pi's IP address.

Recommended flow:

1. Install a 64-bit OS on the Pi.
2. Install MongoDB locally on the Pi and use `LOCAL_MONGODB_URI` for that database.
3. Keep `ATLAS_MONGODB_URI` configured for cloud sync.
4. Leave `ENABLE_ATLAS_SYNC=true` so the Pi keeps retrying in the background.
5. Serve the React build from the Pi or from another device on the same LAN, but always target the Pi backend URL.

With the current backend, new census records and resident changes are written locally first and queued in `syncQueue` until Atlas is reachable again. Check `GET /api/sync/status` to confirm backlog and last successful sync time.

## Suggested next hardening steps

For a stronger thesis submission, the next engineering improvements should be:

1. add automated tests for authentication, residents, and admin workflows
2. split backend logic further into route, service, and data-access modules
3. add audit logs for sensitive admin actions
4. replace the development token secret with an environment-specific deployment secret
