'use client';

/**
 * /verify-email page
 * Reads email from the query string (set by the register page).
 * User enters the 6-digit OTP and calls GET /verify-email.
 * On success, redirects to /login.
 */

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthForm, { Input } from '@/components/AuthForm';
import { verifyEmail } from '@/lib/api';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await verifyEmail(email, otp);
      setSuccess(res.message);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthForm
      title="Verify your email"
      error={error}
      success={success}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel="Verify Email"
      footer={
        <>
          Wrong account?{' '}
          <Link href="/register" className="text-gray-800 underline">
            Register again
          </Link>
        </>
      }
    >
      <p className="text-sm text-gray-500 mb-2">
        We sent a one-time password to your email. Enter it below.
      </p>

      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <Input
        id="otp"
        label="OTP code"
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
        placeholder="123456"
        maxLength={6}
        inputMode="numeric"
      />
    </AuthForm>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
