'use client';

/**
 * Reusable auth form card wrapper.
 * Renders a centred card with a title, optional message/error banner, and children.
 */

interface AuthFormProps {
  title: string;
  error?: string | null;
  success?: string | null;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  children: React.ReactNode;
  submitLabel: string;
  footer?: React.ReactNode;
}

export default function AuthForm({
  title,
  error,
  success,
  onSubmit,
  isLoading,
  children,
  submitLabel,
  footer,
}: AuthFormProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Please wait…' : submitLabel}
          </button>
        </form>

        {footer && <div className="mt-5 text-sm text-gray-500 text-center">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, ...rest }: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        {...rest}
      />
    </div>
  );
}
