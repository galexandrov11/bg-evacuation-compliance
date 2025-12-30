/**
 * Building Form
 * Step 1: Basic building information
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizardStore } from '@/store/wizard-store';
import { buildingSchema, type BuildingFormData } from '@/schemas/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const HEIGHT_CATEGORIES = [
  { value: 'Н', label: 'Н - Ниски (до 15 м)' },
  { value: 'НН', label: 'НН - Ниско ниски (до 28 м)' },
  { value: 'СВ', label: 'СВ - Средно високи (до 50 м)' },
  { value: 'В', label: 'В - Високи (до 75 м)' },
  { value: 'МВ', label: 'МВ - Много високи (над 75 м)' },
];

const FUNCTIONAL_CLASSES = [
  { group: 'Ф1 - Жилищни', items: [
    { value: 'Ф1.1', label: 'Ф1.1 - Детски заведения, болници, домове за възрастни' },
    { value: 'Ф1.2', label: 'Ф1.2 - Хотели, общежития, санаториуми' },
    { value: 'Ф1.3', label: 'Ф1.3 - Многофамилни жилищни сгради' },
    { value: 'Ф1.4', label: 'Ф1.4 - Еднофамилни жилищни сгради' },
  ]},
  { group: 'Ф2 - Обществени', items: [
    { value: 'Ф2.1', label: 'Ф2.1 - Театри, кина, концертни зали' },
    { value: 'Ф2.2', label: 'Ф2.2 - Музеи, изложбени зали, танцови зали' },
    { value: 'Ф2.3', label: 'Ф2.3 - Открити съоръжения (стадиони)' },
    { value: 'Ф2.4', label: 'Ф2.4 - Закрити съоръжения (спортни зали)' },
  ]},
  { group: 'Ф3 - Търговски/Обслужващи', items: [
    { value: 'Ф3.1', label: 'Ф3.1 - Търговски центрове, магазини' },
    { value: 'Ф3.2', label: 'Ф3.2 - Ресторанти, столови' },
    { value: 'Ф3.3', label: 'Ф3.3 - Гари, летища' },
    { value: 'Ф3.4', label: 'Ф3.4 - Поликлиники, амбулатории' },
    { value: 'Ф3.5', label: 'Ф3.5 - Помещения за посетители' },
  ]},
  { group: 'Ф4 - Учебни/Административни', items: [
    { value: 'Ф4.1', label: 'Ф4.1 - Училища, висши учебни заведения' },
    { value: 'Ф4.2', label: 'Ф4.2 - Административни сгради, офиси' },
    { value: 'Ф4.3', label: 'Ф4.3 - Учреждения за наука' },
    { value: 'Ф4.4', label: 'Ф4.4 - Пожарни служби' },
  ]},
  { group: 'Ф5 - Производствени/Складови', items: [
    { value: 'Ф5.1', label: 'Ф5.1 - Производствени сгради' },
    { value: 'Ф5.2', label: 'Ф5.2 - Складови сгради' },
    { value: 'Ф5.3', label: 'Ф5.3 - Селскостопански сгради' },
  ]},
];

const FIRE_RESISTANCE_RATINGS = [
  { value: 'I', label: 'I степен' },
  { value: 'II', label: 'II степен' },
  { value: 'III', label: 'III степен' },
  { value: 'IV', label: 'IV степен' },
  { value: 'V', label: 'V степен' },
];

export function BuildingForm() {
  const { building, setBuilding, nextStep } = useWizardStore();

  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: building || {
      name: '',
      height_category: 'Н',
      functional_class: 'Ф3.1',
      has_sprinklers: false,
      has_smoke_control: false,
      has_fire_alarm: false,
      is_single_storey: false,
    },
  });

  const onSubmit = (data: BuildingFormData) => {
    setBuilding(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Building Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Име на сградата</FormLabel>
              <FormControl>
                <Input placeholder="напр. Офис сграда Център" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Height */}
          <FormField
            control={form.control}
            name="height_m"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Височина (м)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="напр. 25.5"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>Височина на сградата в метри (незадължително)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Height Category */}
          <FormField
            control={form.control}
            name="height_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория по височина</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете категория" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEIGHT_CATEGORIES.map((cat) => (
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
        </div>

        {/* Functional Class */}
        <FormField
          control={form.control}
          name="functional_class"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Функционален клас</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете функционален клас" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FUNCTIONAL_CLASSES.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
                        {group.group}
                      </div>
                      {group.items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fire Resistance Rating */}
        <FormField
          control={form.control}
          name="fire_resistance_rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Степен на огнеустойчивост</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете степен (незадължително)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FIRE_RESISTANCE_RATINGS.map((rating) => (
                    <SelectItem key={rating.value} value={rating.value}>
                      {rating.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Boolean switches */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Системи за безопасност</h3>

          <FormField
            control={form.control}
            name="has_sprinklers"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel className="text-base">Спринклерна система</FormLabel>
                  <FormDescription>
                    Сградата е оборудвана с автоматична спринклерна инсталация
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
            name="has_smoke_control"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel className="text-base">Димоотводна система</FormLabel>
                  <FormDescription>
                    Сградата има система за отвеждане на дим
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
            name="has_fire_alarm"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel className="text-base">Пожароизвестителна система</FormLabel>
                  <FormDescription>
                    Сградата има автоматична пожароизвестителна инсталация
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
            name="is_single_storey"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel className="text-base">Едноетажна сграда</FormLabel>
                  <FormDescription>
                    Сградата е само на един етаж
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
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
            Запази и продължи
          </Button>
        </div>
      </form>
    </Form>
  );
}
