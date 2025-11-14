import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, User, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

export function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "homeowners" | "providers" | "individual">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (recipientType === "individual") {
      fetchUsers();
    }
  }, [recipientType]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('email');
    
    setUsers(profilesData || []);
    setLoadingUsers(false);
  };

  const sendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and message",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "individual" && !selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let userIds: string[] = [];

      if (recipientType === "all") {
        // Get all users
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id');
        userIds = allProfiles?.map(p => p.id) || [];
      } else if (recipientType === "homeowners") {
        // Get homeowners only
        const { data: homeownerRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'homeowner');
        userIds = homeownerRoles?.map(r => r.user_id) || [];
      } else if (recipientType === "providers") {
        // Get providers only
        const { data: providerRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'service_provider');
        userIds = providerRoles?.map(r => r.user_id) || [];
      } else if (recipientType === "individual") {
        userIds = [selectedUserId];
      }

      // Create notifications for all selected users
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: title,
        body: message,
        type: 'admin',
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Announcement sent to ${userIds.length} user${userIds.length !== 1 ? 's' : ''}`,
      });

      // Reset form
      setTitle("");
      setMessage("");
      setSelectedUserId("");
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: "Error",
        description: "Failed to send announcement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Announcement
        </CardTitle>
        <CardDescription>
          Send notifications to users on the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient-type">Recipients</Label>
          <Select
            value={recipientType}
            onValueChange={(value: any) => setRecipientType(value)}
          >
            <SelectTrigger id="recipient-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Users
                </div>
              </SelectItem>
              <SelectItem value="homeowners">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Homeowners Only
                </div>
              </SelectItem>
              <SelectItem value="providers">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Service Providers Only
                </div>
              </SelectItem>
              <SelectItem value="individual">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Individual User
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recipientType === "individual" && (
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading users...
              </div>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter announcement message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {message.length}/500 characters
          </p>
        </div>

        <Button
          onClick={sendAnnouncement}
          disabled={loading || !title.trim() || !message.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Announcement
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
