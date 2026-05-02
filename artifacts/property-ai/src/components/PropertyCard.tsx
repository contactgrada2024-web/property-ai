import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema, PropertyData, defaultPropertyData } from "@/lib/calculations";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DollarSign, Percent, Trash2, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface PropertyCardProps {
  id: string;
  name: string;
  data: PropertyData;
  index: number;
  canRemove: boolean;
  onNameChange: (id: string, name: string) => void;
  onChange: (id: string, data: PropertyData) => void;
  onRemove: (id: string) => void;
}

const ACCENT_COLORS = [
  "border-t-primary",
  "border-t-[hsl(280,70%,60%)]",
  "border-t-[hsl(45,95%,55%)]",
  "border-t-[hsl(10,80%,60%)]",
];

const LABEL_COLORS = [
  "text-primary",
  "text-[hsl(280,70%,60%)]",
  "text-[hsl(45,95%,55%)]",
  "text-[hsl(10,80%,60%)]",
];

function FieldInput({
  control,
  name,
  label,
  prefix,
  suffix,
  step,
  testId,
}: {
  control: any;
  name: keyof PropertyData;
  label: string;
  prefix?: boolean;
  suffix?: boolean;
  step?: string;
  testId: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
          <FormControl>
            <div className="relative">
              {prefix && <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />}
              {suffix && <Percent className="absolute right-2 top-2 h-3 w-3 text-muted-foreground" />}
              <Input
                type="number"
                step={step}
                className={`h-8 text-sm font-mono bg-background/50 ${prefix ? "pl-7" : ""} ${suffix ? "pr-7" : ""}`}
                data-testid={testId}
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  );
}

export default function PropertyCard({
  id,
  name,
  data,
  index,
  canRemove,
  onNameChange,
  onChange,
  onRemove,
}: PropertyCardProps) {
  const form = useForm<PropertyData>({
    resolver: zodResolver(propertySchema),
    defaultValues: data,
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      const parsed = propertySchema.safeParse(value);
      if (parsed.success) onChange(id, parsed.data);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange, id]);

  const accentClass = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const labelClass = LABEL_COLORS[index % LABEL_COLORS.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`bg-card/40 border border-border/60 rounded-xl border-t-2 ${accentClass} overflow-hidden`}
      data-testid={`property-card-${id}`}
    >
      <div className="p-4 pb-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className={`h-4 w-4 flex-shrink-0 ${labelClass}`} />
          <input
            value={name}
            onChange={(e) => onNameChange(id, e.target.value)}
            className={`bg-transparent text-sm font-semibold tracking-tight outline-none border-b border-transparent focus:border-border transition-colors w-full min-w-0 ${labelClass}`}
            placeholder="Property name"
            data-testid={`input-property-name-${id}`}
            maxLength={32}
          />
        </div>
        {canRemove && (
          <button
            onClick={() => onRemove(id)}
            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1"
            data-testid={`button-remove-property-${id}`}
            aria-label="Remove property"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <Form {...form}>
        <form className="p-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-3">
            <FieldInput control={form.control} name="currentValue" label="Current Value" prefix testId={`input-cv-${id}`} />
            <FieldInput control={form.control} name="purchasePrice" label="Purchase Price" prefix testId={`input-pp-${id}`} />
            <FieldInput control={form.control} name="mortgageBalance" label="Mortgage Balance" prefix testId={`input-mb-${id}`} />
            <FieldInput control={form.control} name="interestRate" label="Interest Rate %" suffix step="0.1" testId={`input-ir-${id}`} />
            <FieldInput control={form.control} name="rentalIncome" label="Monthly Rent" prefix testId={`input-ri-${id}`} />
            <FieldInput control={form.control} name="mortgagePayment" label="Mortgage Payment" prefix testId={`input-mp-${id}`} />
            <FieldInput control={form.control} name="propertyTax" label="Property Tax" prefix testId={`input-pt-${id}`} />
            <FieldInput control={form.control} name="insurance" label="Insurance" prefix testId={`input-ins-${id}`} />
            <FieldInput control={form.control} name="maintenance" label="Maintenance" prefix testId={`input-maint-${id}`} />
            <FieldInput control={form.control} name="hoa" label="HOA / Other" prefix testId={`input-hoa-${id}`} />
            <FieldInput control={form.control} name="sellingCostsPercent" label="Selling Costs %" suffix step="0.1" testId={`input-sc-${id}`} />
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
