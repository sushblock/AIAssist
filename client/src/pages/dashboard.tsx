import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import AIInsights from "@/components/dashboard/ai-insights";
import HearingsList from "@/components/dashboard/hearings-list";
import CourtAlertsWidget from "@/components/dashboard/court-alerts-widget";
import MattersTable from "@/components/dashboard/matters-table";
import AIDocumentAnalysis from "@/components/dashboard/ai-document-analysis";
import CalendarWidget from "@/components/dashboard/calendar-widget";
import PartiesGrid from "@/components/dashboard/parties-grid";
import BillingSection from "@/components/dashboard/billing-section";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/user/current"],
    staleTime: Infinity,
  });

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata"
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="dashboard">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="dashboard-greeting">
            Good Morning, {user?.name || "Adv. Kumar"}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="current-date">
            <i className="fas fa-calendar-day mr-2"></i>
            {currentDate}
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button 
            className="btn btn-outline"
            data-testid="button-refresh"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Alerts
          </button>
          <button 
            className="btn btn-primary"
            data-testid="button-new-matter"
          >
            <i className="fas fa-plus mr-2"></i>
            New Matter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* AI Insights */}
      <AIInsights />

      {/* Two Column Layout: Hearings + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HearingsList />
        </div>
        <div className="space-y-6">
          <CourtAlertsWidget />
        </div>
      </div>

      {/* Matters Table */}
      <MattersTable />

      {/* AI Document Analysis */}
      <AIDocumentAnalysis />

      {/* Calendar Integration */}
      <CalendarWidget />

      {/* Parties Grid */}
      <PartiesGrid />

      {/* Billing Section */}
      <BillingSection />

      {/* Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-border text-sm text-muted-foreground">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <span>© 2025 LawMasters</span>
          <span>•</span>
          <span>Solo Plan</span>
          <span>•</span>
          <span>BCI Rule 36 Compliant</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-primary">Help & Support</a>
          <a href="#" className="hover:text-primary">Privacy Policy</a>
          <a href="#" className="hover:text-primary">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
