import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema, PropertyData } from "@/lib/calculations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DollarSign, Building2, TrendingUp, Percent, Wallet } from "lucide-react";

interface PropertyFormProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}

export default function PropertyForm({ data, onChange }: PropertyFormProps) {
  const form = useForm<PropertyData>({
    resolver: zodResolver(propertySchema),
    defaultValues: data,
    mode: "onChange",
  });

  // Reset the form ONLY when the incoming data differs from the form's current
  // values. During user typing, the form values and the prop stay in sync, so
  // no reset fires. During DB load, the prop contains saved data while the form
  // still holds defaults — the mismatch triggers a single reset.
  // We use a numeric field comparison rather than JSON.stringify to avoid false
  // positives caused by react-hook-form internal proxies or field ordering.
  useEffect(() => {
    const current = form.getValues();
    let diff = false;
    (Object.keys(propertySchema.shape) as (keyof PropertyData)[]).forEach((k) => {
      if (current[k] !== data[k]) diff = true;
    });
    if (diff) {
      form.reset(data);
    }
  }, [data, form]);

  // Propagate user edits upward. Typing changes the form value, which then
  // updates the parent state. On the next render the parent passes the updated
  // prop back down, but the numeric comparison above sees they match and skips
  // the reset — no race, cursor preserved.
  useEffect(() => {
    const subscription = form.watch((value) => {
      const parsed = propertySchema.safeParse(value);
      if (parsed.success) {
        onChange(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-primary">
            <Building2 className="h-5 w-5" />
            <h3 className="text-lg font-semibold tracking-tight">Valuation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Current Value</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-current-value" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Original Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-purchase-price" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mortgageBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Mortgage Balance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-mortgage-balance" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Interest Rate</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" step="0.1" className="pr-9 font-mono" data-testid="input-interest-rate" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-primary mt-8">
            <Wallet className="h-5 w-5" />
            <h3 className="text-lg font-semibold tracking-tight">Income &amp; Expenses</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rentalIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Rent</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-rental-income" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mortgagePayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Principal &amp; Interest</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-mortgage-payment" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyTax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Property Tax</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-property-tax" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Insurance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-insurance" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maintenance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Maintenance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-maintenance" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hoa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Monthly HOA / Other</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-9 font-mono" data-testid="input-hoa" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-primary mt-8">
            <TrendingUp className="h-5 w-5" />
            <h3 className="text-lg font-semibold tracking-tight">Assumptions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sellingCostsPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Selling Costs %</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" step="0.1" className="pr-9 font-mono" data-testid="input-selling-costs" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="appreciationRatePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Appreciation %</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" step="0.1" className="pr-9 font-mono" data-testid="input-appreciation-rate" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
