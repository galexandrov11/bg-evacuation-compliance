/**
 * Results Page
 * Displays evaluation results
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { EvaluationResult } from '@/lib/engine';
import { SummaryPanel } from '@/components/results/summary-panel';
import { FindingsList } from '@/components/results/findings-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, RefreshCw, FileText } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    // Load result from localStorage
    const storedResult = localStorage.getItem('flames-last-result');
    const storedProject = localStorage.getItem('flames-last-project');

    if (storedResult) {
      setResult(JSON.parse(storedResult));
    }

    if (storedProject) {
      const project = JSON.parse(storedProject);
      setProjectName(project.name || 'Без име');
    }
  }, []);

  const handleExportJSON = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flames-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Няма резултати</h2>
          <p className="mt-2 text-sm text-gray-500">
            Първо направете проверка за съответствие
          </p>
          <Link href="/check">
            <Button className="mt-4 gap-2 bg-orange-600 hover:bg-orange-700">
              <RefreshCw className="h-4 w-4" />
              Нова проверка
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/check">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Резултати от проверката</h1>
                <p className="text-sm text-gray-500">{projectName}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportJSON} className="gap-2">
                <Download className="h-4 w-4" />
                Експорт JSON
              </Button>
              <Link href="/check">
                <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <RefreshCw className="h-4 w-4" />
                  Нова проверка
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">Обобщение</TabsTrigger>
            <TabsTrigger value="findings">
              Всички резултати ({result.findings.length})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Неизпълнени ({result.summary.failed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <SummaryPanel
              summary={result.summary}
              datasetVersion={result.dataset_version}
              evaluatedAt={result.evaluated_at}
            />

            {/* Quick list of failures */}
            {result.summary.failed > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Неизпълнени изисквания</h3>
                <FindingsList
                  findings={result.findings.filter((f) => f.status === 'FAIL')}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="findings">
            <FindingsList findings={result.findings} />
          </TabsContent>

          <TabsContent value="failed">
            <FindingsList
              findings={result.findings.filter((f) => f.status === 'FAIL')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
