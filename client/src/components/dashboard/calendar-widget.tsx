import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, isToday, isSameDay } from "@/lib/date-utils";

export default function CalendarWidget() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: hearings = [] } = useQuery({
    queryKey: ["/api/hearings/date-range", {
      startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString(),
      endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString(),
    }],
  });

  const { data: todaysHearings = [] } = useQuery({
    queryKey: ["/api/hearings/today"],
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
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

  return (
    <Card data-testid="calendar-widget">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Calendar & Diary</CardTitle>
            <p className="text-sm text-muted-foreground">Conflict detection & cause-list integration</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-sync-google-calendar">
              <i className="fab fa-google mr-2"></i>
              Sync Google Calendar
            </Button>
            <Button variant="outline" size="sm" data-testid="button-print-day-sheet">
              <i className="fas fa-print mr-2"></i>
              Print Day Sheet
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mini Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  data-testid="button-prev-month"
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <h3 className="font-semibold text-foreground">
                  {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  data-testid="button-next-month"
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["S", "M", "T", "W", "T", "F", "S"].map(day => (
                  <div key={day} className="text-muted-foreground font-semibold py-2">
                    {day}
                  </div>
                ))}
                
                {monthDays.map((date, index) => {
                  const dayHearings = getHearingsForDate(date);
                  const isCurrentDay = isToday(date);
                  const isCurrentMonthDay = isCurrentMonth(date);

                  return (
                    <div
                      key={index}
                      className={`
                        relative p-2 h-8 rounded cursor-pointer hover:bg-muted/50 transition text-xs
                        ${!isCurrentMonthDay ? "text-muted-foreground" : "text-foreground"}
                        ${isCurrentDay ? "bg-primary text-primary-foreground font-bold" : ""}
                      `}
                      onClick={() => setSelectedDate(date)}
                      data-testid={`calendar-day-${date.getDate()}`}
                    >
                      <div>{date.getDate()}</div>
                      {dayHearings.length > 0 && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-warning rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span className="text-muted-foreground">Has Hearings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">This Week's Schedule</h3>
              <Button variant="ghost" size="sm" data-testid="button-view-month">
                View Month
              </Button>
            </div>

            <div className="space-y-3">
              {/* Today's Schedule */}
              <div className="border-l-4 border-primary pl-4 py-2">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Today - {formatDate(new Date())}
                </p>
                <div className="space-y-2">
                  {todaysHearings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hearings scheduled</p>
                  ) : (
                    todaysHearings.map((hearing: any) => (
                      <div key={hearing.id} className="flex items-center space-x-3 text-sm">
                        <span className="text-muted-foreground w-16">{hearing.time}</span>
                        <span className="text-foreground">{hearing.matter?.caseNo} - {hearing.court}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Hearings */}
              {hearings
                .filter((h: any) => new Date(h.date) > new Date())
                .slice(0, 3)
                .map((hearing: any) => (
                <div key={hearing.id} className="border-l-4 border-border pl-4 py-2">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {formatDate(hearing.date)}
                  </p>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-muted-foreground w-16">{hearing.time}</span>
                    <span className="text-foreground">{hearing.matter?.caseNo} - {hearing.court}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Conflict Detection Alert */}
            <Card className="border-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-exclamation-triangle text-warning text-xl mt-1"></i>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Potential Conflict Detected</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Multiple hearings scheduled at similar times. Review your calendar for conflicts.
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-sm text-primary hover:underline"
                      data-testid="button-resolve-conflict"
                    >
                      Resolve Conflict →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
