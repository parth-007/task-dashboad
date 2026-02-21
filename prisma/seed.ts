import { prisma } from "../lib/prisma";

async function main() {
  // Users (Dubai, London, Mumbai offices)
  const [alice, bob, carol, dave] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@delphi.com" },
      update: {},
      create: { name: "Alice Chen", email: "alice@delphi.com", image: null },
    }),
    prisma.user.upsert({
      where: { email: "bob@delphi.com" },
      update: {},
      create: { name: "Bob Smith", email: "bob@delphi.com", image: null },
    }),
    prisma.user.upsert({
      where: { email: "carol@delphi.com" },
      update: {},
      create: { name: "Carol Jones", email: "carol@delphi.com", image: null },
    }),
    prisma.user.upsert({
      where: { email: "dave@delphi.com" },
      update: {},
      create: { name: "Dave Wilson", email: "dave@delphi.com", image: null },
    }),
  ]);

  // Tags
  const [frontend, backend, bug, feature, urgent, docs] = await Promise.all([
    prisma.tag.upsert({
      where: { name: "Frontend" },
      update: {},
      create: { name: "Frontend", color: "#3b82f6" },
    }),
    prisma.tag.upsert({
      where: { name: "Backend" },
      update: {},
      create: { name: "Backend", color: "#22c55e" },
    }),
    prisma.tag.upsert({
      where: { name: "Bug" },
      update: {},
      create: { name: "Bug", color: "#ef4444" },
    }),
    prisma.tag.upsert({
      where: { name: "Feature" },
      update: {},
      create: { name: "Feature", color: "#8b5cf6" },
    }),
    prisma.tag.upsert({
      where: { name: "Urgent" },
      update: {},
      create: { name: "Urgent", color: "#f59e0b" },
    }),
    prisma.tag.upsert({
      where: { name: "Docs" },
      update: {},
      create: { name: "Docs", color: "#64748b" },
    }),
  ]);

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Tasks across all columns (createMany does not support relations)
  await prisma.task.createMany({
    data: [
      {
        title: "Set up CI/CD pipeline",
        description: "Configure GitHub Actions for build and deploy.",
        status: "BACKLOG",
        priority: "HIGH",
        assigneeId: alice.id,
        dueDate: nextWeek,
        position: 0,
      },
      {
        title: "Design system documentation",
        description: "Document components and tokens for the design system.",
        status: "BACKLOG",
        priority: "MEDIUM",
        assigneeId: null,
        dueDate: nextMonth,
        position: 1,
      },
      {
        title: "Fix login redirect on Safari",
        description: "Users report redirect loop on Safari after login.",
        status: "BACKLOG",
        priority: "CRITICAL",
        assigneeId: bob.id,
        dueDate: now,
        position: 2,
      },
      {
        title: "Implement task board drag-and-drop",
        description: "Add @dnd-kit for Kanban column reordering.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assigneeId: alice.id,
        dueDate: nextWeek,
        position: 0,
      },
      {
        title: "Real-time sync with SSE",
        description: "Server-Sent Events for live task updates.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assigneeId: carol.id,
        dueDate: nextWeek,
        position: 1,
      },
      {
        title: "Task detail modal with inline edit",
        description: "Intercepting route and form for task editing.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        assigneeId: bob.id,
        dueDate: nextWeek,
        position: 2,
      },
      {
        title: "API routes for tasks CRUD",
        description: "GET, POST, PATCH, DELETE with Zod validation.",
        status: "IN_REVIEW",
        priority: "HIGH",
        assigneeId: dave.id,
        dueDate: now,
        position: 0,
      },
      {
        title: "Responsive layout for tablets",
        description: "Breakpoints and touch targets for field engineers.",
        status: "IN_REVIEW",
        priority: "MEDIUM",
        assigneeId: alice.id,
        dueDate: nextWeek,
        position: 1,
      },
      {
        title: "Prisma schema and migrations",
        description: "Task, User, Tag models and relations.",
        status: "DONE",
        priority: "HIGH",
        assigneeId: carol.id,
        dueDate: now,
        position: 0,
      },
      {
        title: "Next.js app and Tailwind setup",
        description: "App Router, Tailwind CSS, base layout.",
        status: "DONE",
        priority: "MEDIUM",
        assigneeId: null,
        dueDate: now,
        position: 1,
      },
    ],
  });

  // Attach tags to tasks
  const tasks = await prisma.task.findMany();
  for (const task of tasks) {
    const toConnect: { id: string }[] = [];
    if (task.title.includes("CI/CD") || task.title.includes("API")) toConnect.push({ id: backend.id });
    if (task.title.includes("Design") || task.title.includes("board") || task.title.includes("modal")) toConnect.push({ id: frontend.id });
    if (task.title.includes("Fix") || task.title.includes("Safari")) toConnect.push({ id: bug.id });
    if (task.title.includes("Real-time") || task.title.includes("sync")) toConnect.push({ id: feature.id });
    if (task.title.includes("Safari")) toConnect.push({ id: urgent.id });
    if (task.title.includes("documentation")) toConnect.push({ id: docs.id });
    if (task.title.includes("Prisma") || task.title.includes("Next.js")) toConnect.push({ id: feature.id });
    if (toConnect.length === 0) toConnect.push({ id: feature.id });

    await prisma.task.update({
      where: { id: task.id },
      data: { tags: { set: toConnect } },
    });
  }

  console.log(`Seeded ${tasks.length} tasks, 4 users, 6 tags.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
