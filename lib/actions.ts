'use server';

import { cookies } from 'next/headers';
import {
  DB,
  initializeMockData,
  generateToken,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActiveInDB,
  getAllUsers,
  getUserById,
  getUserByEmail,
  createSession,
  getSessionByToken,
  deleteSession,
  deleteAllUserSessions,
  getAllSessions,
  getSessionCountPerUser,
  type User,
  type AttendanceRecord,
  type Location,
  type ShiftSettings,
  type UserSession,
} from '@/lib/db';

initializeMockData();

// Login with single-device policy
export async function login(email: string, password: string, deviceId?: string, deviceName?: string, ipAddress?: string) {
  const user = DB.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return { error: 'Invalid credentials' };
  }

  if (!user.isActive) {
    return { error: 'Account is deactivated' };
  }

  // Create session with single-device policy
  const session = createSession(
    user.id,
    deviceId || `device_${Date.now()}`,
    deviceName || 'Unknown Device',
    ipAddress || 'unknown'
  );

  if ('error' in session) {
    return { error: session.error };
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_token', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return {
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    },
    session,
  };
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    deleteSession(token);
  }

  cookieStore.delete('auth_token');
  return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  const session = getSessionByToken(token);
  if (!session) {
    return null;
  }

  // Update last active
  const user = DB.users.find(u => u.id === session.userId);
  if (!user || !user.isActive) {
    return null;
  }

  return { 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    },
    session,
  };
}

// User management (Admin only)
export async function getAllUsersList(): Promise<User[]> {
  return getAllUsers();
}

export async function getUserDetails(userId: string): Promise<User | null> {
  return getUserById(userId) || null;
}

export async function createNewUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'employee' = 'employee',
  employeeId?: string
): Promise<User | { error: string }> {
  return createUser({
    email,
    password,
    name,
    role,
    employeeId,
  });
}

export async function updateExistingUser(
  userId: string,
  data: {
    email?: string;
    password?: string;
    name?: string;
    role?: 'admin' | 'employee';
    employeeId?: string;
  }
): Promise<User | { error: string }> {
  return updateUser(userId, data);
}

export async function deactivateUser(userId: string): Promise<{ success: boolean } | { error: string }> {
  return deleteUser(userId);
}

export async function toggleUserActive(userId: string): Promise<User | { error: string }> {
  return toggleUserActiveInDB(userId);
}

export async function removeUserSessions(userId: string): Promise<void> {
  deleteAllUserSessions(userId);
}

// Get all active sessions
export async function getAllSessionsList(): Promise<UserSession[]> {
  return getAllSessions();
}

export async function getSessionsSummary(): Promise<{ userId: string; userName: string; sessionCount: number }[]> {
  return getSessionCountPerUser();
}

// Attendance actions
export async function clockIn(
  userId: string,
  userName: string,
  latitude: number,
  longitude: number,
  reason?: string
) {
  // Find the first available location
  const location = DB.locations[0];
  if (!location) {
    return { error: 'No work location configured' };
  }

  // Check if within geofence (server-side verification)
  const withinRange = DB.locations.some(loc => {
    const dist = Math.sqrt(
      Math.pow(latitude - loc.latitude, 2) +
      Math.pow(longitude - loc.longitude, 2)
    );
    return dist <= loc.radiusMeters / 111000; // rough conversion
  });

  // Get employee shift
  const shift = DB.shifts.find(s => s.isGlobal) || DB.shifts[0];
  if (!shift) {
    return { error: 'No shift configured' };
  }

  const [startHour, startMinute] = shift.startTime.split(':').map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const shiftStartMinutes = startHour * 60 + startMinute;
  const graceMinutes = (shift.gracePeriodMinutes || 0);

  const isLate = currentMinutes > shiftStartMinutes + graceMinutes;
  const isWithinLocation = withinRange; // Simplified check

  let status: AttendanceRecord['status'] = 'on_time';
  if (!isWithinLocation) {
    return { error: 'Out of Bounds: You are not within the allowed location radius' };
  }

  if (isLate) {
    if (!reason || reason.trim() === '') {
      return { error: 'late_required', message: 'You are late. Please provide a reason.' };
    }
    status = 'pending_approval';
  }

  const record: AttendanceRecord = {
    id: `att-${Date.now()}`,
    userId,
    userName,
    locationId: location.id,
    locationName: location.name,
    clockIn: now.toISOString(),
    status,
    latitude,
    longitude,
    reason: isLate ? reason : undefined,
    createdAt: now.toISOString(),
  };

  DB.attendance.push(record);
  return { success: true, record };
}

