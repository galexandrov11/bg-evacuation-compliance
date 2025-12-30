/**
 * Check Page
 * Multi-step wizard for compliance checking
 */

import { WizardContainer } from '@/components/forms/wizard/wizard-container';
import { WizardSteps } from '@/components/forms/wizard/wizard-steps';

export const metadata = {
  title: 'Нова проверка | Flames',
  description: 'Проверка за съответствие с Наредба № Iз-1971',
};

export default function CheckPage() {
  return (
    <WizardContainer>
      <WizardSteps />
    </WizardContainer>
  );
}
