'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Textarea,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  Building2,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Calendar,
  User,
  Users,
  LogOut,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Smartphone,
  Activity,
  TrendingUp,
  UserPlus,
  UserCog,
} from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  employeeId?: string;
  isActive: boolean;
  createdAt: string;
}

interface UserSession {
  userId: string;
  token: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  lastActive: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  locationName: string;
  clockIn: string;
  clockOut?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
}

interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  isGlobal: boolean;
  employeeId?: string;
}

interface SessionsSummary {
  userId: string;
  userName: string;
  sessionCount: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'users' | 'settings' | 'sessions'>('dashboard');

  // Attendance data
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AttendanceRecord[]>([]);

  // Location data
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radiusMeters: '',
  });

  // Shift data
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    gracePeriodMinutes: '15',
    isGlobal: true,
    employeeId: '',
  });

  // Users data
  const [users, setUsers] = useState<User[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee',
    employeeId: '',
  });
  const [searchUser, setSearchUser] = useState('');

  // Sessions data
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsSummary, setSessionsSummary] = useState<SessionsSummary[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);

          if (data.user?.role !== 'admin') {
            router.push('/employee');
            return;
          }
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch {
        console.error('Failed to fetch users');
      }
    };

    init();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch('/api/attendance?endpoint=today');
      if (res.ok) {
        const data = await res.json();
        setTodayAttendance(data.records || []);
      }
    } catch {
      console.error('Failed to fetch today attendance');
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch('/api/attendance?endpoint=pending');
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data.records || []);
      }
    } catch {
      console.error('Failed to fetch pending approvals');
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/attendance?endpoint=locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch {
      console.error('Failed to fetch locations');
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/attendance?endpoint=shifts');
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    } catch {
      console.error('Failed to fetch shifts');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      console.error('Failed to fetch users');
    }
  };

  const fetchSessions = async () => {
    try {
      const [sessionsRes, summaryRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/sessions?type=summary'),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSessionsSummary(data.summary || []);
      }
    } catch {
      console.error('Failed to fetch sessions');
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_time':
        return <Badge className="bg-emerald-100 text-emerald-800">On Time</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-800">Late</Badge>;
      case 'pending_approval':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800">{status}</Badge>;
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name || !locationForm.latitude || !locationForm.longitude || !locationForm.radiusMeters) {
      setActionFeedback({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'add-location',
          name: locationForm.name,
          latitude: parseFloat(locationForm.latitude),
          longitude: parseFloat(locationForm.longitude),
          radiusMeters: parseInt(locationForm.radiusMeters),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to add location' });
        return;
      }

      setLocations([...locations, data.location]);
      setShowLocationDialog(false);
      setLocationForm({ name: '', latitude: '', longitude: '', radiusMeters: '' });
      setActionFeedback({ type: 'success', message: 'Location added successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !locationForm.name || !locationForm.latitude || !locationForm.longitude || !locationForm.radiusMeters) {
      setActionFeedback({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'update-location',
          id: editingLocation.id,
          name: locationForm.name,
          latitude: parseFloat(locationForm.latitude),
          longitude: parseFloat(locationForm.longitude),
          radiusMeters: parseInt(locationForm.radiusMeters),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to update location' });
        return;
      }

      setLocations(locations.map((l) => (l.id === editingLocation.id ? data.location : l)));
      setShowLocationDialog(false);
      setEditingLocation(null);
      setLocationForm({ name: '', latitude: '', longitude: '', radiusMeters: '' });
      setActionFeedback({ type: 'success', message: 'Location updated successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'delete-location', id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to delete location' });
        return;
      }

      setLocations(locations.filter((l) => l.id !== id));
      setActionFeedback({ type: 'success', message: 'Location deleted successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'add-shift',
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          gracePeriodMinutes: parseInt(shiftForm.gracePeriodMinutes),
          isGlobal: shiftForm.isGlobal,
          employeeId: shiftForm.employeeId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to add shift' });
        return;
      }

      setShifts([...shifts, data.shift]);
      setShowShiftDialog(false);
      setShiftForm({ startTime: '09:00', endTime: '17:00', gracePeriodMinutes: '15', isGlobal: true, employeeId: '' });
      setActionFeedback({ type: 'success', message: 'Shift added successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'update-shift',
          id: editingShift.id,
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          gracePeriodMinutes: parseInt(shiftForm.gracePeriodMinutes),
          isGlobal: shiftForm.isGlobal,
          employeeId: shiftForm.employeeId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to update shift' });
        return;
      }

      setShifts(shifts.map((s) => (s.id === editingShift.id ? data.shift : s)));
      setShowShiftDialog(false);
      setEditingShift(null);
      setShiftForm({ startTime: '09:00', endTime: '17:00', gracePeriodMinutes: '15', isGlobal: true, employeeId: '' });
      setActionFeedback({ type: 'success', message: 'Shift updated successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'delete-shift', id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to delete shift' });
        return;
      }

      setShifts(shifts.filter((s) => s.id !== id));
      setActionFeedback({ type: 'success', message: 'Shift deleted successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  // User management functions
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email || !userForm.password || !userForm.name) {
      setActionFeedback({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'create',
          email: userForm.email,
          password: userForm.password,
          name: userForm.name,
          role: userForm.role,
          employeeId: userForm.employeeId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to create user' });
        return;
      }

      setUsers([...users, data.user]);
      setShowUserDialog(false);
      setUserForm({ email: '', password: '', name: '', role: 'employee', employeeId: '' });
      setActionFeedback({ type: 'success', message: 'User created successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!userForm.email || !userForm.name) {
      setActionFeedback({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'update',
          userId: editingUser.id,
          email: userForm.email,
          password: userForm.password || undefined,
          name: userForm.name,
          role: userForm.role,
          employeeId: userForm.employeeId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to update user' });
        return;
      }

      setUsers(users.map((u) => (u.id === editingUser.id ? data.user : u)));
      setShowUserDialog(false);
      setEditingUser(null);
      setUserForm({ email: '', password: '', name: '', role: 'employee', employeeId: '' });
      setActionFeedback({ type: 'success', message: 'User updated successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentlyActive: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'toggle-status',
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to update user status' });
        return;
      }

      setUsers(users.map((u) => (u.id === userId ? data.user : u)));

      if (data.user.isActive) {
        setActionFeedback({ type: 'success', message: 'User activated and sessions removed' });
      } else {
        setActionFeedback({ type: 'success', message: 'User deactivated and sessions removed' });
      }
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleRemoveUserSessions = async (userId: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'remove-sessions',
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to remove sessions' });
        return;
      }

      // Refresh sessions
      fetchSessions();
      setActionFeedback({ type: 'success', message: 'User sessions removed - user will be logged out' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleApprove = async (recordId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'approve', recordId, adminId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to approve' });
        return;
      }

      setPendingApprovals(pendingApprovals.filter((r) => r.id !== recordId));
      setTodayAttendance(
        todayAttendance.map((r) =>
          r.id === recordId ? { ...r, status: 'approved', approvedBy: user.id, approvedAt: new Date().toISOString() } : r
        )
      );
      setActionFeedback({ type: 'success', message: 'Exception approved successfully' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleReject = async (recordId: string, reason: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'reject',
          recordId,
          adminId: user.id,
          rejectionReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to reject' });
        return;
      }

      setPendingApprovals(pendingApprovals.filter((r) => r.id !== recordId));
      setTodayAttendance(
        todayAttendance.map((r) =>
          r.id === recordId
            ? { ...r, status: 'rejected', approvedBy: user.id, approvedAt: new Date().toISOString(), rejectionReason: reason }
            : r
        )
      );
      setActionFeedback({ type: 'success', message: 'Exception rejected' });
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/attendance?endpoint=export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setActionFeedback({ type: 'success', message: 'Export completed' });
      }
    } catch {
      setActionFeedback({ type: 'error', message: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  const openEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radiusMeters: location.radiusMeters.toString(),
    });
    setShowLocationDialog(true);
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: shift.gracePeriodMinutes.toString(),
      isGlobal: shift.isGlobal,
      employeeId: shift.employeeId || '',
    });
    setShowShiftDialog(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      email: u.email,
      password: '',
      name: u.name,
      role: u.role,
      employeeId: u.employeeId || '',
    });
    setShowUserDialog(true);
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ email: '', password: '', name: '', role: 'employee', employeeId: '' });
    setShowUserDialog(true);
  };

  const getDeviceName = (deviceName: string) => {
    if (deviceName.includes('Chrome')) return 'Chrome Browser';
    if (deviceName.includes('Safari')) return 'Safari Browser';
    if (deviceName.includes('Firefox')) return 'Firefox Browser';
    if (deviceName.includes('Edge')) return 'Edge Browser';
    return deviceName || 'Unknown Device';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Attendance Control</h1>
                <p className="text-xs text-slate-500">Admin Panel</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
              <Badge className="bg-indigo-100 text-indigo-800 ml-1">Admin</Badge>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-t border-slate-100">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Attendance
              </span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Management
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sessions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Active Sessions
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Feedback Banner */}
      {actionFeedback && (
        <div
          className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium flex-1">{actionFeedback.message}</p>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-current opacity-60 hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="px-6 py-6">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{users.length}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {users.filter(u => u.role === 'admin').length} admins, {users.filter(u => u.role === 'employee').length} employees
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600">{sessions.length}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {sessions.length === sessionsSummary.length ? 'All users on single device' : `${sessionsSummary.length} users with active sessions`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Clock-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{todayAttendance.length}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {todayAttendance.filter(r => r.status === 'on_time').length} on time
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-600">{pendingApprovals.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Awaiting your review</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Quick Overview</CardTitle>
                <CardDescription>System status and recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Security Status
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Single Device Policy</span>
                        <Badge className={sessions.length === sessionsSummary.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                          {sessions.length === sessionsSummary.length ? 'Active' : 'Issues'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {sessions.length === sessionsSummary.length
                          ? 'All users are following the single-device login policy'
                          : `${sessions.length - sessionsSummary.length} user(s) have multiple active sessions`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      System Info
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Locations</span>
                        <span className="font-medium">{locations.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Shift Schedules</span>
                        <span className="font-medium">{shifts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Today's Records</span>
                        <span className="font-medium">{todayAttendance.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Clock-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{todayAttendance.length}</p>
                  <p className="text-xs text-slate-500 mt-1">{todayAttendance.filter(r => r.status === 'on_time').length} on time</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-600">{pendingApprovals.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Awaiting your review</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Late Arrivals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-600">{todayAttendance.filter(r => r.status === 'pending_approval' || r.status === 'approved').length}</p>
                  <p className="text-xs text-slate-500 mt-1">Including approved</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Today's Attendance</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-48 pl-9 h-9 text-sm"
                      />
                    </div>
                    <Button variant="outline" onClick={handleExportCSV} disabled={exporting} className="h-9 gap-2">
                      <Download className="w-4 h-4" />
                      {exporting ? 'Exporting...' : 'Export'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100">
                        <TableHead className="bg-slate-50">Employee</TableHead>
                        <TableHead className="bg-slate-50">Clock In</TableHead>
                        <TableHead className="bg-slate-50">Clock Out</TableHead>
                        <TableHead className="bg-slate-50">Location</TableHead>
                        <TableHead className="bg-slate-50">Status</TableHead>
                        <TableHead className="bg-slate-50 w-10">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayAttendance
                        .filter(r => !searchQuery || r.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((record) => (
                          <TableRow key={record.id} className="border-slate-100 hover:bg-slate-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-medium">
                                  {record.userName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{record.userName}</p>
                                  <p className="text-xs text-slate-500">{record.userId}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-700">{formatTime(record.clockIn)}</TableCell>
                            <TableCell className="text-sm text-slate-700">{record.clockOut ? formatTime(record.clockOut) : '-'}</TableCell>
                            <TableCell className="text-sm text-slate-600">{record.locationName}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>
                              {record.status === 'pending_approval' && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleApprove(record.id)} className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded" title="Approve">
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => { const reason = prompt('Rejection reason:'); if (reason) handleReject(record.id, reason); }} className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded" title="Reject">
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      {todayAttendance.length === 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <Clock className="w-8 h-8" />
                              <p className="text-sm">No attendance records for today</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {pendingApprovals.length > 0 && (
              <Card className="bg-white border-slate-200 border-l-4 border-l-amber-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="w-5 h-5" />
                      Pending Approval Actions
                    </CardTitle>
                    <Badge className="bg-amber-100 text-amber-800">{pendingApprovals.length} pending</Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">Review late clock-ins and approve or reject with reason</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingApprovals.map((record) => (
                    <div key={record.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-medium">
                              {record.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{record.userName}</p>
                              <p className="text-xs text-slate-500">{formatTime(record.clockIn)} - {record.locationName}</p>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800">Late</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-slate-200 mb-3">
                        <p className="text-xs text-slate-500 mb-1">Reason for lateness:</p>
                        <p className="text-sm text-slate-700">{record.reason || 'No reason provided'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(record.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Exception
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-red-200 hover:bg-red-50 text-red-700" onClick={() => { const reason = prompt('Enter rejection reason:'); if (reason) handleReject(record.id, reason); }}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
                <p className="text-sm text-slate-500">Create, edit, and manage user accounts</p>
              </div>
              <Button onClick={openAddUser} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </div>

            {/* Users Table */}
            <Card className="bg-white border-slate-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100">
                        <TableHead className="bg-slate-50 w-10"></TableHead>
                        <TableHead className="bg-slate-50">User</TableHead>
                        <TableHead className="bg-slate-50">Email</TableHead>
                        <TableHead className="bg-slate-50">Role</TableHead>
                        <TableHead className="bg-slate-50">Employee ID</TableHead>
                        <TableHead className="bg-slate-50">Status</TableHead>
                        <TableHead className="bg-slate-50">Created</TableHead>
                        <TableHead className="bg-slate-50 w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(u => !searchUser || u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()))
                        .map((u) => (
                          <TableRow key={u.id} className="border-slate-100 hover:bg-slate-50">
                            <TableCell>
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm font-medium">
                                {u.name.charAt(0)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell className="text-slate-600">{u.email}</TableCell>
                            <TableCell>
                              <Badge className={u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}>
                                {u.role === 'admin' ? 'Admin' : 'Employee'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600">{u.employeeId || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                  className={`p-1 rounded ${u.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`}
                                  title={u.isActive ? 'Deactivate User' : 'Activate User'}
                                >
                                  {u.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                                <span className={`text-xs ${u.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{formatDate(u.createdAt)}</TableCell>
                            <TableCell className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEditUser(u)}
                                className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {!u.isActive && (
                                <button
                                  onClick={() => handleRemoveUserSessions(u.id)}
                                  className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                                  title="Remove Sessions"
                                >
                                  <Smartphone className="w-4 h-4" />
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      {users.length === 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="w-8 h-8" />
                              <p className="text-sm">No users found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Info box */}
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Admin-Only User Management</p>
                    <p className="text-xs text-indigo-700 mt-1">
                      Only administrators can create, edit, and manage user accounts. Deactivating a user will automatically remove all their active sessions, forcing them to log out. Each user can only be logged in from one device at a time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Active Sessions</h2>
                <p className="text-sm text-slate-500">View all active user sessions and enforce single-device policy</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">
                {sessions.length} active session(s)
              </Badge>
            </div>

            {/* Sessions Summary */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Session Overview</CardTitle>
                <CardDescription>Each user should only have one active session (single-device policy)</CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsSummary.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Smartphone className="w-10 h-10 mx-auto mb-3" />
                    <p>No active sessions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100">
                          <TableHead className="bg-slate-50">User</TableHead>
                          <TableHead className="bg-slate-50">Session Count</TableHead>
                          <TableHead className="bg-slate-50">Status</TableHead>
                          <TableHead className="bg-slate-50 w-20">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionsSummary.map((s) => {
                          const user = users.find(u => u.id === s.userId);
                          return (
                            <TableRow key={s.userId} className="border-slate-100 hover:bg-slate-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-medium">
                                    {user?.name.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <p>{user?.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={s.sessionCount > 1 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>
                                  {s.sessionCount} session(s)
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {s.sessionCount > 1 ? (
                                  <span className="text-red-600 text-sm">Multiple devices detected</span>
                                ) : (
                                  <span className="text-emerald-600 text-sm">Compliant</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                  onClick={() => handleRemoveUserSessions(s.userId)}
                                >
                                  <Smartphone className="w-4 h-4 mr-1" />
                                  Remove All
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Sessions Detail */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">All Active Sessions</CardTitle>
                <CardDescription>Detailed view of every active session</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {sessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Smartphone className="w-10 h-10 mx-auto mb-3" />
                    <p>No active sessions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100">
                          <TableHead className="bg-slate-50">User</TableHead>
                          <TableHead className="bg-slate-50">Device</TableHead>
                          <TableHead className="bg-slate-50">IP Address</TableHead>
                          <TableHead className="bg-slate-50">Created</TableHead>
                          <TableHead className="bg-slate-50">Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((session) => {
                          const user = users.find(u => u.id === session.userId);
                          return (
                            <TableRow key={session.token} className="border-slate-100 hover:bg-slate-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-medium">
                                    {user?.name.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <p>{user?.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{getDeviceName(session.deviceName)}</TableCell>
                              <TableCell className="text-sm text-slate-600 font-mono">{session.ipAddress}</TableCell>
                              <TableCell className="text-sm text-slate-500">{formatDate(session.createdAt)}</TableCell>
                              <TableCell className="text-sm text-slate-500">{formatDate(session.lastActive)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Policy Info */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Single Device Policy</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Each user account can only be logged in from one device at a time. When a user logs in from a new device, their previous session is automatically terminated. Admins can manually remove all sessions for a user from this page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Locations Management */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-base">Work Locations</CardTitle>
                  </div>
                  <Button size="sm" className="gap-1" onClick={() => setShowLocationDialog(true)}>
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {locations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No locations configured</p>
                    <p className="text-xs text-slate-400 mt-1">Add a work location to enable geo-fencing</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {locations.map((location) => (
                      <div key={location.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{location.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} | {location.radiusMeters}m radius
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditLocation(location)} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteLocation(location.id)} className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shift Settings */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-base">Shift Settings</CardTitle>
                  </div>
                  <Button size="sm" className="gap-1" onClick={() => setShowShiftDialog(true)}>
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {shifts.length === 0 ? (
                  <div className="p-6 text-center">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No shift configured</p>
                    <p className="text-xs text-slate-400 mt-1">Set up default working hours</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{shift.isGlobal ? 'Global Shift' : 'Employee Shift'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {shift.startTime} - {shift.endTime} | {shift.gracePeriodMinutes}min grace
                          </p>
                          {!shift.isGlobal && shift.employeeId && (
                            <p className="text-xs text-slate-400 mt-0.5">Employee: {shift.employeeId}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditShift(shift)} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteShift(shift.id)} className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add Work Location'}</DialogTitle>
            <DialogDescription>{editingLocation ? 'Update the location details' : 'Enter the coordinates and radius for the work location'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editingLocation ? handleUpdateLocation : handleAddLocation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input id="name" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} placeholder="HQ Office" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" value={locationForm.latitude} onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })} placeholder="30.0444" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" value={locationForm.longitude} onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })} placeholder="31.2357" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input id="radius" type="number" value={locationForm.radiusMeters} onChange={(e) => setLocationForm({ ...locationForm, radiusMeters: e.target.value })} placeholder="500" />
              <p className="text-xs text-slate-500">Maximum distance allowed for clock-in</p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => { setShowLocationDialog(false); setEditingLocation(null); setLocationForm({ name: '', latitude: '', longitude: '', radiusMeters: '' }); }} className="sm:flex-1">Cancel</Button>
              <Button type="submit" className="sm:flex-1 bg-indigo-600 hover:bg-indigo-700">{editingLocation ? 'Update' : 'Add Location'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift Schedule'}</DialogTitle>
            <DialogDescription>{editingShift ? 'Update the shift settings' : 'Configure working hours and grace period'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editingShift ? handleUpdateShift : handleAddShift} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gracePeriod">Grace Period (minutes)</Label>
              <Input id="gracePeriod" type="number" min="0" value={shiftForm.gracePeriodMinutes} onChange={(e) => setShiftForm({ ...shiftForm, gracePeriodMinutes: e.target.value })} placeholder="15" />
              <p className="text-xs text-slate-500">Time allowed after start time before marking as late</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isGlobal">Applies To</Label>
              <Select value={shiftForm.isGlobal ? 'global' : 'specific'} onValueChange={(value) => setShiftForm({ ...shiftForm, isGlobal: value === 'global' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">All Employees (Global)</SelectItem>
                  <SelectItem value="specific">Specific Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!shiftForm.isGlobal && (
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" value={shiftForm.employeeId} onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })} placeholder="EMP001" />
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => { setShowShiftDialog(false); setEditingShift(null); setShiftForm({ startTime: '09:00', endTime: '17:00', gracePeriodMinutes: '15', isGlobal: true, employeeId: '' }); }} className="sm:flex-1">Cancel</Button>
              <Button type="submit" className="sm:flex-1 bg-indigo-600 hover:bg-indigo-700">{editingShift ? 'Update' : 'Add Shift'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>{editingUser ? 'Update user details and credentials' : 'Create a new user account (admin only)'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Full Name *</Label>
              <Input id="userName" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email Address *</Label>
              <Input id="userEmail" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="user@company.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userPassword">Password {editingUser ? '(Leave blank to keep current)' : '*'}</Label>
              <Input id="userPassword" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder={editingUser ? '••••••••' : 'Enter password'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userRole">Role</Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value as 'admin' | 'employee' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmployeeId">Employee ID (optional)</Label>
              <Input id="userEmployeeId" value={userForm.employeeId} onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })} placeholder="EMP001" />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => { setShowUserDialog(false); setEditingUser(null); setUserForm({ email: '', password: '', name: '', role: 'employee', employeeId: '' }); }} className="sm:flex-1">Cancel</Button>
              <Button type="submit" className="sm:flex-1 bg-indigo-600 hover:bg-indigo-700">{editingUser ? 'Update User' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
