import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema, PropertyData } from "@/lib/calculations";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  const form = useForm<PropertyData>({
    resolver: zodResolver(propertySchema),
    defaultValues: data,
    mode: "onChange",
  });

  // Propagate user edits upward. Typing changes the form value, which then
  // updates the parent state. The parent only renders this component after
  // loaded=true, so defaultValues already contains the persisted DB data.
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
            <h3 className="text-lg font-semibold tracking-tight">{t("valuation")}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("currentValue")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("originalPrice")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("mortgageBalance")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("interestRate")}</FormLabel>
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
            <h3 className="text-lg font-semibold tracking-tight">{t("incomeAndExpenses")}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rentalIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("monthlyRent")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("monthlyPrincipalInterest")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("monthlyPropertyTax")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("monthlyInsurance")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("monthlyMaintenance")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("monthlyHoaOther")}</FormLabel>
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
            <h3 className="text-lg font-semibold tracking-tight">{t("assumptions")}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sellingCostsPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("sellingCostsPercent")}</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">{t("appreciationRatePercent")}</FormLabel>
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
