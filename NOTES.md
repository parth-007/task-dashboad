# Project notes

This document explains key decisions, trade-offs, and known limitations. It also lists possible improvements for future work.

---

## Data layer: server actions vs API routes

**Current setup.** Create and update go through server actions (`app/actions.ts`). The board and modals call these directly, which keeps progressive enhancement and avoids a separate backend. The REST API (`/api/tasks`, `/api/tasks/[id]`) is used for GET (board and task detail) and is available for external clients (e.g. a future mobile app). As a result there are two mutation paths: the UI uses actions, while the API also exposes create/update. Both publish to SSE. A cleaner approach would be to pick one: either use only server actions (and optionally drop create/update from the API), or use the API as the single source and have the client call it for all mutations.

**Initial data.** The dashboard page fetches tasks on the server and passes them as `initialTasks`. The board uses React Query with that as `initialData` so the first paint has data without a loading flash. Filters are in the URL, so the server runs the same query the client would. The server and client filter shape must stay in sync; the code does this by sharing the same search params and a single `fetchTasks`-style query.

---

## Real-time (SSE)

**In-memory broadcast.** `lib/sse-broadcast.ts` keeps a set of listeners on `globalThis`. When a task is created or updated (via action or API), the code calls `publish("task", ...)`. The SSE route subscribes and pushes events to the client. This needs no extra infrastructure. The downside is that it is process-local: with multiple Next instances (e.g. serverless or multi-pod), each has its own listeners. A create on instance A will not appear on a client connected to instance B. Fine for a single-instance or small-team demo; for production at scale, something like Redis pub/sub (or a dedicated real-time service) would be needed so all instances share the same events.

**Reconnect and heartbeat.** The stream sends a `connected` event when opened and a heartbeat every 30s. The client (`use-sse`) on error closes the EventSource and retries with backoff (capped at 30s). The client does not parse the heartbeat; it only reacts to `task` events to invalidate/refetch. The heartbeat mainly keeps the connection alive for proxies and load balancers. Explicit “last event” tracking could be added later to show stale state.

---

## Board and drag-and-drop

**Optimistic status updates.** When a card is dropped in another column, the app calls `updateTaskStatusAction` and performs an optimistic update so the UI moves immediately. On error it rolls back using the snapshot from `onMutate` and shows a small toast. Reordering within a column is not done optimistically (see “Future improvements” below).

**Virtualization.** Columns use `@tanstack/react-virtual` when a column has at least 200 tasks (`USE_VIRTUAL_THRESHOLD` in `Column.tsx`). Below that, the list is rendered normally. The threshold is a trade-off: it avoids jank on large columns without adding virtual-list complexity for typical loads. If in-column reorder is added later, the virtualizer and DnD would need to be coordinated (e.g. for index animations).

**Keyboard.** The board keeps a flat list of task IDs in column order. Arrow keys move focus between cards; Enter navigates to the task page. Refs are registered per card so the focused card can be scrolled into view. When dragging, keyboard behavior is mostly from the DnD library; no extra shortcuts are implemented for the overlay.

---

## Task detail and modals

**Intercepting route.** Clicking a task navigates to `/dashboard/task/[id]`. A `(.)task` intercepting route under `@modal` makes that navigation show the task in a modal when coming from the dashboard. Refreshing or opening the URL in a new tab shows the full page. One route, two UIs. See `docs/INTERCEPTING_ROUTES.md` for the `(.)` vs `(..)` semantics so the modal route is not broken by refactors.

**Shared Modal.** Add-task and edit-task modals share the same layout (title, scrollable body, footer). That shell lives in `components/shared/Modal.tsx` (Dialog + DialogContent + DialogHeader + DialogTitle). Each screen still owns its form and footer; only the chrome is shared.

---

## Filtering and URL

Filters are stored in the URL (`?status=...&assignee=...&priority=...`). The dashboard reads `searchParams` and passes them into the server fetch and the board. FilterBar updates the URL with `router.replace(..., { scroll: false })`. The board’s React Query key includes these filters, so changing them triggers a refetch. Shareable links and browser back/forward work. A “clear all filters” button is not implemented but would be straightforward to add.

---

## Validation and types

**Zod.** All create/update payloads and the GET tasks query are validated with Zod. Schemas live in `lib/validations.ts` and are reused in actions and API routes. Error messages are flattened and the UI typically shows the first form error; multi-field error display could be improved.

**Prisma.** A single `taskInclude` (assignee, tags) is used in both actions and API so the “task with relations” shape is consistent. The type `TaskWithRelations` matches that. New relations should be added to `taskInclude` and the type updated accordingly.

---

## Future improvements

1. **Pagination.** The API returns `total`, `page`, and `limit` and supports `page`/`limit` query params. The client currently ignores this and requests a fixed limit (100). Adding infinite scroll or a “Load more” button and wiring the client to the existing API would improve scalability.

2. **Order within a column.** The schema has a `position` field and it is updated in the API/actions, but the GET list does not order by it (it uses `createdAt` or the requested sort). Drag-to-reorder within a column would not persist in the list order. Changing the default ordering to `position` (then e.g. `createdAt`) per status would make reorder visible and allow in-column DnD later.

3. **SSE scaling.** Moving the broadcast to Redis (or similar) would allow multiple server instances to share events so the client is not tied to a single instance.

4. **Single source for mutations.** Either use only server actions and remove create/update from the API, or use only the API and remove the duplicate logic from actions. Right now both paths exist and both must call `publish`; keeping them in sync is easy to miss.

5. **Error handling and toasts.** The board has an inline toast for “update failed, reverted.” Elsewhere, errors are shown inline in forms. A small toast/notification system would centralize success and error feedback.

6. Same taskInclude (assignee + tags) on every place we return a task. P2003 → 400, P2025 → 404, everything else → 500 with console.error. No transactions on the single-op flows.

7. **Accessibility.** Radix handles dialog focus and escape. The board has basic keyboard navigation. A full a11y pass (e.g. screen reader flow, focus after modal close, drag-and-drop announcements) has not been done.


---

These notes reflect the current state of the project and a rough backlog for the next iteration.
