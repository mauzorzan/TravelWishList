import { NextRequest, NextResponse } from 'next/server';
import { getAll, create, updateRanks } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getAll();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching travel destinations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel destinations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.destination || !body.country) {
      return NextResponse.json(
        { error: 'Destination and country are required' },
        { status: 400 }
      );
    }

    const newItem = await create({
      rank: body.rank || 1,
      destination: body.destination,
      country: body.country,
      latitude: body.latitude || 0,
      longitude: body.longitude || 0,
      reason: body.reason || '',
      budget: body.budget || '',
      timeline: body.timeline || '',
      image_url: body.image_url || '',
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating travel destination:', error);
    return NextResponse.json(
      { error: 'Failed to create travel destination' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.ranks || !Array.isArray(body.ranks)) {
      return NextResponse.json(
        { error: 'Ranks array is required' },
        { status: 400 }
      );
    }

    const success = await updateRanks(body.ranks);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update ranks' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating ranks:', error);
    return NextResponse.json(
      { error: 'Failed to update ranks' },
      { status: 500 }
    );
  }
}
