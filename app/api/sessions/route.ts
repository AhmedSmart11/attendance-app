import { NextRequest, NextResponse } from 'next/server';
import { getAllSessionsList, getSessionsSummary } from '@/lib/actions';

// GET /api/sessions - Get all sessions or summary
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');

    if (type === 'summary') {
      const summary = await getSessionsSummary();
      return NextResponse.json({ summary });
    }

    // Default: get all sessions
    const sessions = await getAllSessionsList();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
