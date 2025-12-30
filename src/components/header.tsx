'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🔥</span>
          <span>Евакуация</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/check"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Нова проверка
          </Link>
          <Link
            href="/projects"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Проекти
          </Link>
          <div className="flex items-center gap-2 ml-4 pl-4 border-l">
            <span className="text-sm text-gray-500">
              {session.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Изход
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
