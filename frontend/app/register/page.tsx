'use client';

/**
 * /register page
 * Calls POST /register. On success, redirects to /verify-email with email in query string.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthForm, { Input } from '@/components/AuthForm';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await register(username, email, password);
      setSuccess(res.message + ' — check your email for the OTP.');
      // Redirect after a short delay so user can read the message
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthForm
      title="Create an account"
      error={error}
      success={success}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel="Register"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-gray-800 underline">
            Login
          </Link>
        </>
      }
    >
      <Input
        id="username"
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
      />
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
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
