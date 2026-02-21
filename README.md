# Task Dashboard

A Kanban-style task board built with Next.js. Manage tasks across **Backlog**, **In Progress**, **In Review**, and **Done**. Add tasks, assign people, set priority and due dates, tag items, and drag cards between columns. The dashboard uses Server-Sent Events (SSE) so changes from one tab or user are reflected in real time.

## What’s in it

- **Board** – Four columns (Backlog, In Progress, In Review, Done) with drag-and-drop (e.g. drag a card to change status).
- **Tasks** – Title, description, status, priority (Critical / High / Medium / Low), assignee, due date, and tags.
- **Add task** – “Add Task” opens a modal to create a task with all fields.
- **Edit task** – Click a card to open the task in a modal (intercepting route); edit and save, or close/cancel.
- **Filters** – Filter by status, assignee, and priority via the filter bar.
- **Real-time updates** – Connection status indicator and live updates when tasks change (SSE).

## Tech stack

- **Next.js 16** (App Router), **React 19**
- **PostgreSQL** + **Prisma**
- **TanStack Query** (data fetching/cache), **Zustand** (client state)
- **@dnd-kit** (drag-and-drop), **@tanstack/react-virtual** (virtualized list for large columns)
- **Radix UI** (dialogs), **Tailwind CSS**, **shadcn-style** UI components

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** (local or hosted; connection string in `.env`)

## How to run it

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Create a `.env` file in the project root with your Postgres URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your database details.

### 3. Database

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

(If you don’t have migrations yet, use `npx prisma db push` for a quick schema sync.)

### 4. Seed (optional)

Seed users, tags, and sample tasks:

```bash
npx prisma db seed
```

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to the dashboard at `/dashboard`.

## How to use it

1. **Dashboard** – At `/dashboard` you see the board with four columns and the filter bar. “Add Task” and the connection indicator are in the header.
2. **Add a task** – Click **Add Task**, fill the form (title required; optional description, status, priority, assignee, due date, tags), then **Create task**.
3. **Move a task** – Drag a card from one column and drop it in another; status updates automatically.
4. **Edit a task** – Click a card. The task opens in a modal; edit fields and click **Save**, or **Cancel** / close to leave without saving. Refreshing or opening the task URL in a new tab shows the full-page task view.
5. **Filter** – Use the filter bar to narrow by status, assignee, and/or priority.
6. **Real time** – Open the dashboard in two tabs (or two browsers); create or move a task in one and see it update in the other. The header shows connection status (e.g. “Connected” when SSE is active).

## Scripts

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start Next.js dev server       |
| `npm run build`   | Production build               |
| `npm run start`   | Run production server          |
| `npm run lint`    | Run ESLint                     |
| `npm run test`    | Run Vitest once                |
| `npm run test:watch` | Run Vitest in watch mode    |

## Project structure (high level)

- `app/` – Next.js App Router: `dashboard` (board page), `@modal` (intercepting route for task modal), `api/` (tasks, tags, users, SSE).
- `components/` – Board, columns, task cards, task detail/edit modal, add-task modal, filter bar, shared `Modal`, `ConnectionStatus`, UI primitives.
- `lib/` – Prisma client, task fetching, validations, types, SSE broadcast.
- `hooks/` – `use-tasks` (mutations/queries), `use-sse` (real-time).
- `prisma/` – Schema and seed.
