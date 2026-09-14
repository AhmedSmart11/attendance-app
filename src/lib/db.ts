export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string; // In production, this would be hashed
  employeeId?: string;
  createdAt: string;
  isActive: boolean;
}

export interface UserSession {
  userId: string;
  token: string;
  deviceId: string; // Unique device identifier
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  lastActive: string;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
}

export interface ShiftSettings {
  id: string;
  startTime: string; // HH:mm format, e.g., "09:00"
  endTime: string;
  gracePeriodMinutes: number;
  isGlobal: boolean;
  employeeId?: string; // If not global, applies to specific employee
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  locationId: string;
  locationName: string;
  clockIn: string; // ISO timestamp
  clockOut?: string;
  status: 'on_time' | 'late' | 'absent' | 'pending_approval' | 'approved' | 'rejected';
  latitude?: number;
  longitude?: number;
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// Mock database storage (in production, use Supabase/PostgreSQL)
export const DB = {
  users: [] as User[],
  sessions: [] as UserSession[], // Track user sessions for single-device login
  locations: [] as Location[],
  shifts: [] as ShiftSettings[],
  attendance: [] as AttendanceRecord[],
};

// Initialize with sample data
export function initializeMockData() {
  if (DB.users.length === 0) {
    DB.users = [
      {
        id: 'admin-001',
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'admin',
        password: 'admin123',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'emp-001',
        email: 'employee@company.com',
        name: 'John Doe',
        role: 'employee',
        password: 'emp123',
        employeeId: 'EMP001',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'emp-002',
        email: 'jane@company.com',
        name: 'Jane Smith',
        role: 'employee',
        password: 'emp123',
        employeeId: 'EMP002',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    // Default office location (example: Cairo, Egypt coordinates)
    DB.locations = [
      {
        id: 'loc-001',
        name: 'HQ Office',
        latitude: 30.0444,
        longitude: 31.2357,
        radiusMeters: 500,
        createdAt: new Date().toISOString(),
      },
    ];

    // Default shift: 9 AM to 5 PM with 15 min grace period
    DB.shifts = [
      {
        id: 'shift-001',
        startTime: '09:00',
        endTime: '17:00',
        gracePeriodMinutes: 15,
        isGlobal: true,
      },
    ];
  }
}

// Simple token generation (in production, use JWT)
export function generateToken(): string {
  return 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Generate a unique device ID (stored in localStorage on client)
export function generateDeviceId(): string {
  return 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if coordinates are within a location's radius
export function isWithinLocation(
  userLat: number,
  userLon: number,
  location: Location
): boolean {
  const distance = calculateDistance(
    userLat,
    userLon,
    location.latitude,
    location.longitude
  );
  return distance <= location.radiusMeters;
}

// Get current shift for an employee
export function getEmployeeShift(userId: string): ShiftSettings | undefined {
  // First check for employee-specific shift
  const employeeShift = DB.shifts.find(
    (s) => s.employeeId === userId && !s.isGlobal
  );
  if (employeeShift) return employeeShift;

  // Fall back to global shift
  return DB.shifts.find((s) => s.isGlobal);
}

// Get today's attendance records for a user
export function getTodayAttendance(userId: string): AttendanceRecord[] {
  const today = new Date().toISOString().split('T')[0];
  return DB.attendance.filter(
    (record) => record.userId === userId && record.createdAt.startsWith(today)
  );
}

// Get monthly attendance history for a user
export function getMonthlyAttendance(userId: string): AttendanceRecord[] {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  return DB.attendance.filter(
    (record) =>
      record.userId === userId &&
      record.createdAt >= startOfMonth &&
      record.createdAt <= endOfMonth + 'T23:59:59'
  );
}

// Get all attendance records for today (for admin dashboard)
export function getTodayAllAttendance(): AttendanceRecord[] {
  const today = new Date().toISOString().split('T')[0];
  return DB.attendance.filter((record) =>
    record.createdAt.startsWith(today)
  );
}

// Get pending approvals (late clock-ins awaiting review)
export function getPendingApprovals(): AttendanceRecord[] {
  return DB.attendance.filter(
    (record) => record.status === 'pending_approval'
  );
}

// User management functions
export function getAllUsers(): User[] {
  return DB.users.filter(u => u.isActive);
}

export function getUserById(id: string): User | undefined {
  return DB.users.find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return DB.users.find(u => u.email === email);
}

export function createUser(data: Omit<User, 'id' | 'createdAt' | 'isActive'>): User | { error: string } {
  // Check if email already exists
  if (DB.users.find(u => u.email === data.email)) {
    return { error: 'Email already exists' };
  }

  const user: User = {
    ...data,
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  DB.users.push(user);
  return user;
}

export function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'isActive'>>): User | { error: string } {
  const index = DB.users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: 'User not found' };
  }

  // Check if email is being changed and already exists for another user
  if (data.email && DB.users.find(u => u.email === data.email && u.id !== id)) {
    return { error: 'Email already exists' };
  }

  DB.users[index] = {
    ...DB.users[index],
    ...data,
  };

  return DB.users[index];
}

export function deleteUser(id: string): { success: boolean } | { error: string } {
  // Prevent deleting yourself
  // In a real app, you'd check the current session user ID
  const index = DB.users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: 'User not found' };
  }

  // Soft delete (mark as inactive)
  DB.users[index].isActive = false;

  // Also remove any active sessions for this user
  DB.sessions = DB.sessions.filter(s => s.userId !== id);

  return { success: true };
}

export function toggleUserActiveInDB(id: string): User | { error: string } {
  const index = DB.users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: 'User not found' };
  }

  DB.users[index].isActive = !DB.users[index].isActive;

  // If deactivating, remove sessions
  if (!DB.users[index].isActive) {
    DB.sessions = DB.sessions.filter(s => s.userId !== id);
  }

  return DB.users[index];
}

