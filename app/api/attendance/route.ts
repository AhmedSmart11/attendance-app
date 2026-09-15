import { NextRequest, NextResponse } from 'next/server';
import {
  clockIn,
  clockOut,
  getEmployeeAttendance,
  getTodayAttendance,
  getPendingApprovals,
  approveException,
  rejectException,
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  getShifts,
  addShift,
  updateShift,
  deleteShift,
  exportAttendanceToCSV,
} from '@/lib/actions';

// Helper to parse JSON body
async function getBody(request: NextRequest) {
  return request.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await getBody(request);
    const { endpoint } = body;

    switch (endpoint) {
      case 'clock-in': {
        const result = await clockIn(
          body.userId,
          body.userName,
          body.latitude,
          body.longitude,
          body.reason
        );
        if ('error' in result) {
          return NextResponse.json({ error: result.error, message: result.message }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'clock-out': {
        const result = await clockOut(body.userId);
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'employee-attendance': {
        const records = await getEmployeeAttendance(body.userId);
        return NextResponse.json({ records });
      }

      case 'approve': {
        const result = await approveException(body.recordId, body.adminId);
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'reject': {
        const result = await rejectException(body.recordId, body.adminId, body.rejectionReason);
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'add-location': {
        const result = await addLocation({
          name: body.name,
          latitude: body.latitude,
          longitude: body.longitude,
          radiusMeters: body.radiusMeters,
        });
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'update-location': {
        const result = await updateLocation(body.id, {
          name: body.name,
          latitude: body.latitude,
          longitude: body.longitude,
          radiusMeters: body.radiusMeters,
        });
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'delete-location': {
        const result = await deleteLocation(body.id);
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'add-shift': {
        const result = await addShift({
          startTime: body.startTime,
          endTime: body.endTime,
          gracePeriodMinutes: body.gracePeriodMinutes,
          isGlobal: body.isGlobal,
          employeeId: body.employeeId,
        });
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'update-shift': {
        const result = await updateShift(body.id, {
          startTime: body.startTime,
          endTime: body.endTime,
          gracePeriodMinutes: body.gracePeriodMinutes,
          isGlobal: body.isGlobal,
          employeeId: body.employeeId,
        });
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'delete-shift': {
        const result = await deleteShift(body.id);
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
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
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');

    switch (endpoint) {
      case 'today': {
        const records = await getTodayAttendance();
        return NextResponse.json({ records });
      }

      case 'pending': {
        const records = await getPendingApprovals();
        return NextResponse.json({ records });
      }

      case 'locations': {
        const locations = await getLocations();
        return NextResponse.json({ locations });
      }

      case 'shifts': {
        const shifts = await getShifts();
        return NextResponse.json({ shifts });
      }

      case 'export': {
        const result = await exportAttendanceToCSV();
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
        const response = new NextResponse(blob, {
          headers: {
            'Content-Type': 'text/csv;charset=utf-8;',
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        });
        return response;
      }

      default:
        return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
