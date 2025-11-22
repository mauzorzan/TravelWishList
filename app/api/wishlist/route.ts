import { NextRequest, NextResponse } from 'next/server';
import { getAll, create } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = getAll();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.link) {
      return NextResponse.json(
        { error: 'Link is required' },
        { status: 400 }
      );
    }

    const newItem = create({
      link: body.link,
      notes: body.notes || '',
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to create wishlist item' },
      { status: 500 }
    );
  }
}

