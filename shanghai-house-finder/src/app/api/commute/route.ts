import { NextRequest, NextResponse } from 'next/server';
import { getListingById } from '@/lib/db/index';
import { calculateCommutePlan } from '@/lib/geo/transport-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const destination = searchParams.get('destination') || '陆家嘴金融城';
    const amapKey = searchParams.get('amapKey') || undefined;

    if (listingId) {
      const listing = getListingById(listingId);
      if (!listing) {
        return NextResponse.json({ error: '房源不存在' }, { status: 404 });
      }
      const plan = await calculateCommutePlan({
        originName: listing.communityName,
        originLat: listing.lat,
        originLng: listing.lng,
        transportSummary: listing.transportSummary,
        destinationQuery: destination,
        amapKey,
      });
      return NextResponse.json(plan);
    }

    const lat = Number(searchParams.get('lat') || 31.2262);
    const lng = Number(searchParams.get('lng') || 121.5595);
    const originName = searchParams.get('originName') || '当前房源';

    const plan = await calculateCommutePlan({
      originName,
      originLat: lat,
      originLng: lng,
      destinationQuery: destination,
      amapKey,
    });

    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate commute';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
