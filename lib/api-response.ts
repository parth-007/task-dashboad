import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export function success<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { code: "BAD_REQUEST", message, details } satisfies ApiError,
    { status: 400 }
  );
}

export function notFound(message = "Resource not found") {
  return NextResponse.json(
    { code: "NOT_FOUND", message } satisfies ApiError,
    { status: 404 }
  );
}

export function serverError(message = "Internal server error", details?: unknown) {
  return NextResponse.json(
    { code: "INTERNAL_ERROR", message, details } satisfies ApiError,
    { status: 500 }
  );
}

export function handleZodError(error: ZodError) {
  const details = error.flatten();
  return NextResponse.json(
    {
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      details,
    } satisfies ApiError,
    { status: 400 }
  );
}
