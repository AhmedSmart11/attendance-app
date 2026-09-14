'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
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

export default function HistoryPage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AttendanceRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
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
    if (user) {
      fetchAttendanceHistory();
    }
  }, [user]);

  const fetchAttendanceHistory = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'employee-attendance',
          userId: user.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const records = data.records || [];
        setAttendanceHistory(records);
        setFilteredHistory(records);
      }
    } catch {
      console.error('Failed to fetch attendance history');
    }
  };

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredHistory(attendanceHistory);
    } else {
      setFilteredHistory(attendanceHistory.filter(r => r.status === filterStatus));
    }
  }, [filterStatus, attendanceHistory]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'bg-emerald-100 text-emerald-800';
      case 'late':
      case 'pending_approval':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'On Time';
      case 'late':
        return 'Late';
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_time':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending_approval':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Attendance History</h1>
                <p className="text-xs text-slate-500">Your records for this month</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm text-slate-600">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('on_time')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'on_time'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            On Time
          </button>
          <button
            onClick={() => setFilterStatus('pending_approval')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'pending_approval'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* History List */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {attendanceHistory.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Attendance Records</h3>
              <p className="text-slate-500">
                Your clock-in/out history will appear here once you start using the system.
              </p>
            </CardContent>
          </Card>
        ) : filteredHistory.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Records Found</h3>
              <p className="text-slate-500">
                No attendance records match the selected filter.
              </p>
              <button
                onClick={() => setFilterStatus('all')}
                className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm"
              >
                Show all records
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((record, index) => (
              <Card
                key={record.id}
                className="bg-white border-slate-200 mb-3"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                        {getStatusIcon(record.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-slate-900">
                            {formatDate(record.clockIn)}
                          </h3>
                          <Badge className={getStatusColor(record.status)}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatTime(record.clockIn)}
                          {record.clockOut && ` - ${formatTime(record.clockOut)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-slate-700 font-medium">{record.locationName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="text-slate-700 font-medium">
                        {record.clockOut
                          ? calculateDuration(record.clockIn, record.clockOut)
                          : 'Still clocked in'}
                      </p>
                    </div>
                  </div>

                  {record.reason && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Reason</p>
                          <p className="text-sm text-slate-700">{record.reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {record.status === 'pending_approval' && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 font-medium">Awaiting admin approval</span>
                      </div>
                    </div>
                  )}

                  {record.status === 'approved' && record.approvedBy && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">
                          Approved by admin on {formatDate(record.approvedAt || '')}
                        </span>
                      </div>
                    </div>
                  )}

                  {record.status === 'rejected' && record.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Rejection Reason</p>
                          <p className="text-sm text-red-700">{record.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-4 mt-6">
          <div className="max-w-2xl mx-auto flex justify-between">
            <button
              onClick={() => router.push('/employee')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600"
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Clock</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}

const calculateDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};