export async function clockOut(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const record = DB.attendance.find(
    r => r.userId === userId && r.clockIn.startsWith(today) && !r.clockOut
  );

  if (!record) {
    return { error: 'No active clock-in found for today' };
  }

  record.clockOut = new Date().toISOString();
  if (record.status === 'pending_approval') {
    record.status = 'approved';
  }

  return { success: true, record };
}

export async function getEmployeeAttendance(userId: string) {
  return DB.attendance.filter(r => r.userId === userId);
}

export async function getTodayAttendance() {
  const today = new Date().toISOString().split('T')[0];
  return DB.attendance.filter(r => r.createdAt.startsWith(today));
}

export async function getPendingApprovals() {
  return DB.attendance.filter(r => r.status === 'pending_approval');
}

export async function approveException(recordId: string, adminId: string) {
  const record = DB.attendance.find(r => r.id === recordId);
  if (!record) return { error: 'Record not found' };

  record.status = 'approved';
  record.approvedBy = adminId;
  record.approvedAt = new Date().toISOString();

  if (!record.clockOut) {
    record.clockOut = new Date().toISOString();
  }

  return { success: true };
}

export async function rejectException(recordId: string, adminId: string, rejectionReason: string) {
  const record = DB.attendance.find(r => r.id === recordId);
  if (!record) return { error: 'Record not found' };

  record.status = 'rejected';
  record.approvedBy = adminId;
  record.approvedAt = new Date().toISOString();
  record.rejectionReason = rejectionReason;

  if (!record.clockOut) {
    record.clockOut = new Date().toISOString();
  }

  return { success: true };
}

// Location management
export async function getLocations(): Promise<Location[]> {
  return DB.locations;
}

export async function addLocation(data: Omit<Location, 'id' | 'createdAt'>) {
  const location: Location = {
    ...data,
    id: `loc-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  DB.locations.push(location);
  return { success: true, location };
}

export async function updateLocation(id: string, data: Partial<Omit<Location, 'id' | 'createdAt'>>) {
  const index = DB.locations.findIndex(l => l.id === id);
  if (index === -1) return { error: 'Location not found' };

  DB.locations[index] = { ...DB.locations[index], ...data };
  return { success: true, location: DB.locations[index] };
}

export async function deleteLocation(id: string) {
  const index = DB.locations.findIndex(l => l.id === id);
  if (index === -1) return { error: 'Location not found' };

  DB.locations.splice(index, 1);
  return { success: true };
}

// Shift settings
export async function getShifts(): Promise<ShiftSettings[]> {
  return DB.shifts;
}

export async function addShift(data: Omit<ShiftSettings, 'id'>) {
  const shift: ShiftSettings = {
    ...data,
    id: `shift-${Date.now()}`,
  };
  DB.shifts.push(shift);
  return { success: true, shift };
}

export async function updateShift(id: string, data: Partial<Omit<ShiftSettings, 'id'>>) {
  const index = DB.shifts.findIndex(s => s.id === id);
  if (index === -1) return { error: 'Shift not found' };

  DB.shifts[index] = { ...DB.shifts[index], ...data };
  return { success: true, shift: DB.shifts[index] };
}

export async function deleteShift(id: string) {
  const index = DB.shifts.findIndex(s => s.id === id);
  if (index === -1) return { error: 'Shift not found' };

  DB.shifts.splice(index, 1);
  return { success: true };
}

// Export to CSV
export async function exportAttendanceToCSV() {
  const records = DB.attendance;
  if (records.length === 0) {
    return { error: 'No attendance data to export' };
  }

  const headers = [
    'ID',
    'Employee Name',
    'Employee ID',
    'Location',
    'Clock In',
    'Clock Out',
    'Status',
    'Latitude',
    'Longitude',
    'Reason',
    'Approved By',
    'Approved At',
    'Rejection Reason',
  ];

  const rows = records.map(r => [
    r.id,
    r.userName,
    r.userId,
    r.locationName,
    r.clockIn,
    r.clockOut || '',
    r.status,
    r.latitude || '',
    r.longitude || '',
    r.reason || '',
    r.approvedBy || '',
    r.approvedAt || '',
    r.rejectionReason || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ),
  ].join('\n');

  return { csv: csvContent, filename: `attendance_${new Date().toISOString().split('T')[0]}.csv` };
}
