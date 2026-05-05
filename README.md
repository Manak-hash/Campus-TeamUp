# Campus TeamUp

A platform for university students to publish project ideas, specify required skills, and form teams through structured join requests.

The [Project Specifications Document](docs/specifications.md) for our teacher.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** PHP 8.5+ REST API (Slim 4)
- **Database:** SQLite 3

## Team

- [@Manak-hash](https://github.com/Manak-hash)
- [@o-alharrar](https://github.com/o-alharrar)
- [@aymensada](https://github.com/aymensada)

## Local Development Setup

### Prerequisites

- PHP 8.5+
- Composer
- Node.js 20+
- npm

### Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
composer install
\`\`\`

3. Configure environment:
\`\`\`bash
cp .env.example .env
# Edit .env and set DB_PATH to absolute path
\`\`\`

4. Initialize database:
\`\`\`bash
cd database
sqlite3 campus-teamup.db < schema.sql
cd ..
\`\`\`

5. Start PHP server:
\`\`\`bash
php -S localhost:8000 -t public
\`\`\`

Backend will run on http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
\`\`\`bash
cd frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Configure environment:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Start Vite dev server:
\`\`\`bash
npm run dev
\`\`\`

Frontend will run on http://localhost:5173

## Testing

### Backend Health Check

\`\`\`bash
curl http://localhost:8000/api/ping
\`\`\`

Expected response:
\`\`\`json
{"status":"ok","message":"Campus TeamUp API is running","timestamp":"..."}
\`\`\`

### Frontend

Open browser to http://localhost:5173

## Project Status

- [ ] Phase 0: Project Setup 
- [ ] Phase 1: Authentication & Profiles
- [ ] Phase 2: Projects Core
- [ ] Phase 3: Applications & Teams
- [ ] Phase 4: Admin & Polish
- [ ] Phase 5: Ship & Refine

