import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createComplaint, type UploadInput } from "@/lib/complaints";
import { errorResponse, HttpError, requireViewer } from "@/lib/http";
import { createComplaintSchema } from "@/lib/validation";
import { visibleComplaintFilter } from "@/lib/rbac";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per file
const MAX_FILES = 3;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let input;
    let files: UploadInput[] = [];

    if (isMultipart) {
      const form = await request.formData();

      input = createComplaintSchema.parse({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        category: String(form.get("category") ?? ""),
        priority: String(form.get("priority") ?? ""),
      });

      const rawFiles = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
      if (rawFiles.length > MAX_FILES) throw new HttpError(413, `Attach at most ${MAX_FILES} files`);
      for (const file of rawFiles) {
        if (file.size > MAX_FILE_SIZE) throw new HttpError(413, `${file.name} is larger than 2 MB`);
        if (file.type && !ALLOWED_MIME.has(file.type)) {
          throw new HttpError(415, `${file.name} is not an allowed file type`);
        }
      }

      files = await Promise.all(
        rawFiles.map(async (file) => ({
          filename: file.name.slice(0, 180),
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          data: Buffer.from(await file.arrayBuffer()),
        })),
      );
    } else {
      input = createComplaintSchema.parse(await request.json());
    }

    const complaint = await createComplaint(viewer, input, files);
    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const query = url.searchParams.get("q")?.trim();

    const complaints = await prisma.complaint.findMany({
      where: {
        ...(visibleComplaintFilter(viewer) as object),
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { reference: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        priority: true,
        level: true,
        category: true,
        createdAt: true,
        dueAt: true,
      },
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    return errorResponse(error);
  }
}
