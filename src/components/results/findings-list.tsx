/**
 * Findings List
 * Displays all findings with filtering
 */

'use client';

import { useState, useMemo } from 'react';
import type { Finding, FindingStatus, FindingSeverity } from '@/lib/engine';
import { FindingCard } from './finding-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface FindingsListProps {
  findings: Finding[];
}

type StatusFilter = FindingStatus | 'ALL';
type SeverityFilter = FindingSeverity | 'ALL';

export function FindingsList({ findings }: FindingsListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      // Status filter
      if (statusFilter !== 'ALL' && finding.status !== statusFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL' && finding.severity !== severityFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          finding.rule_id.toLowerCase().includes(query) ||
          finding.explanation_bg.toLowerCase().includes(query) ||
          finding.legal_reference.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [findings, statusFilter, severityFilter, searchQuery]);

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSeverityFilter('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Търсене по правило или текст..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Всички статуси</SelectItem>
            <SelectItem value="PASS">Изпълнени</SelectItem>
            <SelectItem value="FAIL">Неизпълнени</SelectItem>
            <SelectItem value="REVIEW">За преглед</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Тежест" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Всички тежести</SelectItem>
            <SelectItem value="BLOCKER">Блокиращи</SelectItem>
            <SelectItem value="WARNING">Предупреждения</SelectItem>
            <SelectItem value="INFO">Информация</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'ALL' || severityFilter !== 'ALL' || searchQuery) && (
          <Button variant="ghost" onClick={resetFilters} className="gap-2">
            <Filter className="h-4 w-4" />
            Изчисти
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Показани {filteredFindings.length} от {findings.length} резултата
      </p>

      {/* Findings */}
      {filteredFindings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Filter className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Няма резултати</h3>
          <p className="mt-1 text-sm text-gray-500">
            Опитайте с други филтри
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, index) => (
            <FindingCard key={`${finding.rule_id}-${index}`} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}
