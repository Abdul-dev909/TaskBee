import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatInterfaceProps {
  jobId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  jobTitle: string;
}

export const ChatInterface = ({
  jobId,
  currentUserId,
  otherUserId,
  otherUserName,
  jobTitle,
}: ChatInterfaceProps) => {
  const { messages, loading, sendMessage } = useMessages(jobId, currentUserId);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    await sendMessage(otherUserId, newMessage, "User");
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <Card className="p-4 rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{otherUserName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUserName}</h3>
            <p className="text-sm text-muted-foreground">{jobTitle}</p>
          </div>
        </div>
      </Card>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/5" ref={scrollAreaRef}>
        {/* Elegant background pattern */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative z-10">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-md px-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-primary/20">
                    <Send className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Start the Conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Send a message to begin chatting about this job. Your messages will appear here in real-time.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isSender = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSender ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 backdrop-blur-sm ${
                        isSender
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-card/80 border border-border/50 shadow-md"
                      }`}
                    >
                      <p className="text-sm break-words">{message.message_text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <Card className="p-4 rounded-none border-x-0 border-b-0">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};