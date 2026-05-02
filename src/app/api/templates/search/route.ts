import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      status: 'APPROVED',
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ];
    }

    if (category) {
      where.category = category;
    }

    let orderBy: any = { createdAt: 'desc' };

    if (sortBy === 'price-low') orderBy = { price: 'asc' };
    else if (sortBy === 'price-high') orderBy = { price: 'desc' };
    else if (sortBy === 'rating') orderBy = { rating: 'desc' };
    else if (sortBy === 'popular') orderBy = { downloads: 'desc' };

    const templates = await db.template.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        rating: true,
        downloads: true,
        category: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    const total = await db.template.count({ where });

    return NextResponse.json(
      {
        templates,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Search templates error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to search templates' }, { status: 500 });
  }
}
