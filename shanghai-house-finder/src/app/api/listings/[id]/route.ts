import { NextRequest, NextResponse } from 'next/server';
import { getListingById } from '@/lib/db/index';
import { calculateCommutePlan } from '@/lib/geo/transport-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const listing = getListingById(id);
    if (!listing) {
      return NextResponse.json({ error: '未找到该房源' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination') || '陆家嘴金融城';
    const amapKey = searchParams.get('amapKey') || undefined;

    const commutePlan = await calculateCommutePlan({
      originName: listing.communityName,
      originLat: listing.lat,
      originLng: listing.lng,
      transportSummary: listing.transportSummary,
      destinationQuery: destination,
      amapKey,
    });

    return NextResponse.json({
      listing,
      commutePlan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load listing detail';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
