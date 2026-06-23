import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions-db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "products");

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermissionAsync(session.user.role, "products", "manage")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file)
      return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json(
        { error: "Tipe file tidak diizinkan. Hanya JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    if (file.size > MAX_SIZE)
      return NextResponse.json(
        { error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(
      path.join(UPLOAD_DIR, filename),
      Buffer.from(await file.arrayBuffer())
    );

    return NextResponse.json({ url: `/products/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal upload" }, { status: 500 });
  }
}
