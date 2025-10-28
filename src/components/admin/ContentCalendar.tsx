import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useArticles } from "@/hooks/useArticles";
import { Calendar, ChevronLeft, ChevronRight, Clock, Eye, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";

export const ContentCalendar = () => {
  const { data: articles = [] } = useArticles();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getArticlesForDay = (day: Date) => {
    return articles.filter(article => {
      const publishedDate = article.published_at ? new Date(article.published_at) : null;
      return publishedDate && isSameDay(publishedDate, day);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Content Calendar</h2>
            <p className="text-sm text-muted-foreground">Plan and schedule your content</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {daysInMonth.map((day, index) => {
          const dayArticles = getArticlesForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <Card
              key={index}
              className={`min-h-[120px] p-2 transition-all hover:shadow-md ${
                isCurrentDay ? 'ring-2 ring-primary bg-primary/5' : ''
              } ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}`}
            >
              <div className={`text-sm font-semibold mb-2 ${
                isCurrentDay ? 'text-primary' : 'text-foreground'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayArticles.slice(0, 2).map(article => (
                  <div
                    key={article.id}
                    className={`text-xs p-1.5 rounded border ${getStatusColor(article.status || 'draft')}`}
                  >
                    <div className="font-medium truncate">{article.title}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                      <Eye className="h-2.5 w-2.5" />
                      <span>{(article as any).views || 0}</span>
                    </div>
                  </div>
                ))}
                {dayArticles.length > 2 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{dayArticles.length - 2} more
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t">
        <span className="text-sm font-medium">Status:</span>
        <Badge className={getStatusColor('published')}>Published</Badge>
        <Badge className={getStatusColor('draft')}>Draft</Badge>
        <Badge className={getStatusColor('scheduled')}>Scheduled</Badge>
      </div>
    </Card>
  );
};
