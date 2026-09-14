import { NextRequest, NextResponse } from 'next/server';
import {
  login,
  logout,
  getSession,
  getAllUsersList,
  getUserDetails,
  createNewUser,
  updateExistingUser,
  toggleUserActive,
  removeUserSessions,
  getAllSessionsList,
  getSessionsSummary,
} from '@/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    switch (endpoint) {
      case 'login': {
        const result = await login(
          body.email,
          body.password,
          body.deviceId,
          body.deviceName,
          body.ipAddress
        );
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 401 });
        }
        return NextResponse.json(result);
      }

      case 'logout': {
        await logout();
        return NextResponse.json({ success: true });
      }

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
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return session if available, otherwise return empty object (not 401)
    // This allows frontend to check auth status without errors
    const session = await getSession();
    if (session) {
      return NextResponse.json(session);
    }
    // Return empty response instead of 401 to avoid console errors
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
