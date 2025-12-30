/**
 * Home Page
 * Landing page for the Flames Evacuation Compliance Assistant
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Flame,
  CheckCircle2,
  FileText,
  Shield,
  ArrowRight,
  Building2,
  DoorOpen,
  Route,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Flames</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/check" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Нова проверка
            </Link>
            <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Админ
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-100 rounded-full">
            <Flame className="h-16 w-16 text-orange-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Асистент за евакуационно съответствие
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Автоматична проверка за съответствие с <strong>Наредба № Iз-1971</strong> за
          строително-технически правила и норми за осигуряване на безопасност при пожар
        </p>
        <Link href="/check">
          <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6">
            Започни проверка
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
          Какво проверява системата
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Building2 className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Население на помещения</CardTitle>
              <CardDescription>
                Изчисляване на броя хора по Таблица 8 въз основа на функционален клас и площ
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <DoorOpen className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Брой и ширина на изходи</CardTitle>
              <CardDescription>
                Проверка за минимален брой евакуационни изходи и обща широчина
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Route className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Евакуационни разстояния</CardTitle>
              <CardDescription>
                Проверка на дължини на евакуационни пътища и задънени коридори
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Как работи
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Въведете данни</h3>
              <p className="text-sm text-gray-600">
                Попълнете информация за сградата, помещенията, изходите и стълбищата
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Автоматична проверка</h3>
              <p className="text-sm text-gray-600">
                Системата анализира данните спрямо изискванията на наредбата
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Получете резултати</h3>
              <p className="text-sm text-gray-600">
                Вижте детайлен отчет с изпълнени и неизпълнени изисквания
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">Експортирайте</h3>
              <p className="text-sm text-gray-600">
                Свалете отчета в JSON формат за документация
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-green-800">Детерминистични резултати</CardTitle>
              <CardDescription className="text-green-700">
                Еднакви входни данни винаги дават еднакви резултати
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-blue-800">Правни препратки</CardTitle>
              <CardDescription className="text-blue-700">
                Всяка констатация съдържа цитат от съответния член на наредбата
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <Shield className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-purple-800">Версионирани данни</CardTitle>
              <CardDescription className="text-purple-700">
                Всички изисквания се зареждат от версионирани наборни данни
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange-600 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готови ли сте да проверите съответствието?
          </h2>
          <p className="text-orange-100 mb-8 max-w-xl mx-auto">
            Започнете безплатна проверка на вашата сграда сега
          </p>
          <Link href="/check">
            <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6">
              Започни проверка
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="font-bold">Flames</span>
            </div>
            <p className="text-sm text-gray-400">
              Базирано на Наредба № Iз-1971 за СТПНОБ при пожар
            </p>
            <p className="text-sm text-gray-400">
              Версия на данните: iz-1971-v2024-01
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
