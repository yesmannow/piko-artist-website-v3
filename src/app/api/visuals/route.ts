import { NextResponse } from "next/server";
import { searchVisuals } from "@/lib/visuals";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const theme = searchParams.get("theme") ?? undefined;
  const countParam = searchParams.get("count");
  const pageParam = searchParams.get("page");

  const count = Math.max(1, Math.min(50, Number(countParam) || 12));
  const page = Math.max(1, Number(pageParam) || 1);

  try {
    const images = await searchVisuals({ theme, count, page });
    return NextResponse.json(
      { images },
      {
        headers: {
          // Cache at the edge for 30 minutes, allow SWR for a day
          "Cache-Control": "s-maxage=1800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { images: [], error: "Failed to fetch visuals" },
      { status: 500 }
    );
  }
}
