import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const minBudget = parseInt(searchParams.get('minBudget') || '0');
    const maxBudget = parseInt(searchParams.get('maxBudget') || '999999');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      status: status || 'OPEN',
      budget: {
        gte: minBudget,
        lte: maxBudget,
      },
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { requiredSkills: { hasSome: [query] } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };

    if (sortBy === 'budget-low') orderBy = { budget: 'asc' };
    else if (sortBy === 'budget-high') orderBy = { budget: 'desc' };
    else if (sortBy === 'ending-soon') orderBy = { deadline: 'asc' };

    const projects = await db.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        status: true,
        deadline: true,
        requiredSkills: true,
        proposalCount: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            rating: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    const total = await db.project.count({ where });

    return NextResponse.json(
      {
        projects,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Search projects error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to search projects' }, { status: 500 });
  }
}
