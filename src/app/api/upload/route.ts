// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Retrieve Supabase credentials from database configuration
    const urlResult: any = await supabase.from("SystemConfig").select("value").eq("key", "SUPABASE_URL").maybeSingle();
    const keyResult: any = await supabase.from("SystemConfig").select("value").eq("key", "SUPABASE_ANON_KEY").maybeSingle();

    const supabaseUrl = urlResult.data?.value || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = keyResult.data?.value || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[upload] Supabase configuration is missing. Please configure it in the Admin Cockpit settings.");
      return NextResponse.json({ 
        success: false, 
        error: "Supabase storage is not configured. Please set the Supabase Project URL and Anon Key in the Admin settings." 
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

