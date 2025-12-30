/**
 * Stairs Form
 * Step 5: Add and manage evacuation stairs
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore } from '@/store/wizard-store';
import { stairSchema, type StairFormData } from '@/schemas/project';
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
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';

// Schema without id for new stairs
const stairFormSchema = stairSchema.omit({ id: true });
type StairFormInput = z.infer<typeof stairFormSchema>;

const STAIR_TYPES = [
  { value: 'enclosed', label: 'Затворено (в стълбищна клетка)' },
  { value: 'open', label: 'Открито (без клетка)' },
  { value: 'external', label: 'Външно' },
  { value: 'smoke_protected', label: 'Димозащитено (Н1, Н2, Н3)' },
  { value: 'spiral', label: 'Вито стълбище' },
];

interface StairDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStair?: StairFormData;
  onSave: (stair: StairFormInput) => void;
}

function StairDialog({ open, onOpenChange, editingStair, onSave }: StairDialogProps) {
  const { spaces } = useWizardStore();

  // Get unique floors from spaces, plus additional floors
  const spacesFloors = [...new Set(spaces.map((s) => s.floor))];
  const allFloors = [...new Set([...spacesFloors, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])].sort((a, b) => b - a);

  const form = useForm<StairFormInput>({
    resolver: zodResolver(stairFormSchema),
    defaultValues: editingStair
      ? {
          name: editingStair.name,
          type: editingStair.type,
          width_m: editingStair.width_m,
          serves_floors: editingStair.serves_floors,
          step_width_m: editingStair.step_width_m,
          step_height_m: editingStair.step_height_m,
          is_naturally_lit: editingStair.is_naturally_lit,
          has_smoke_vent: editingStair.has_smoke_vent,
        }
      : {
          name: '',
          type: 'enclosed',
          width_m: 1.2,
          serves_floors: [],
          is_naturally_lit: true,
          has_smoke_vent: false,
        },
  });

  const onSubmit = (data: StairFormInput) => {
    onSave(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingStair ? 'Редактиране на стълбище' : 'Ново стълбище'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Име на стълбището</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Стълбище А" {...field} />
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
                  <FormLabel>Тип стълбище</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STAIR_TYPES.map((type) => (
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
                  <FormLabel>Широчина на рамото (м)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.20"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Минимум 1.05 м за общи стълбища
                  </FormDescription>
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
                    {allFloors.map((floor) => (
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
                                    field.onChange([...current, floor].sort((a, b) => b - a));
                                  } else {
                                    field.onChange(
                                      current.filter((f) => f !== floor)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <span className="text-sm">
                              {floor === 0 ? 'Партер' : floor < 0 ? `Сутерен ${floor}` : `Етаж ${floor}`}
                            </span>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="step_width_m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Широчина на стъпало (м)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Незадължително</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="step_height_m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Височина на стъпало (м)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.17"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Незадължително</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_naturally_lit"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Естествено осветление</FormLabel>
                    <FormDescription className="text-xs">
                      Стълбището има прозорци/остъкление
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
              name="has_smoke_vent"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Димоотвеждане</FormLabel>
                    <FormDescription className="text-xs">
                      Стълбището има система за димоотвеждане
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
                {editingStair ? 'Запази промените' : 'Добави стълбище'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function StairsForm() {
  const { stairs, building, addStair, updateStair, removeStair, markStepComplete, nextStep } = useWizardStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStair, setEditingStair] = useState<StairFormData | undefined>();

  // Check if stairs are needed (multi-storey buildings)
  const needsStairs = !building?.is_single_storey;

  const handleAddStair = (data: StairFormInput) => {
    addStair(data);
  };

  const handleEditStair = (stair: StairFormData) => {
    setEditingStair(stair);
    setDialogOpen(true);
  };

  const handleSaveStair = (data: StairFormInput) => {
    if (editingStair) {
      updateStair(editingStair.id, data);
      setEditingStair(undefined);
    } else {
      handleAddStair(data);
    }
  };

  const handleDeleteStair = (id: string) => {
    if (confirm('Сигурни ли сте, че искате да изтриете това стълбище?')) {
      removeStair(id);
    }
  };

  const handleContinue = () => {
    markStepComplete('stairs');
    nextStep();
  };

  const getStairTypeLabel = (type: string) => {
    return STAIR_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Добавете евакуационните стълбища на сградата.
          </p>
          {!needsStairs && (
            <p className="text-xs text-green-600 mt-1">
              Едноетажната сграда не изисква стълбища
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingStair(undefined);
            setDialogOpen(true);
          }}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Добави стълбище
        </Button>
      </div>

      {stairs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Няма добавени стълбища</h3>
          <p className="mt-1 text-sm text-gray-500">
            {needsStairs
              ? 'Добавете евакуационните стълбища'
              : 'Стълбищата са незадължителни за едноетажни сгради'}
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-4 gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Добави стълбище
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
                <TableHead>Етажи</TableHead>
                <TableHead>Осветление</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stairs.map((stair) => (
                <TableRow key={stair.id}>
                  <TableCell className="font-medium">{stair.name}</TableCell>
                  <TableCell>{getStairTypeLabel(stair.type)}</TableCell>
                  <TableCell className="text-right">{stair.width_m} м</TableCell>
                  <TableCell>
                    {stair.serves_floors
                      .map((f) => (f === 0 ? 'П' : f))
                      .join(', ')}
                  </TableCell>
                  <TableCell>
                    {stair.is_naturally_lit ? (
                      <span className="text-green-600">Естествено</span>
                    ) : (
                      <span className="text-gray-500">Изкуствено</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStair(stair)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStair(stair.id)}
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

      <StairDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingStair(undefined);
        }}
        editingStair={editingStair}
        onSave={handleSaveStair}
      />

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Продължи към прегледа
        </Button>
      </div>
    </div>
  );
}
