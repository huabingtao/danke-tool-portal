import { NextRequest, NextResponse } from 'next/server';
import { queryListings } from '@/lib/db/index';
import { seedShanghaiRealData } from '@/lib/crawler/beike-crawler';
import type { ListingFilterParams, ListingType } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    // 若数据库尚未初始化数据，自动执行首次预置
    let initialCheck = queryListings();
    if (initialCheck.stats.totalCount === 0) {
      await seedShanghaiRealData();
    }

    const { searchParams } = new URL(request.url);
    const parseNum = (key: string): number | undefined => {
      const raw = searchParams.get(key);
      if (!raw || raw.trim() === '') return undefined;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };

    const filters: ListingFilterParams = {
      minTotalPrice: parseNum('minTotalPrice'),
      maxTotalPrice: parseNum('maxTotalPrice'),
      minUnitPrice: parseNum('minUnitPrice'),
      maxUnitPrice: parseNum('maxUnitPrice'),
      listingType: (searchParams.get('listingType') as 'all' | ListingType) || 'all',
      district: searchParams.get('district') || 'all',
      rooms: parseNum('rooms'),
      minArea: parseNum('minArea'),
      maxArea: parseNum('maxArea'),
      maxSubwayMeters: parseNum('maxSubwayMeters'),
      keyword: searchParams.get('keyword') || undefined,
      sortBy:
        (searchParams.get('sortBy') as ListingFilterParams['sortBy']) || 'default',
    };

    const result = queryListings(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to query listings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
