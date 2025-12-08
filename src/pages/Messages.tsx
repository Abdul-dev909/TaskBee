import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface Conversation {
  jobId: string;
  jobTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setCurrentUserId(user.id);

        // Get all messages where user is sender or receiver
        const { data: messages, error } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Group messages by job_id
        const jobMessages = new Map<string, any[]>();
        (messages || []).forEach((msg) => {
          const existing = jobMessages.get(msg.job_id) || [];
          existing.push(msg);
          jobMessages.set(msg.job_id, existing);
        });

        // Build conversations list
        const conversationsList: Conversation[] = [];

        for (const [jobId, msgs] of jobMessages) {
          const latestMsg = msgs[0]; // Already sorted by created_at desc
          const otherUserId = latestMsg.sender_id === user.id 
            ? latestMsg.receiver_id 
            : latestMsg.sender_id;

          // Count unread messages
          const unreadCount = msgs.filter(
            (m) => m.receiver_id === user.id && !m.is_read
          ).length;

          // Get job details
          const { data: job } = await supabase
            .from("jobs")
            .select("title, posted_by")
            .eq("id", jobId)
            .single();

          // Get other user's name
          let otherUserName = "Unknown User";
          let otherUserAvatar: string | undefined;

          // Check if other user is a provider
          const { data: providerProfile } = await supabase
            .from("provider_profiles")
            .select("full_name, profile_image_url")
            .eq("user_id", otherUserId)
            .single();

          if (providerProfile) {
            otherUserName = providerProfile.full_name;
            otherUserAvatar = providerProfile.profile_image_url || undefined;
          } else {
            // Check profiles table
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", otherUserId)
              .single();

            if (profile) {
              otherUserName = profile.full_name || "Homeowner";
            }
          }

          conversationsList.push({
            jobId,
            jobTitle: job?.title || "Unknown Job",
            otherUserId,
            otherUserName,
            otherUserAvatar,
            lastMessage: latestMsg.message_text,
            lastMessageTime: latestMsg.created_at,
            unreadCount,
          });
        }

        setConversations(conversationsList);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel("messages-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleBackClick = async () => {
    if (!currentUserId) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)
      .single();

    if (roleData?.role === "service_provider") {
      navigate("/provider-dashboard");
    } else if (roleData?.role === "homeowner") {
      navigate("/homeowner-dashboard");
    } else {
      navigate("/");
    }
  };

  const openChat = (jobId: string) => {
    navigate(`/chat?job=${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <div className="container mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground text-center text-sm">
                When you start a conversation with a homeowner or service provider, it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv, index) => (
              <motion.div
                key={conv.jobId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="glass-card cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => openChat(conv.jobId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.otherUserAvatar} alt={conv.otherUserName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.otherUserName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold truncate">{conv.otherUserName}</h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(conv.lastMessageTime), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Re: {conv.jobTitle}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm truncate text-foreground/80">
                            {conv.lastMessage}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}