'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react';

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

export default function ClockPage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'clocked_in' | 'clocked_out' | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [showLateForm, setShowLateForm] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [shiftStart, setShiftStart] = useState<string>('09:00');
  const geolocationRef = useRef<GeolocationPosition | null>(null);
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
      checkTodayClockStatus();
      fetchShiftSettings();
    }
  }, [user]);

  const fetchShiftSettings = async () => {
    try {
      const res = await fetch('/api/shifts');
      if (res.ok) {
        const data = await res.json();
        if (data.shifts && data.shifts.length > 0) {
          setShiftStart(data.shifts[0].startTime);
        }
      }
    } catch {
      // Use default
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/attendance/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setAttendanceHistory(data.records || []);
        router.push('/employee/history');
      }
    } catch {
      console.error('Failed to fetch attendance history');
    }
  };

  const checkTodayClockStatus = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/attendance?endpoint=today');
      if (res.ok) {
        const data = await res.json();
        const todayRecords = data.records || [];
        const userRecord = todayRecords.find((r: AttendanceRecord) => r.userId === user.id);

        if (userRecord) {
          setTodayRecord(userRecord);
          setCurrentStatus(userRecord.clockOut ? 'clocked_out' : 'clocked_in');
        } else {
          setCurrentStatus(null);
        }
      }
    } catch {
      console.error('Failed to check clock status');
    }
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setHasLocationPermission(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        geolocationRef.current = position;
        setHasLocationPermission(true);
        setLocationError(null);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enable location access.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Location information unavailable.');
        } else if (error.code === error.TIMEOUT) {
          setLocationError('Location request timed out.');
        } else {
          setLocationError('An unknown error occurred.');
        }
        setHasLocationPermission(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  };

  const checkLocation = async (latitude: number, longitude: number) => {
    setIsCheckingLocation(true);
    setOutOfBounds(false);
    setLocationError(null);

    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        const locations = data.locations || [];

        if (locations.length === 0) {
          setLocationError('No work locations configured. Please contact admin.');
          setIsCheckingLocation(false);
          return false;
        }

        const location = locations[0];
        const distance = calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        );

        const isWithinRange = distance <= location.radiusMeters;

        if (!isWithinRange) {
          setOutOfBounds(true);
          setLocationError(`Out of Bounds: You are ${Math.round(distance)} meters away from the allowed area.`);
          setIsCheckingLocation(false);
          return false;
        }

        setIsCheckingLocation(false);
        return true;
      }
    } catch {
      setLocationError('Failed to verify location');
      setIsCheckingLocation(false);
      return false;
    }

    setIsCheckingLocation(false);
    return false;
  };

  const isLate = () => {
    if (!shiftStart) return false;

    const [hours, minutes] = shiftStart.split(':').map(Number);
    const shiftStartMinutes = hours * 60 + minutes;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const gracePeriod = 15;

    return currentMinutes > shiftStartMinutes + gracePeriod;
  };

  const handleClockIn = async () => {
    if (!user || !geolocationRef.current) {
      setLocationError('Unable to get location. Please try again.');
      return;
    }

    const { latitude, longitude } = geolocationRef.current.coords;
    const isWithinBounds = await checkLocation(latitude, longitude);
    if (!isWithinBounds) {
      return;
    }

    if (isLate()) {
      setShowLateForm(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'clock-in',
          userId: user.id,
          userName: user.name,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to clock in' });
        return;
      }

      setCurrentStatus('clocked_in');
      setActionFeedback({ type: 'success', message: 'Successfully clocked in!' });
      checkTodayClockStatus();
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'clock-out',
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to clock out' });
        return;
      }

      setCurrentStatus('clocked_out');
      setActionFeedback({ type: 'success', message: 'Successfully clocked out!' });
      checkTodayClockStatus();
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLateSubmit = async () => {
    if (!user || !geolocationRef.current || !lateReason.trim()) {
      return;
    }

    const { latitude, longitude } = geolocationRef.current.coords;

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'clock-in',
          userId: user.id,
          userName: user.name,
          latitude,
          longitude,
          reason: lateReason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to clock in' });
        return;
      }

      setShowLateForm(false);
      setLateReason('');
      setActionFeedback({ type: 'success', message: 'Clocked in with late reason submitted for approval.' });
      checkTodayClockStatus();
    } catch {
      setActionFeedback({ type: 'error', message: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationCheck = () => {
    requestLocationPermission();
    setTimeout(() => {
      if (geolocationRef.current) {
        checkLocation(
          geolocationRef.current.coords.latitude,
          geolocationRef.current.coords.longitude
        );
      }
    }, 500);
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Clock In / Out</h1>
              <p className="text-xs text-slate-500">Location verification required</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm text-slate-600">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-6">
        {/* Action Feedback */}
        {actionFeedback && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
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
            <p className="text-sm font-medium">{actionFeedback.message}</p>
            <button
              onClick={() => setActionFeedback(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Location Status Card */}
        <Card className="bg-white border-slate-200 mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Location Status
              </CardTitle>
              {hasLocationPermission === false && (
                <Badge variant="secondary" className="text-xs">
                  Permission Denied
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              Tap to check your current location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Location Error</p>
                    <p className="text-xs mt-1">{locationError}</p>
                  </div>
                </div>
              )}

              {outOfBounds && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Out of Bounds</p>
                    <p className="text-xs mt-1">{`You are ${Math.round(
                      calculateDistance(
                        geolocationRef.current?.coords.latitude || 0,
                        geolocationRef.current?.coords.longitude || 0,
                        30.0444,
                        31.2357
                      )
                    )}m away from HQ`}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleLocationCheck}
                disabled={isCheckingLocation || hasLocationPermission === null}
                variant="outline"
                className="w-full justify-start gap-2 border-slate-300 hover:bg-slate-50"
              >
                {isCheckingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking location...
                  </>
                ) : hasLocationPermission === null ? (
                  <>
                    <MapPin className="w-4 h-4" />
                    Request Location Access
                  </>
                ) : geolocationRef.current ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">
                      {Math.round(
                        calculateDistance(
                          geolocationRef.current.coords.latitude,
                          geolocationRef.current.coords.longitude,
                          30.0444,
                          31.2357
                        )
                      )}m from HQ
                    </span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Check Location
                  </>
                )}
              </Button>

              {geolocationRef.current && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Your coordinates:</p>
                  <p className="text-xs text-slate-700 font-mono mt-1">
                    Lat: {geolocationRef.current.coords.latitude.toFixed(6)} | Lng:{' '}
                    {geolocationRef.current.coords.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Late Form Modal */}
        {showLateForm && (
          <Card className="bg-white border-slate-200 mb-6 border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                Running Late?
              </CardTitle>
              <CardDescription className="text-xs">
                Please provide a reason for your late arrival
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lateReason" className="text-sm">
                  Reason for Lateness *
                </Label>
                <Textarea
                  id="lateReason"
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  placeholder="I was delayed due to..."
                  className="min-h-[100px] resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLateSubmit}
                  disabled={submitting || !lateReason.trim()}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit & Clock In'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clock In/Out Card */}
        <Card className="bg-white border-slate-200 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Time Clock
            </CardTitle>
            {currentStatus && (
              <CardDescription className="text-xs mt-1">
                {currentStatus === 'clocked_in' ? 'You are currently clocked in' : 'You are currently clocked out'}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {currentStatus === 'clocked_out' ? (
                <Button
                  onClick={handleClockIn}
                  disabled={isCheckingLocation || submitting}
                  className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold shadow-lg shadow-emerald-200"
                >
                  {isCheckingLocation ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 mr-2" />
                      Clock In
                    </>
                  )}
                </Button>
              ) : currentStatus === 'clocked_in' ? (
                <Button
                  onClick={handleClockOut}
                  disabled={submitting}
                  className="flex-1 h-16 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold shadow-lg shadow-red-200"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Clocking out...
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 mr-2" />
                      Clock Out
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleClockIn}
                  disabled={isCheckingLocation || submitting}
                  className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold shadow-lg shadow-emerald-200"
                >
                  {isCheckingLocation ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 mr-2" />
                      Clock In
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Expected start:</span>
              </div>
              <span className="font-medium text-slate-900">
                {formatTime(new Date().toDateString().concat('T').concat(shiftStart).concat(':00'))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Record Card */}
        {todayRecord && (
          <Card className="bg-white border-slate-200 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Clock In</span>
                  <span className="font-medium text-slate-900">
                    {formatTime(todayRecord.clockIn)}
                  </span>
                </div>
                {todayRecord.clockOut && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Clock Out</span>
                    <span className="font-medium text-slate-900">
                      {formatTime(todayRecord.clockOut)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Location</span>
                  <span className="font-medium text-slate-900">
                    {todayRecord.locationName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status</span>
                  <Badge className={getStatusColor(todayRecord.status)}>
                    {getStatusLabel(todayRecord.status)}
                  </Badge>
                </div>
                {todayRecord.reason && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Reason:</p>
                    <p className="text-sm text-slate-700">{todayRecord.reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-4">
          <div className="max-w-md mx-auto flex justify-around">
            <button
              onClick={() => router.push('/employee')}
              className="flex flex-col items-center gap-1 px-4 py-2 text-indigo-600"
            >
              <Clock className="w-5 h-5" />
              <span className="text-xs font-medium">Back</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