// Session management for single-device login
export function createSession(userId: string, deviceId: string, deviceName: string, ipAddress: string): UserSession | { error: string } {
  // Check if user already has an active session
  const existingSession = DB.sessions.find(s => s.userId === userId);
  
  if (existingSession) {
    // Single device policy: remove old session
    DB.sessions = DB.sessions.filter(s => s.userId !== userId);
  }

  const session: UserSession = {
    userId,
    token: generateToken(),
    deviceId,
    deviceName,
    ipAddress,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  DB.sessions.push(session);
  return session;
}

export function getSessionByToken(token: string): UserSession | undefined {
  return DB.sessions.find(s => s.token === token);
}

export function getSessionByUserId(userId: string): UserSession | undefined {
  return DB.sessions.find(s => s.userId === userId);
}

export function updateSessionActivity(token: string): boolean {
  const session = DB.sessions.find(s => s.token === token);
  if (session) {
    session.lastActive = new Date().toISOString();
    return true;
  }
  return false;
}

export function deleteSession(token: string): boolean {
  const index = DB.sessions.findIndex(s => s.token === token);
  if (index !== -1) {
    DB.sessions.splice(index, 1);
    return true;
  }
  return false;
}

export function deleteAllUserSessions(userId: string): void {
  DB.sessions = DB.sessions.filter(s => s.userId !== userId);
}

// Get all active sessions (for admin view)
export function getAllSessions(): UserSession[] {
  return DB.sessions;
}

// Get session count per user
export function getSessionCountPerUser(): { userId: string; userName: string; sessionCount: number }[] {
  const result: { userId: string; userName: string; sessionCount: number }[] = [];
  
  DB.users.forEach(user => {
    const count = DB.sessions.filter(s => s.userId === user.id).length;
    if (count > 0) {
      result.push({
        userId: user.id,
        userName: user.name,
        sessionCount: count,
      });
    }
  });
  
  return result;
}
