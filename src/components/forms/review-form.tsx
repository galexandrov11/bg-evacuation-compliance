/**
 * Review Form
 * Step 6: Review all data and run compliance check
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore, getProjectFromStore, WIZARD_STEPS } from '@/store/wizard-store';
import { loadDataset } from '@/lib/datasets/loader';
import { evaluate, validateContext } from '@/lib/engine';
import type { EvaluationResult } from '@/lib/engine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle2,
  Building2,
  DoorOpen,
  Route,
  Layers,
  Play,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export function ReviewForm() {
  const router = useRouter();
  const store = useWizardStore();
  const { building, spaces, exits, routes, stairs, stepsCompleted, markStepComplete } = store;
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Check which steps are complete
  const incompleteSteps = WIZARD_STEPS.filter(
    (step) => step.id !== 'review' && !stepsCompleted[step.id]
  );

  const canEvaluate = building && spaces.length > 0 && exits.length > 0;

  const handleEvaluate = async () => {
    if (!canEvaluate) return;

    setIsEvaluating(true);
    setError(null);

    try {
      // Build project from store state
      const project = getProjectFromStore(store);

      // Load dataset
      const dataset = loadDataset();

      // Validate context
      const validation = validateContext({
        project,
        datasets: dataset,
      });

      if (!validation.valid) {
        setError(validation.errors.join('\n'));
        setIsEvaluating(false);
        return;
      }

      // Run evaluation
      const evaluationResult = evaluate({
        project,
        datasets: dataset,
      });

      setResult(evaluationResult);
      markStepComplete('review');

      // Store result in localStorage for results page
      localStorage.setItem('flames-last-result', JSON.stringify(evaluationResult));
      localStorage.setItem('flames-last-project', JSON.stringify(project));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Възникна грешка при оценката');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleViewResults = () => {
    router.push('/results');
  };

  return (
    <div className="space-y-6">
      {/* Validation warnings */}
      {incompleteSteps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Непълни стъпки</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Следните стъпки не са завършени:{' '}
                {incompleteSteps.map((s) => s.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Сграда
            </CardTitle>
          </CardHeader>
          <CardContent>
            {building ? (
              <div>
                <p className="font-semibold">{building.name}</p>
                <p className="text-sm text-gray-500">
                  {building.functional_class} / {building.height_category}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Не е въведена</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Помещения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{spaces.length}</p>
            <p className="text-sm text-gray-500">
              {spaces.reduce((sum, s) => sum + s.area_m2, 0).toFixed(0)} м² общо
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Изходи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{exits.length}</p>
            <p className="text-sm text-gray-500">
              {exits.reduce((sum, e) => sum + e.width_m, 0).toFixed(2)} м общо
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Стълбища
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stairs.length}</p>
            <p className="text-sm text-gray-500">
              {stairs.reduce((sum, s) => sum + s.serves_floors.length, 0)} етажа общо
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed summary */}
      <Card>
        <CardHeader>
          <CardTitle>Обобщение на данните</CardTitle>
          <CardDescription>
            Преглед на въведената информация преди проверката
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Building details */}
          {building && (
            <div>
              <h4 className="font-medium mb-2">Сграда</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-gray-500">Име:</span> {building.name}</p>
                <p><span className="text-gray-500">Функционален клас:</span> {building.functional_class}</p>
                <p><span className="text-gray-500">Височина:</span> {building.height_category}</p>
                <div className="flex gap-2 mt-2">
                  {building.has_sprinklers && <Badge variant="secondary">Спринклери</Badge>}
                  {building.has_smoke_control && <Badge variant="secondary">Димоотвеждане</Badge>}
                  {building.has_fire_alarm && <Badge variant="secondary">ПИС</Badge>}
                </div>
              </div>
            </div>
          )}

          {/* Spaces summary */}
          {spaces.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Помещения ({spaces.length})</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {spaces.slice(0, 6).map((space) => (
                    <div key={space.id} className="flex justify-between">
                      <span>{space.name}</span>
                      <span className="text-gray-500">{space.area_m2} м²</span>
                    </div>
                  ))}
                  {spaces.length > 6 && (
                    <p className="col-span-2 text-gray-500">... и още {spaces.length - 6}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Exits summary */}
          {exits.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Изходи ({exits.length})</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {exits.map((exit) => (
                    <div key={exit.id} className="flex justify-between">
                      <span>{exit.name}</span>
                      <span className="text-gray-500">{exit.width_m} м</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Routes summary */}
          {routes.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Маршрути ({routes.length})</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p>{routes.length} евакуационни маршрута дефинирани</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Грешка при валидация</h4>
              <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      {result && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              Оценката е завършена
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{result.summary.total_rules}</p>
                <p className="text-sm text-gray-600">Правила</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{result.summary.passed}</p>
                <p className="text-sm text-gray-600">Изпълнени</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
                <p className="text-sm text-gray-600">Неизпълнени</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{result.summary.review}</p>
                <p className="text-sm text-gray-600">За преглед</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-800">{result.summary.blockers}</p>
                <p className="text-sm text-gray-600">Блокиращи</p>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <Button onClick={handleViewResults} className="gap-2 bg-green-600 hover:bg-green-700">
                Виж пълния отчет
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-4">
        {!result ? (
          <Button
            onClick={handleEvaluate}
            disabled={!canEvaluate || isEvaluating}
            size="lg"
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Оценяване...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Стартирай проверка
              </>
            )}
          </Button>
        ) : null}
      </div>

      {!canEvaluate && (
        <p className="text-center text-sm text-gray-500">
          Добавете поне една сграда, помещение и изход за да стартирате проверката
        </p>
      )}
    </div>
  );
}
