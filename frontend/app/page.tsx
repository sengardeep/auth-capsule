'use client';

/**
 * Root page — redirects to /dashboard if a token exists, otherwise to /login.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(accessToken ? '/dashboard' : '/login');
    }
  }, [accessToken, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Redirecting…
    </div>
  );
}
