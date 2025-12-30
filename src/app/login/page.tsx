'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      if (isRegister) {
        // Register new user
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Registration failed');
        }

        // Auto-login after registration
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error('Login failed after registration');
        }

        router.push('/');
        router.refresh();
      } else {
        // Login existing user
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Invalid email or password');
        }

        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-4xl">🔥</div>
          <CardTitle>{isRegister ? 'Регистрация' : 'Вход'}</CardTitle>
          <CardDescription>
            {isRegister
              ? 'Създайте акаунт за достъп до системата'
              : 'Влезте във вашия акаунт'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Име (незадължително)</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Вашето име"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? 'Зареждане...'
                : isRegister
                  ? 'Регистрация'
                  : 'Вход'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isRegister ? (
              <>
                Вече имате акаунт?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-orange-600 hover:underline"
                >
                  Влезте
                </button>
              </>
            ) : (
              <>
                Нямате акаунт?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-orange-600 hover:underline"
                >
                  Регистрирайте се
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
