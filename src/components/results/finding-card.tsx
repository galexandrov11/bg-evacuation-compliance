/**
 * Finding Card
 * Displays a single compliance finding
 */

'use client';

import type { Finding } from '@/lib/engine';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FindingCardProps {
  finding: Finding;
}

const statusConfig = {
  PASS: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Изпълнено',
  },
  FAIL: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Неизпълнено',
  },
  REVIEW: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'За преглед',
  },
};

const severityConfig = {
  BLOCKER: {
    variant: 'destructive' as const,
    label: 'Блокиращо',
  },
  WARNING: {
    variant: 'secondary' as const,
    label: 'Предупреждение',
  },
  INFO: {
    variant: 'outline' as const,
    label: 'Информация',
  },
};

export function FindingCard({ finding }: FindingCardProps) {
  const status = statusConfig[finding.status];
  const severity = severityConfig[finding.severity];
  const StatusIcon = status.icon;

  return (
    <Collapsible>
      <Card className={cn('transition-colors', status.borderColor)}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn('cursor-pointer hover:bg-gray-50', status.bgColor)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <StatusIcon className={cn('h-5 w-5 mt-0.5', status.color)} />
                <div>
                  <CardTitle className="text-base font-medium">
                    {finding.rule_id}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {finding.explanation_bg}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={severity.variant}>{severity.label}</Badge>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="border-t pt-4 space-y-3">
              {/* Measured vs Required */}
              {(finding.measured !== null || finding.required !== null) && (
                <div className="grid grid-cols-2 gap-4">
                  {finding.measured !== null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Измерено</p>
                      <p className="text-lg font-semibold">{finding.measured}</p>
                    </div>
                  )}
                  {finding.required !== null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Изисквано</p>
                      <p className="text-lg font-semibold">{finding.required}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Scope */}
              {finding.subject_id && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Обхват</p>
                  <p className="text-sm">
                    <span className="capitalize">{finding.scope}</span>: {finding.subject_name || finding.subject_id}
                  </p>
                </div>
              )}

              {/* Legal Reference */}
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{finding.legal_reference}</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
