import { prisma } from "@/lib/prisma";
import { success, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
    return success(tags);
  } catch (error) {
    console.error("[GET /api/tags]", error);
    return serverError("Failed to fetch tags");
  }
}
