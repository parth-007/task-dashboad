"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchUsers, type User } from "@/lib/tasks";

/** Value can be User | null for edit flows, or { id, name } for simple forms */
export type AssigneeValue = User | null | { id: string | null; name: string | null };

function isUser(v: AssigneeValue): v is User {
  return v !== null && typeof v === "object" && "email" in v;
}

export function AsigneeSelect({
  value,
  onChange,
  placeholder = "Select assignee",
  /** When true, onChange is called with { id, name } only (for forms that don't need full User). */
  simpleValue = false,
}: {
  value: AssigneeValue;
  onChange: (user: User | null | { id: string | null; name: string | null }) => void;
  placeholder?: string;
  simpleValue?: boolean;
}) {
  const [search, setSearch] = useState("");
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          !search ||
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const displayName =
    value === null
      ? null
      : isUser(value)
        ? value.name
        : value.name;

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(open) => !open && setSearch("")}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-start font-normal w-full">
          {displayName ?? placeholder}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 pb-1">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <DropdownMenuItem
          onSelect={() =>
            onChange(simpleValue ? { id: null, name: null } : null)
          }
        >
          Unassigned
        </DropdownMenuItem>
        {filteredUsers.slice(0, 10).map((u) => (
          <DropdownMenuItem
            key={u.id}
            onSelect={() =>
              onChange(simpleValue ? { id: u.id, name: u.name } : u)
            }
          >
            {u.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
