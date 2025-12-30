/**
 * Admin Page
 * Dataset management and viewing
 */

'use client';

import Link from 'next/link';
import { loadDataset, getDatasetMeta } from '@/lib/datasets/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Database, Download, Flame } from 'lucide-react';

export default function AdminPage() {
  const dataset = loadDataset();
  const meta = getDatasetMeta();

  const handleExportDataset = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset-${meta.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-600" />
              <span className="text-lg font-bold">Админ панел</span>
            </div>
          </div>
          <Button onClick={handleExportDataset} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Експорт JSON
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Dataset info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Набор от данни
            </CardTitle>
            <CardDescription>
              Текуща версия на нормативните изисквания
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Наредба</p>
                <p className="font-medium">{meta.ordinance}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Версия</p>
                <p className="font-medium">{meta.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">В сила от</p>
                <p className="font-medium">{meta.effective_from}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Източник</p>
                <p className="font-medium truncate">{meta.source}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables */}
        <Tabs defaultValue="occupant_load" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="occupant_load">Натовареност (Табл. 8)</TabsTrigger>
            <TabsTrigger value="min_exits">Мин. изходи</TabsTrigger>
            <TabsTrigger value="travel_distance">Евак. разстояния</TabsTrigger>
            <TabsTrigger value="dead_ends">Задънени коридори</TabsTrigger>
            <TabsTrigger value="min_widths">Мин. широчини</TabsTrigger>
            <TabsTrigger value="functional">Функц. класове</TabsTrigger>
          </TabsList>

          {/* Occupant Load Table */}
          <TabsContent value="occupant_load">
            <Card>
              <CardHeader>
                <CardTitle>Таблица 8: Натовареност на помещенията</CardTitle>
                <CardDescription>
                  Площ на човек в м² за различни типове помещения по чл. 36
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Тип помещение</TableHead>
                        <TableHead>Функц. клас</TableHead>
                        <TableHead className="text-right">м²/човек</TableHead>
                        <TableHead>Бележки</TableHead>
                        <TableHead>Член</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataset.tables.occupant_load_table_8.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium max-w-[250px]">{entry.space_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.functional_class || 'Всички'}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.area_per_person_m2}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-[200px]">
                            {entry.notes || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {entry.article_ref}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Min Exits Table */}
          <TabsContent value="min_exits">
            <Card>
              <CardHeader>
                <CardTitle>Минимален брой изходи</CardTitle>
                <CardDescription>
                  Изисквания за брой евакуационни изходи по брой хора
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Функц. група</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead className="text-right">Мин. хора</TableHead>
                        <TableHead className="text-right">Макс. хора</TableHead>
                        <TableHead className="text-right">Мин. изходи</TableHead>
                        <TableHead className="text-right">Мин. шир. (м)</TableHead>
                        <TableHead>Член</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataset.tables.min_exits_by_occupants.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">{entry.functional_class_group}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{entry.category || '-'}</TableCell>
                          <TableCell className="text-right font-mono">{entry.min_occupants}</TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.max_occupants ?? '∞'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {entry.min_exits}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.min_width_m ?? '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">{entry.article_ref}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Travel Distance Table */}
          <TabsContent value="travel_distance">
            <Card>
              <CardHeader>
                <CardTitle>Максимални евакуационни разстояния</CardTitle>
                <CardDescription>
                  Лимити в метри по контекст и тип евакуация
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Контекст</TableHead>
                        <TableHead>Тип евакуация</TableHead>
                        <TableHead className="text-right">Макс. разст. (м)</TableHead>
                        <TableHead>Условия</TableHead>
                        <TableHead>Член</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataset.tables.max_travel_distance.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{entry.context}</TableCell>
                          <TableCell>
                            {entry.evacuation_type === 'single_direction'
                              ? 'Еднопосочна'
                              : 'Многопосочна'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {entry.max_distance_m}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-[200px]">
                            {entry.conditions || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">{entry.article_ref}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dead End Limits */}
          <TabsContent value="dead_ends">
            <Card>
              <CardHeader>
                <CardTitle>Лимити за задънени коридори</CardTitle>
                <CardDescription>
                  Максимална дължина на задънени коридори
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Контекст</TableHead>
                        <TableHead className="text-right">Макс. дължина (м)</TableHead>
                        <TableHead>Изисква 2 изхода</TableHead>
                        <TableHead>Член</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataset.tables.dead_end_limits.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{entry.context}</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {entry.max_distance_m}
                          </TableCell>
                          <TableCell>
                            {entry.requires_two_exits ? (
                              <Badge variant="secondary">Да</Badge>
                            ) : (
                              <span className="text-gray-400">Не</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">{entry.article_ref}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Min Widths */}
          <TabsContent value="min_widths">
            <Card>
              <CardHeader>
                <CardTitle>Минимални широчини</CardTitle>
                <CardDescription>
                  Изисквания за широчина на евакуационни елементи
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Елемент</TableHead>
                        <TableHead>Контекст</TableHead>
                        <TableHead className="text-right">Мин. шир. (м)</TableHead>
                        <TableHead>Бележки</TableHead>
                        <TableHead>Член</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataset.tables.min_widths.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{entry.element_type}</TableCell>
                          <TableCell className="text-sm max-w-[200px]">{entry.context}</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {entry.min_width_m ?? '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-[150px]">
                            {entry.notes || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">{entry.article_ref}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Functional Classes */}
          <TabsContent value="functional">
            <Card>
              <CardHeader>
                <CardTitle>Функционални класове</CardTitle>
                <CardDescription>
                  Описания за всеки функционален клас
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Клас</TableHead>
                        <TableHead>Име (БГ)</TableHead>
                        <TableHead>Име (EN)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataset.tables.functional_classes.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">{entry.code}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{entry.name}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {entry.name_en}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
