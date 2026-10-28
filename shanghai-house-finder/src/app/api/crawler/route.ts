import { NextRequest, NextResponse } from 'next/server';
import { getRecentCrawlJobs, queryListings } from '@/lib/db/index';
import { executeCrawlTask } from '@/lib/crawler/beike-crawler';
import type { ListingType } from '@/lib/db/schema';

export async function GET() {
  try {
    const jobs = getRecentCrawlJobs(10);
    const { stats } = queryListings();
    return NextResponse.json({ jobs, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load crawler status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await executeCrawlTask({
      district: body.district || 'all',
      listingType: (body.listingType as 'all' | ListingType) || 'all',
      minPrice: body.minPrice ? Number(body.minPrice) : undefined,
      maxPrice: body.maxPrice ? Number(body.maxPrice) : undefined,
      maxItems: body.maxItems ? Number(body.maxItems) : 6,
      amapKey: body.amapKey || undefined,
    });

    const jobs = getRecentCrawlJobs(10);
    const { stats } = queryListings();

    return NextResponse.json({
      result,
      jobs,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute crawl task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
