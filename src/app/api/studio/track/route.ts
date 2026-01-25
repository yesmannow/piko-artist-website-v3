import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import pikoTracks from "@/data/piko-tracks.json";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get("trackId");

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    // Validate trackId against the manifest to prevent unauthorized file access
    const isValidTrack = pikoTracks.some(track => track.trackId === trackId);
    if (!isValidTrack) {
      return NextResponse.json(
        { error: "Invalid track ID" },
        { status: 404 }
      );
    }

    // Validate bucket configuration
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json(
        { error: "Storage configuration error" },
        { status: 500 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: trackId,
    });

    // Generate signed URL valid for 1 hour
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("R2 Signing Error:", error);
    return NextResponse.json(
      { error: "Failed to generate secure stream URL" },
      { status: 500 }
    );
  }
}
