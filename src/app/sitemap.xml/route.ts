import { generateSitemapXML } from "@/lib/sitemap";
import { NextResponse } from "next/server";

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const sitemap = await generateSitemapXML();
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
