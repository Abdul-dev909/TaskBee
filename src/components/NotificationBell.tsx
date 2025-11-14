import { Bell, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationBellProps {
  userId: string | undefined;
}

export const NotificationBell = ({ userId }: NotificationBellProps) => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications(userId);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'message' && notification.related_id) {
      navigate(`/chat?job=${notification.related_id}`);
    } else if (notification.type === 'offer' && notification.related_id) {
      navigate(`/job/${notification.related_id}`);
    } else if (notification.type === 'job_update' && notification.related_id) {
      navigate(`/job/${notification.related_id}`);
    } else if (notification.type === 'complaint' && notification.related_id) {
      navigate('/homeowner/settings');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'offer':
      case 'job_offer':
        return '📝';
      case 'job_update':
      case 'job_status_update':
        return '🔔';
      case 'complaint':
        return '⚠️';
      case 'admin':
        return '📢';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-200"
        >
          <Bell className="h-5 w-5 text-foreground/80 hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 h-5 w-5 p-0 flex items-center justify-center text-xs font-semibold rounded-full shadow-lg animate-pulse border-2 border-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 shadow-xl border-border/50">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-base">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 hover:bg-accent"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-2" />
        <ScrollArea className="h-[450px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-4 cursor-pointer flex items-start gap-3 hover:bg-accent/30 transition-colors group ${
                    !notification.is_read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        {notification.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2 font-medium">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};