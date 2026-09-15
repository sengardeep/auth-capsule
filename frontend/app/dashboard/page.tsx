'use client';

/**
 * /dashboard page — protected page.
 * Shows user info fetched via GET /get-me.
 * Provides buttons for:
 *   - Refresh Token  (GET /refresh-token)
 *   - Logout         (GET /logout)
 *   - Logout All     (GET /logout-all)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, isLoading, logout, logoutAll, refreshToken } = useAuth();

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace('/login');
    }
  }, [isLoading, accessToken, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  async function run(fn: () => Promise<void>, successMsg: string, redirect?: string) {
    setActionMsg(null);
    setActionError(null);
    setIsBusy(true);
    try {
      await fn();
      setActionMsg(successMsg);
      if (redirect) {
        setTimeout(() => router.push(redirect), 1000);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
          <h1 className="text-xl font-semibold text-gray-800 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-400">You are logged in.</p>
        </div>

        {/* User Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Your Account
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Username</span>
              <span className="text-gray-800 font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800 font-medium">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Token Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Access Token
          </h2>
          <p className="text-xs text-gray-400 break-all font-mono bg-gray-50 border border-gray-100 rounded p-2">
            {accessToken}
          </p>
        </div>

        {/* Feedback */}
        {actionMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
            {actionMsg}
          </div>
        )}
        {actionError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {actionError}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
            Actions
          </h2>

          {/* Refresh Token */}
          <button
            disabled={isBusy}
            onClick={() => run(refreshToken, 'Access token refreshed!')}
            className="w-full py-2 px-4 text-sm font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Refresh Token
          </button>

          {/* Logout (current session) */}
          <button
            disabled={isBusy}
            onClick={() => run(logout, 'Logged out.', '/login')}
            className="w-full py-2 px-4 text-sm font-medium rounded border border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Logout (this device)
          </button>

          {/* Logout All */}
          <button
            disabled={isBusy}
            onClick={() => run(logoutAll, 'Logged out from all devices.', '/login')}
            className="w-full py-2 px-4 text-sm font-medium rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Logout All Devices
          </button>
        </div>
      </div>
    </div>
  );
}
