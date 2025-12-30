/**
 * Wizard Container
 * Multi-step form container with step navigation
 */

'use client';

import { useWizardStore, WIZARD_STEPS } from '@/store/wizard-store';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardContainerProps {
  children: React.ReactNode;
}

export function WizardContainer({ children }: WizardContainerProps) {
  const { currentStep, stepsCompleted, setStep, nextStep, prevStep } = useWizardStore();

  const canGoNext = currentStep < WIZARD_STEPS.length - 1;
  const canGoPrev = currentStep > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with steps */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {WIZARD_STEPS.map((step, index) => (
                <li
                  key={step.id}
                  className={cn(
                    'relative',
                    index !== WIZARD_STEPS.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''
                  )}
                >
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setStep(index)}
                      className={cn(
                        'relative flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                        index < currentStep || stepsCompleted[step.id]
                          ? 'bg-green-600 hover:bg-green-700'
                          : index === currentStep
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-gray-200 hover:bg-gray-300'
                      )}
                    >
                      {stepsCompleted[step.id] ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={cn(
                            'text-sm font-medium',
                            index === currentStep ? 'text-white' : 'text-gray-600'
                          )}
                        >
                          {index + 1}
                        </span>
                      )}
                    </button>
                    {index !== WIZARD_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'absolute top-4 left-8 -ml-px h-0.5 w-full sm:w-20',
                          index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                        )}
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        index === currentStep ? 'text-orange-600' : 'text-gray-500'
                      )}
                    >
                      {step.name}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {WIZARD_STEPS[currentStep].name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {WIZARD_STEPS[currentStep].description}
            </p>
          </div>

          {children}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={!canGoPrev}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canGoNext}
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            Напред
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
