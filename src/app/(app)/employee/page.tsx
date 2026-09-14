'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeDashboard() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
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

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Employee Dashboard</h1>
        <p className="text-slate-500 mb-6">Welcome, {user?.name}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/employee/clock')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Clock In / Out
          </button>
          <button
            onClick={() => router.push('/employee/history')}
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
