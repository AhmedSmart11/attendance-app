import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsersList,
  getUserDetails,
  createNewUser,
  updateExistingUser,
  toggleUserActive,
  removeUserSessions,
} from '@/lib/actions';

// GET /api/users - List all users or get user by ID
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (userId) {
      // Get specific user
      const user = await getUserDetails(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    // List all users
    const users = await getAllUsersList();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    switch (endpoint) {
      case 'create': {
        const result = await createNewUser(
          body.email,
          body.password,
          body.name,
          body.role || 'employee',
          body.employeeId
        );
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ user: result });
      }

      case 'update': {
        const result = await updateExistingUser(body.userId, {
          email: body.email,
          password: body.password,
          name: body.name,
          role: body.role,
          employeeId: body.employeeId,
        });
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ user: result });
      }

      case 'toggle-status': {
        const result = await toggleUserActive(body.userId);
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ user: result });
      }

      case 'remove-sessions': {
        await removeUserSessions(body.userId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
