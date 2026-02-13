# Spencer's QOTD Generator

[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Claude Agent SDK](https://img.shields.io/badge/Claude_Agent_SDK-0.2-CC785C)](https://docs.anthropic.com/)
[![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

A dual-interface app (Next.js web UI + Node.js CLI) for generating and managing "question of the day" entries. Questions are AI-generated via the Claude Agent SDK with custom MCP tools and stored in SQLite through Prisma.

## Features

- **Web UI** -- Spinning wheel interface for random question selection, category and seriousness filtering, sound effects, confetti, responsive design
- **CLI** -- Interactive mode with menu-driven navigation, plus `generate`, `list`, `stats`, `edit`, and `delete` commands; supports local and remote modes
- **AI Generation** -- Claude Agent SDK with custom MCP server tools for intelligent question creation with deduplication
- **API** -- REST endpoints with optional API key authentication and rate limiting

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Core | Next.js 16, TypeScript, React 19, SQLite, Prisma 5 |
| CLI | Commander.js, Claude Agent SDK, Inquirer.js |
| UI | Tailwind CSS 4, Framer Motion, GSAP, Howler.js, Zustand |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Anthropic API key (required for AI question generation)

### Installation

```bash
git clone <repo-url> && cd qotd-gen
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./prisma/dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
QOTD_API_KEY="your-secret-key"   # optional, protects write API routes
```

Set up the database and start the dev server:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite connection string (e.g. `file:./prisma/dev.db`) |
| `ANTHROPIC_API_KEY` | For generation | Anthropic API key used by the CLI `generate` command |
| `QOTD_API_KEY` | No | When set, protects write API routes via `x-api-key` header |
| `QOTD_API_URL` | No | Remote API URL for CLI remote mode (alternative to `.qotdrc`) |

## CLI Usage

All CLI commands are run via `npx tsx cli/index.ts`.

### Interactive Mode

When invoked with no arguments in a TTY, the CLI presents an interactive menu:

```bash
npx tsx cli/index.ts
```

### Generate

Generate questions using Claude AI:

```bash
npx tsx cli/index.ts generate -n 5
npx tsx cli/index.ts generate -n 3 --category "Hot Takes"
npx tsx cli/index.ts generate -n 2 --level 4
npx tsx cli/index.ts generate -n 5 --dry-run    # preview without saving
```

| Flag | Description |
|------|-------------|
| `-n, --count <n>` | Number of questions to generate (default: 5) |
| `-c, --category <name>` | Target category |
| `-l, --level <n>` | Target seriousness level (1--5) |
| `--dry-run` | Preview generated questions without inserting |

### List

List questions with optional filters:

```bash
npx tsx cli/index.ts list
npx tsx cli/index.ts list --category "Wildcard"
npx tsx cli/index.ts list --level 3
npx tsx cli/index.ts list --search "favorite"
```

| Flag | Description |
|------|-------------|
| `-c, --category <name>` | Filter by category name |
| `-l, --level <n>` | Filter by seriousness level (1--5) |
| `-s, --search <text>` | Search question text |

### Stats

Show database statistics (totals, breakdown by level and category):

```bash
npx tsx cli/index.ts stats
```

### Edit

Edit a question by ID:

```bash
npx tsx cli/index.ts edit 42 --text "New question text?"
npx tsx cli/index.ts edit 42 --level 3
npx tsx cli/index.ts edit 42 --categories "1,2,5"
```

| Flag | Description |
|------|-------------|
| `-t, --text <text>` | New question text |
| `-l, --level <n>` | New seriousness level (1--5) |
| `-c, --categories <ids>` | New category IDs (comma-separated) |

### Delete

Delete questions by ID:

```bash
npx tsx cli/index.ts delete 42
npx tsx cli/index.ts delete 10 11 12
npx tsx cli/index.ts delete --all        # delete all (with confirmation)
npx tsx cli/index.ts delete --all -y     # skip confirmation
```

### Remote Mode

By default the CLI accesses SQLite directly. To connect to a running QOTD Gen server instead, create a `.qotdrc` file in your working directory:

```json
{
  "apiUrl": "http://localhost:3000",
  "apiKey": "your-secret-key"
}
```

Or set environment variables:

```bash
export QOTD_API_URL="http://localhost:3000"
export QOTD_API_KEY="your-secret-key"
```

You can also force the mode explicitly:

```bash
npx tsx cli/index.ts list --local    # force direct SQLite
npx tsx cli/index.ts list --remote   # force HTTP API
```

## API Routes

All write endpoints require an `x-api-key` header when `QOTD_API_KEY` is set.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/questions` | No | List questions (supports category, seriousness, limit, excludeIds filters) |
| POST | `/api/questions` | Yes | Create a single question |
| DELETE | `/api/questions` | Yes | Delete questions by IDs or all |
| POST | `/api/questions/bulk` | Yes | Bulk create questions |
| GET | `/api/questions/:id` | Yes | Get a single question |
| PATCH | `/api/questions/:id` | Yes | Update a question |
| DELETE | `/api/questions/:id` | Yes | Delete a question |
| GET | `/api/questions/stats` | Yes | Database statistics |
| GET | `/api/questions/texts` | Yes | All question texts (for dedup) |
| GET | `/api/questions/check-duplicate` | Yes | Check if a question text is a duplicate |
| GET | `/api/categories` | No | List categories (optional `withCount` param) |

## Project Structure

```
qotd-gen/
├── cli/                    # CLI entry point and commands
│   ├── index.ts            # CLI main (Commander.js setup)
│   ├── interactive.ts      # Interactive menu mode
│   ├── commands/           # generate, list, stats, edit, delete
│   └── lib/                # Agent, MCP tools, data clients, formatting
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # REST API routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/         # React components (Wheel, Filters, QuestionDisplay, ui)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Auth, Prisma, rate limiting, sound/animation helpers
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # API helpers, wheel math
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seed script
├── tests/
│   ├── cli/
│   │   ├── e2e/            # End-to-end CLI tests
│   │   ├── unit/           # Unit tests
│   │   └── helpers/        # Test utilities
│   └── web/
│       └── unit/           # Web unit tests
├── public/                 # Static assets, sounds, icons
├── Dockerfile              # Multi-stage production build
└── docker-entrypoint.sh    # Runtime migration + server start
```

## Testing

```bash
npm test                # Run all tests
npm run test:unit       # CLI unit tests only
npm run test:e2e        # CLI E2E tests only (spawns subprocesses)
npm run test:web        # Web unit tests
npm run test:watch      # Watch mode
```

E2E tests create temporary SQLite databases and run the CLI as child processes. The `generate` E2E tests require a valid `ANTHROPIC_API_KEY` and have a 180-second timeout.

## Docker

A multi-stage Dockerfile is included for production deployment:

```bash
docker build -t qotd-gen .
docker run -p 3000:3000 -v qotd-data:/data qotd-gen
```

The container runs Prisma migrations on startup and stores the SQLite database in `/data`. See the `Dockerfile` and `docker-entrypoint.sh` for details.

## Database Schema

The application uses SQLite with Prisma ORM:

- **Question** -- text content, normalized text for deduplication, seriousness level (1--5), timestamps
- **Category** -- name and hex color for UI display
- **QuestionCategory** -- many-to-many join table linking questions to categories
