import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useMemo } from "react";
import PropertyForm from "@/components/PropertyForm";
import ResultsCard from "@/components/ResultsCard";
import { defaultPropertyData, calculatePropertyMetrics, PropertyData } from "@/lib/calculations";
import { Radar } from "lucide-react";

const queryClient = new QueryClient();

function Home() {
  const [data, setData] = useState<PropertyData>(defaultPropertyData);
  
  const results = useMemo(() => calculatePropertyMetrics(data), [data]);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30 font-sans">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Radar className="h-6 w-6" />
            <span className="font-bold tracking-wider uppercase text-lg text-foreground">Property<span className="text-primary">AI</span></span>
          </div>
          <div className="text-xs font-mono text-muted-foreground hidden sm:block">
            TERMINAL v1.0 // ACTIVE
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Asset Evaluation</h1>
              <p className="text-muted-foreground mt-2">Enter your property parameters to generate an instant strategic analysis.</p>
            </div>
            
            <div className="bg-card/30 p-6 md:p-8 rounded-2xl border border-border/50">
              <PropertyForm onChange={setData} />
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ResultsCard results={results} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
