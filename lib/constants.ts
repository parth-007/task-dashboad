import type { Status, Priority } from "@prisma/client";

export const BOARD_STATUSES: Status[] = [
  "BACKLOG",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

export const STATUS_LABELS: Record<Status, string> = {
  BACKLOG: "Backlog",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};
