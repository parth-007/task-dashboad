import { prisma } from "@/lib/prisma";
import { success, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
    });
    return success(users);
  } catch (error) {
    console.error("[GET /api/users]", error);
    return serverError("Failed to fetch users");
  }
}
