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
    const item = getById(parseInt(id));
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.link) {
      return NextResponse.json(
        { error: 'Link is required' },
        { status: 400 }
      );
    }

    const updatedItem = update(parseInt(id), {
      link: body.link,
      notes: body.notes,
    });

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = remove(parseInt(id));

    if (!success) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to delete wishlist item' },
      { status: 500 }
    );
  }
}

