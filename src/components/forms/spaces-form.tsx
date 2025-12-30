/**
 * Spaces Form
 * Step 2: Add and manage spaces/rooms
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore } from '@/store/wizard-store';
import { spaceSchema, type SpaceFormData } from '@/schemas/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';

// Schema without id for new spaces
const spaceFormSchema = spaceSchema.omit({ id: true });
type SpaceFormInput = z.infer<typeof spaceFormSchema>;

const FIRE_HAZARD_CATEGORIES = [
  { value: 'Ф5А', label: 'Ф5А - Взривоопасни' },
  { value: 'Ф5Б', label: 'Ф5Б - Пожароопасни' },
  { value: 'Ф5В', label: 'Ф5В - Горими материали' },
  { value: 'Ф5Г', label: 'Ф5Г - Негорими материали (нагрети)' },
  { value: 'Ф5Д', label: 'Ф5Д - Негорими материали (студени)' },
];

const COMMON_PURPOSES = [
  'Офис',
  'Търговска зала',
  'Склад',
  'Производствено',
  'Заседателна зала',
  'Ресторант',
  'Кухня',
  'Фоайе',
  'Коридор',
  'Санитарен възел',
  'Техническо помещение',
  'Други',
];

interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSpace?: SpaceFormData;
  onSave: (space: SpaceFormInput) => void;
}

function SpaceDialog({ open, onOpenChange, editingSpace, onSave }: SpaceDialogProps) {
  const form = useForm<SpaceFormInput>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: editingSpace
      ? {
          name: editingSpace.name,
          purpose: editingSpace.purpose,
          floor: editingSpace.floor,
          area_m2: editingSpace.area_m2,
          is_underground: editingSpace.is_underground,
          fire_hazard_category: editingSpace.fire_hazard_category,
          occupants_override: editingSpace.occupants_override,
        }
      : {
          name: '',
          purpose: '',
          floor: 0,
          area_m2: 0,
          is_underground: false,
        },
  });

  const onSubmit = (data: SpaceFormInput) => {
    onSave(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingSpace ? 'Редактиране на помещение' : 'Ново помещение'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Име на помещението</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Търговска зала 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Предназначение</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете предназначение" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMON_PURPOSES.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Етаж</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>0 = партер, -1 = сутерен</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Площ (м²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_underground"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Подземно помещение</FormLabel>
                    <FormDescription className="text-xs">
                      Помещението е под нивото на терена
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

            <FormField
              control={form.control}
              name="fire_hazard_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория по пожарна опасност (само за Ф5)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете категория (незадължително)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FIRE_HAZARD_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
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
              name="occupants_override"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ръчен брой хора (незадължително)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Автоматично от площ"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Ако е празно, се изчислява автоматично по Таблица 8
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отказ
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                {editingSpace ? 'Запази промените' : 'Добави помещение'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function SpacesForm() {
  const { spaces, addSpace, updateSpace, removeSpace, markStepComplete, nextStep } = useWizardStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<SpaceFormData | undefined>();

  const handleAddSpace = (data: SpaceFormInput) => {
    addSpace(data);
  };

  const handleEditSpace = (space: SpaceFormData) => {
    setEditingSpace(space);
    setDialogOpen(true);
  };

  const handleSaveSpace = (data: SpaceFormInput) => {
    if (editingSpace) {
      updateSpace(editingSpace.id, data);
      setEditingSpace(undefined);
    } else {
      handleAddSpace(data);
    }
  };

  const handleDeleteSpace = (id: string) => {
    if (confirm('Сигурни ли сте, че искате да изтриете това помещение?')) {
      removeSpace(id);
    }
  };

  const handleContinue = () => {
    if (spaces.length > 0) {
      markStepComplete('spaces');
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Добавете всички помещения в сградата, които ще бъдат евакуирани.
        </p>
        <Button
          onClick={() => {
            setEditingSpace(undefined);
            setDialogOpen(true);
          }}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Добави помещение
        </Button>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Няма добавени помещения</h3>
          <p className="mt-1 text-sm text-gray-500">
            Започнете като добавите първото помещение
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-4 gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Добави помещение
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead>Предназначение</TableHead>
                <TableHead className="text-right">Етаж</TableHead>
                <TableHead className="text-right">Площ (м²)</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spaces.map((space) => (
                <TableRow key={space.id}>
                  <TableCell className="font-medium">{space.name}</TableCell>
                  <TableCell>{space.purpose}</TableCell>
                  <TableCell className="text-right">
                    {space.floor === 0 ? 'Партер' : space.floor}
                  </TableCell>
                  <TableCell className="text-right">{space.area_m2}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSpace(space)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSpace(space.id)}
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

      <SpaceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSpace(undefined);
        }}
        editingSpace={editingSpace}
        onSave={handleSaveSpace}
      />

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={spaces.length === 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Продължи към изходите
        </Button>
      </div>
    </div>
  );
}
