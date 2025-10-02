import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, isToday, isSameDay } from "@/lib/date-utils";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  const { data: hearings = [], isLoading } = useQuery({
    queryKey: ["/api/hearings/date-range", {
      startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString(),
      endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString(),
    }],
  });

  const { data: todaysHearings = [] } = useQuery({
    queryKey: ["/api/hearings/today"],
    refetchInterval: 60000,
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    return days;
  };

  const getHearingsForDate = (date: Date) => {
    return hearings.filter((hearing: any) => 
      isSameDay(new Date(hearing.date), date)
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const monthDays = getDaysInMonth(selectedDate);
  const isCurrentMonth = (date: Date) => date.getMonth() === selectedDate.getMonth();

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="calendar-loading">
        <div className="skeleton h-8 w-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="skeleton h-96"></div>
          </div>
          <div className="skeleton h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="calendar-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar & Diary</h1>
          <p className="text-muted-foreground mt-1">Manage hearings and schedule conflicts</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" data-testid="button-sync-google">
            <i className="fab fa-google mr-2"></i>
            Sync Google Calendar
          </Button>
          <Button variant="outline" size="sm" data-testid="button-print-daysheet">
            <i className="fas fa-print mr-2"></i>
            Print Day Sheet
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList>
          <TabsTrigger value="month" data-testid="tab-month">Month</TabsTrigger>
          <TabsTrigger value="week" data-testid="tab-week">Week</TabsTrigger>
          <TabsTrigger value="day" data-testid="tab-day">Day</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {selectedDate.toLocaleDateString("en-US", { 
                        month: "long", 
                        year: "numeric" 
                      })}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigateMonth("prev")}
                        data-testid="button-prev-month"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                        data-testid="button-today"
                      >
                        Today
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigateMonth("next")}
                        data-testid="button-next-month"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((date, index) => {
                      const dayHearings = getHearingsForDate(date);
                      const isCurrentDay = isToday(date);
                      const isCurrentMonthDay = isCurrentMonth(date);

                      return (
                        <div
                          key={index}
                          className={`
                            relative p-2 h-20 border border-border rounded cursor-pointer hover:bg-muted/50 transition
                            ${!isCurrentMonthDay ? "text-muted-foreground bg-muted/20" : ""}
                            ${isCurrentDay ? "bg-primary text-primary-foreground" : ""}
                          `}
                          onClick={() => setSelectedDate(date)}
                          data-testid={`calendar-day-${date.getDate()}`}
                        >
                          <div className="text-sm font-medium">{date.getDate()}</div>
                          {dayHearings.length > 0 && (
                            <div className="absolute bottom-1 left-1 right-1">
                              <div className="flex flex-wrap gap-1">
                                {dayHearings.slice(0, 2).map((hearing: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="w-2 h-2 bg-warning rounded-full"
                                    title={`${hearing.time} - ${hearing.matter?.caseNo}`}
                                  />
                                ))}
                                {dayHearings.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{dayHearings.length - 2}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Today</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warning rounded-full"></div>
                      <span className="text-muted-foreground">Has Hearings</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {todaysHearings.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-calendar-check text-3xl text-muted-foreground mb-2"></i>
                      <p className="text-sm text-muted-foreground">No hearings today</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaysHearings.map((hearing: any) => (
                        <div key={hearing.id} className="border-l-4 border-primary pl-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{hearing.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {hearing.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground font-semibold">{hearing.matter?.caseNo}</p>
                          <p className="text-xs text-muted-foreground">{hearing.purpose}</p>
                          <p className="text-xs text-muted-foreground">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {hearing.court} - {hearing.bench}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conflict Detection */}
              <Card className="border-warning bg-warning/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-warning">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Conflicts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    No scheduling conflicts detected for today.
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-add-hearing">
                    <i className="fas fa-plus mr-2"></i>
                    Add Hearing
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-check-causelist">
                    <i className="fas fa-list mr-2"></i>
                    Check Cause List
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-set-reminder">
                    <i className="fas fa-bell mr-2"></i>
                    Set Reminder
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <i className="fas fa-calendar-week text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-foreground mb-2">Week View</h3>
                <p className="text-muted-foreground">Week view implementation coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <i className="fas fa-calendar-day text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-foreground mb-2">Day View</h3>
                <p className="text-muted-foreground">Detailed day view implementation coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
