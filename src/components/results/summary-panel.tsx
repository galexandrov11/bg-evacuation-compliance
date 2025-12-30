/**
 * Summary Panel
 * Displays evaluation summary statistics
 */

'use client';

import type { EvaluationSummary } from '@/lib/engine';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryPanelProps {
  summary: EvaluationSummary;
  datasetVersion: string;
  evaluatedAt: string;
}

export function SummaryPanel({ summary, datasetVersion, evaluatedAt }: SummaryPanelProps) {
  const passRate = summary.total_rules > 0
    ? Math.round((summary.passed / summary.total_rules) * 100)
    : 0;

  const isCompliant = summary.blockers === 0 && summary.failed === 0;

  return (
    <div className="space-y-4">
      {/* Overall status */}
      <Card className={cn(
        'border-2',
        isCompliant ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      )}>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            {isCompliant ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
            <div>
              <h2 className={cn(
                'text-2xl font-bold',
                isCompliant ? 'text-green-800' : 'text-red-800'
              )}>
                {isCompliant ? 'Съответствие' : 'Несъответствие'}
              </h2>
              <p className={cn(
                'text-sm',
                isCompliant ? 'text-green-600' : 'text-red-600'
              )}>
                {isCompliant
                  ? 'Всички изисквания са изпълнени'
                  : `${summary.failed} неизпълнени изисквания, ${summary.blockers} блокиращи`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{summary.total_rules}</p>
            <p className="text-sm text-gray-500">Общо правила</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-3xl font-bold text-green-700">{summary.passed}</p>
            </div>
            <p className="text-sm text-green-600">Изпълнени</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-3xl font-bold text-red-700">{summary.failed}</p>
            </div>
            <p className="text-sm text-red-600">Неизпълнени</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-3xl font-bold text-yellow-700">{summary.review}</p>
            </div>
            <p className="text-sm text-yellow-600">За преглед</p>
          </CardContent>
        </Card>

        <Card className="bg-red-100 border-red-300">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Ban className="h-5 w-5 text-red-700" />
              <p className="text-3xl font-bold text-red-800">{summary.blockers}</p>
            </div>
            <p className="text-sm text-red-700">Блокиращи</p>
          </CardContent>
        </Card>
      </div>

      {/* Pass rate bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Степен на съответствие</span>
            <span className="text-sm font-bold">{passRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={cn(
                'h-3 rounded-full transition-all',
                passRate >= 80 ? 'bg-green-500' :
                passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${passRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <span>
          <strong>Набор от данни:</strong> {datasetVersion}
        </span>
        <span>
          <strong>Оценено на:</strong> {new Date(evaluatedAt).toLocaleString('bg-BG')}
        </span>
      </div>
    </div>
  );
}
