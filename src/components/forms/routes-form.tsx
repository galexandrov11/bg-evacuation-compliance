/**
 * Routes Form
 * Step 4: Add and manage evacuation routes
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore } from '@/store/wizard-store';
import { routeSchema, type RouteFormData } from '@/schemas/project';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Route } from 'lucide-react';

// Schema without id for new routes
const routeFormSchema = routeSchema.omit({ id: true });
type RouteFormInput = z.infer<typeof routeFormSchema>;

const EVACUATION_TYPES = [
  { value: 'single_direction', label: 'Еднопосочна евакуация' },
  { value: 'multiple_directions', label: 'Многопосочна евакуация' },
];

interface RouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoute?: RouteFormData;
  onSave: (route: RouteFormInput) => void;
}

function RouteDialog({ open, onOpenChange, editingRoute, onSave }: RouteDialogProps) {
  const { spaces, exits } = useWizardStore();

  const form = useForm<RouteFormInput>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: editingRoute
      ? {
          name: editingRoute.name,
          from_space_id: editingRoute.from_space_id,
          to_exit_id: editingRoute.to_exit_id,
          length_m: editingRoute.length_m,
          has_dead_end: editingRoute.has_dead_end,
          dead_end_length_m: editingRoute.dead_end_length_m,
          evacuation_type: editingRoute.evacuation_type,
        }
      : {
          name: '',
          from_space_id: '',
          to_exit_id: '',
          length_m: 0,
          has_dead_end: false,
          evacuation_type: 'multiple_directions',
        },
  });

  const hasDeadEnd = form.watch('has_dead_end');

  const onSubmit = (data: RouteFormInput) => {
    // Clear dead_end_length if no dead end
    if (!data.has_dead_end) {
      data.dead_end_length_m = undefined;
    }
    onSave(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingRoute ? 'Редактиране на маршрут' : 'Нов маршрут'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Име на маршрута (незадължително)</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Маршрут А-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from_space_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>От помещение</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете начално помещение" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {spaces.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name} (ет. {space.floor})
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
              name="to_exit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>До изход</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете краен изход" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {exits.map((exit) => (
                        <SelectItem key={exit.id} value={exit.id}>
                          {exit.name} ({exit.width_m} м)
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
              name="length_m"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дължина на маршрута (м)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="25.0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Общата дължина от помещението до изхода
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evacuation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип евакуация</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVACUATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Еднопосочна = само един изход; Многопосочна = алтернативни изходи
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_dead_end"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Задънен коридор</FormLabel>
                    <FormDescription className="text-xs">
                      Маршрутът минава през задънен коридор
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

            {hasDeadEnd && (
              <FormField
                control={form.control}
                name="dead_end_length_m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дължина на задънения коридор (м)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="10.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отказ
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                {editingRoute ? 'Запази промените' : 'Добави маршрут'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function RoutesForm() {
  const { routes, spaces, exits, addRoute, updateRoute, removeRoute, markStepComplete, nextStep } = useWizardStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteFormData | undefined>();

  const handleAddRoute = (data: RouteFormInput) => {
    addRoute(data);
  };

  const handleEditRoute = (route: RouteFormData) => {
    setEditingRoute(route);
    setDialogOpen(true);
  };

  const handleSaveRoute = (data: RouteFormInput) => {
    if (editingRoute) {
      updateRoute(editingRoute.id, data);
      setEditingRoute(undefined);
    } else {
      handleAddRoute(data);
    }
  };

  const handleDeleteRoute = (id: string) => {
    if (confirm('Сигурни ли сте, че искате да изтриете този маршрут?')) {
      removeRoute(id);
    }
  };

  const handleContinue = () => {
    markStepComplete('routes');
    nextStep();
  };

  // Helpers to get names
  const getSpaceName = (id: string) => spaces.find((s) => s.id === id)?.name || 'Неизвестно';
  const getExitName = (id: string) => exits.find((e) => e.id === id)?.name || 'Неизвестно';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Дефинирайте евакуационните маршрути от помещенията до изходите.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Маршрутите са незадължителни, но позволяват по-точна проверка на разстоянията.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRoute(undefined);
            setDialogOpen(true);
          }}
          disabled={spaces.length === 0 || exits.length === 0}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Добави маршрут
        </Button>
      </div>

      {spaces.length === 0 || exits.length === 0 ? (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <Route className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Добавете помещения и изходи първо
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Маршрутите свързват помещенията с изходите
          </p>
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Route className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Няма добавени маршрути</h3>
          <p className="mt-1 text-sm text-gray-500">
            Добавете евакуационни маршрути (незадължително)
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-4 gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Добави маршрут
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>От</TableHead>
                <TableHead>До</TableHead>
                <TableHead className="text-right">Дължина</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Задънен</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">
                    {getSpaceName(route.from_space_id)}
                  </TableCell>
                  <TableCell>{getExitName(route.to_exit_id)}</TableCell>
                  <TableCell className="text-right">{route.length_m} м</TableCell>
                  <TableCell>
                    {route.evacuation_type === 'single_direction' ? 'Еднопосочна' : 'Многопосочна'}
                  </TableCell>
                  <TableCell>
                    {route.has_dead_end ? (
                      <span className="text-orange-600">
                        Да ({route.dead_end_length_m} м)
                      </span>
                    ) : (
                      <span className="text-gray-400">Не</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRoute(route)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoute(route.id)}
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

      <RouteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRoute(undefined);
        }}
        editingRoute={editingRoute}
        onSave={handleSaveRoute}
      />

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Продължи към стълбищата
        </Button>
      </div>
    </div>
  );
}
