import { NextRequest, NextResponse } from 'next/server';
import { getById, update, remove } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await getById(parseInt(id));
    
    if (!item) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching travel destination:', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel destination' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.destination || !body.country) {
      return NextResponse.json(
        { error: 'Destination and country are required' },
        { status: 400 }
      );
    }

    const updatedItem = await update(parseInt(id), {
      rank: body.rank,
      destination: body.destination,
      country: body.country,
      latitude: body.latitude,
      longitude: body.longitude,
      reason: body.reason,
      budget: body.budget,
      timeline: body.timeline,
      image_url: body.image_url,
    });

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating travel destination:', error);
    return NextResponse.json(
      { error: 'Failed to update travel destination' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await remove(parseInt(id));

    if (!success) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting travel destination:', error);
    return NextResponse.json(
      { error: 'Failed to delete travel destination' },
      { status: 500 }
    );
  }
}
