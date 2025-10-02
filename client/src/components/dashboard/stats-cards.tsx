import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-24 mb-2"></div>
            <div className="skeleton h-8 w-12 mb-2"></div>
            <div className="skeleton h-3 w-32"></div>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Today's Hearings",
      value: stats?.todayHearings || 0,
      icon: "fas fa-gavel",
      color: "text-primary",
      change: stats?.todayHearings < 5 ? "2 less than yesterday" : "Same as yesterday",
      changeIcon: "fas fa-arrow-down",
      changeColor: "text-success"
    },
    {
      title: "Pending Tasks",
      value: stats?.pendingTasks || 0,
      icon: "fas fa-tasks",
      color: "text-warning",
      change: stats?.overdueTasks ? `${stats.overdueTasks} overdue` : "All on track",
      changeIcon: stats?.overdueTasks ? "fas fa-exclamation-circle" : "fas fa-check-circle",
      changeColor: stats?.overdueTasks ? "text-warning" : "text-success"
    },
    {
      title: "Court Alerts",
      value: stats?.newAlerts || 0,
      icon: "fas fa-bell",
      color: "text-destructive",
      change: "Urgent filing deadline",
      changeIcon: "fas fa-clock",
      changeColor: "text-destructive"
    },
    {
      title: "Active Matters",
      value: stats?.activeMatters || 0,
      icon: "fas fa-briefcase",
      color: "text-success",
      change: "3 new this week",
      changeIcon: "fas fa-plus",
      changeColor: "text-muted-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="p-4" data-testid={`stat-card-${index}`}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.title}</span>
              <i className={`${card.icon} ${card.color}`}></i>
            </div>
            <p className="text-3xl font-bold text-foreground" data-testid={`stat-value-${index}`}>
              {card.value}
            </p>
            <p className={`text-xs mt-1 ${card.changeColor}`}>
              <i className={`${card.changeIcon} mr-1`}></i>
              {card.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
