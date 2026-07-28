// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    let supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    let supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

    // Strip surrounding quotes if present (common copy-paste mistake)
    if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) supabaseUrl = supabaseUrl.slice(1, -1);
    if (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")) supabaseUrl = supabaseUrl.slice(1, -1);
    if (supabaseAnonKey.startsWith('"') && supabaseAnonKey.endsWith('"')) supabaseAnonKey = supabaseAnonKey.slice(1, -1);
    if (supabaseAnonKey.startsWith("'") && supabaseAnonKey.endsWith("'")) supabaseAnonKey = supabaseAnonKey.slice(1, -1);

    console.log(`[upload-diagnostics] URL length: ${supabaseUrl.length}, starts with: "${supabaseUrl.slice(0, 15)}"`);
    console.log(`[upload-diagnostics] Key length: ${supabaseAnonKey.length}, starts with: "${supabaseAnonKey.slice(0, 15)}"`);

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder") || supabaseAnonKey.includes("placeholder")) {
      console.error("[upload] Supabase configuration is missing or placeholder.");
      return NextResponse.json({ 
        success: false, 
        error: "Supabase storage environment variables are missing or invalid." 
      }, { status: 400 });
    }

    // Initialize Supabase Client dynamically
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique filename to avoid collision
    const fileParts = file.name.split(".");
    const fileExtension = fileParts.length > 1 ? fileParts.pop() : "mp4";
    const cleanFileName = fileParts.join(".")
      .replace(/[^a-zA-Z0-9]/g, "_"); // Remove special characters
    const filename = `${Date.now()}-${cleanFileName}.${fileExtension}`;

    // Upload to 'auditions' bucket in Supabase storage
    const { data, error } = await supabaseClient.storage
      .from("auditions")
      .upload(filename, buffer, {
        contentType: file.type,
        duplex: 'half',
      });

    if (error) {
      console.error("[upload] Supabase upload error details:", error);
      if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
        return NextResponse.json({ 
          success: false, 
          error: "Supabase bucket 'auditions' not found. Please create a public bucket named 'auditions' in your Supabase dashboard." 
        }, { status: 404 });
      }
      throw new Error(error.message);
    }

    // Get public URL of the uploaded file
    const { data: { publicUrl } } = supabaseClient.storage
      .from("auditions")
      .getPublicUrl(filename);

    console.log(`[upload] File uploaded successfully to Supabase Storage: ${publicUrl}`);
    return NextResponse.json({ success: true, filePath: publicUrl });
  } catch (error: any) {
    console.error("[upload] File upload failed:", error);
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 });
  }
}

