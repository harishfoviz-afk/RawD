// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure public/uploads directory exists
    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save the file with its original name
    const filePath = path.join(uploadDir, file.name);
    fs.writeFileSync(filePath, buffer);

    console.log(`[upload] File saved successfully to: ${filePath}`);
    return NextResponse.json({ success: true, filePath: `/uploads/${file.name}` });
  } catch (error: any) {
    console.error("[upload] File upload failed:", error);
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 });
  }
}
