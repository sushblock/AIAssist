import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Matters from "@/pages/matters";
import Calendar from "@/pages/calendar";
import CourtAlerts from "@/pages/court-alerts";
import Parties from "@/pages/parties";
import Documents from "@/pages/documents";
import Tasks from "@/pages/tasks";
import Billing from "@/pages/billing";
import AiAnalysis from "@/pages/ai-analysis";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/matters" component={Matters} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/alerts" component={CourtAlerts} />
      <Route path="/parties" component={Parties} />
      <Route path="/documents" component={Documents} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/billing" component={Billing} />
      <Route path="/ai-analysis" component={AiAnalysis} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              onMenuClick={() => setSidebarOpen(true)}
              isMobile={isMobile}
            />
            
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
