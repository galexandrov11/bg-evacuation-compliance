/**
 * Wizard Steps
 * Renders the appropriate form based on the current step
 */

'use client';

import { useWizardStore, WIZARD_STEPS } from '@/store/wizard-store';
import { BuildingForm } from '@/components/forms/building-form';
import { SpacesForm } from '@/components/forms/spaces-form';
import { ExitsForm } from '@/components/forms/exits-form';
import { RoutesForm } from '@/components/forms/routes-form';
import { StairsForm } from '@/components/forms/stairs-form';
import { ReviewForm } from '@/components/forms/review-form';

export function WizardSteps() {
  const { currentStep } = useWizardStore();
  const stepId = WIZARD_STEPS[currentStep].id;

  switch (stepId) {
    case 'building':
      return <BuildingForm />;
    case 'spaces':
      return <SpacesForm />;
    case 'exits':
      return <ExitsForm />;
    case 'routes':
      return <RoutesForm />;
    case 'stairs':
      return <StairsForm />;
    case 'review':
      return <ReviewForm />;
    default:
      return <div>Unknown step</div>;
  }
}
