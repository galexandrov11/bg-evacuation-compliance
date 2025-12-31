/**
 * Exits Form
 * Step 3: Add and manage evacuation exits
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore } from '@/store/wizard-store';
import { exitSchema, type ExitFormData } from '@/schemas/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react';

// Schema without id for new exits
const exitFormSchema = exitSchema.omit({ id: true });
type ExitFormInput = z.infer<typeof exitFormSchema>;

const EXIT_TYPES = [
  { value: 'door', label: 'Врата (директен изход)' },
  { value: 'stair', label: 'Стълбищна клетка' },
  { value: 'external', label: 'Външна евакуация' },
  { value: 'corridor', label: 'Коридор' },
  { value: 'internal', label: 'Вътрешна' },
];

interface ExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExit?: ExitFormData;
  onSave: (exit: ExitFormInput) => void;
}

function ExitDialog({ open, onOpenChange, editingExit, onSave }: ExitDialogProps) {
  const { spaces } = useWizardStore();

  // Get unique floors from spaces
  const floors = [...new Set(spaces.map((s) => s.floor))].sort((a, b) => b - a);

  const form = useForm<ExitFormInput>({
    resolver: zodResolver(exitFormSchema),
    defaultValues: editingExit
      ? {
          name: editingExit.name,
          type: editingExit.type,
          width_m: editingExit.width_m,
          serves_space_ids: editingExit.serves_space_ids,
          serves_floors: editingExit.serves_floors,
          has_panic_hardware: editingExit.has_panic_hardware,
        }
      : {
          name: '',
          type: 'door',
          width_m: 0.9,
          serves_space_ids: [],
          serves_floors: [],
          has_panic_hardware: false,
        },
  });

  const onSubmit = (data: ExitFormInput) => {
    onSave(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingExit ? 'Редактиране на изход' : 'Нов изход'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Име на изхода</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Изход А" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип изход</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXIT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="width_m"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Широчина (м)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.90"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Минимум 0.8 м за единичен изход, 1.2 м за основен
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serves_space_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Обслужвани помещения</FormLabel>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {spaces.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Първо добавете помещения
                      </p>
                    ) : (
                      spaces.map((space) => (
                        <FormField
                          key={space.id}
                          control={form.control}
                          name="serves_space_ids"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(space.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, space.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== space.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">
                                {space.name} (ет. {space.floor})
                              </span>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serves_floors"
              render={() => (
                <FormItem>
                  <FormLabel>Обслужвани етажи</FormLabel>
                  <div className="border rounded-md p-3 flex flex-wrap gap-3">
                    {floors.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Добавете помещения, за да видите етажите
                      </p>
                    ) : (
                      floors.map((floor) => (
                        <FormField
                          key={floor}
                          control={form.control}
                          name="serves_floors"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(floor)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, floor]);
                                    } else {
                                      field.onChange(
                                        current.filter((f) => f !== floor)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">
                                {floor === 0 ? 'Партер' : `Етаж ${floor}`}
                              </span>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_panic_hardware"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Паник брава</FormLabel>
                    <FormDescription className="text-xs">
                      Изходът е оборудван с паник брава
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отказ
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                {editingExit ? 'Запази промените' : 'Добави изход'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ExitsForm() {
  const { exits, spaces, addExit, updateExit, removeExit, markStepComplete, nextStep } = useWizardStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExit, setEditingExit] = useState<ExitFormData | undefined>();

  const handleAddExit = (data: ExitFormInput) => {
    addExit(data);
  };

  const handleEditExit = (exit: ExitFormData) => {
    setEditingExit(exit);
    setDialogOpen(true);
  };

  const handleSaveExit = (data: ExitFormInput) => {
    if (editingExit) {
      updateExit(editingExit.id, data);
      setEditingExit(undefined);
    } else {
      handleAddExit(data);
    }
  };

  const handleDeleteExit = (id: string) => {
    if (confirm('Сигурни ли сте, че искате да изтриете този изход?')) {
      removeExit(id);
    }
  };

  const handleContinue = () => {
    if (exits.length > 0) {
      markStepComplete('exits');
      nextStep();
    }
  };

  // Helper to get space names by IDs
  const getSpaceNames = (ids: string[]) => {
    return ids
      .map((id) => spaces.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getExitTypeLabel = (type: string) => {
    return EXIT_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Добавете евакуационните изходи на сградата.
        </p>
        <Button
          onClick={() => {
            setEditingExit(undefined);
            setDialogOpen(true);
          }}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Добави изход
        </Button>
      </div>

      {exits.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <DoorOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Няма добавени изходи</h3>
          <p className="mt-1 text-sm text-gray-500">
            Добавете евакуационните изходи
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-4 gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Добави изход
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Широчина</TableHead>
                <TableHead>Помещения</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exits.map((exit) => (
                <TableRow key={exit.id}>
                  <TableCell className="font-medium">{exit.name}</TableCell>
                  <TableCell>{getExitTypeLabel(exit.type)}</TableCell>
                  <TableCell className="text-right">{exit.width_m} м</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {getSpaceNames(exit.serves_space_ids)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditExit(exit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExit(exit.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExitDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingExit(undefined);
        }}
        editingExit={editingExit}
        onSave={handleSaveExit}
      />

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={exits.length === 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Продължи към маршрутите
        </Button>
      </div>
    </div>
  );
}
