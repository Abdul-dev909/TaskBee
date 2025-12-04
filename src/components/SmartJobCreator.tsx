import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Check, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface JobData {
  title: string;
  category: string;
  description: string;
  budget?: string;
  city: string;
  urgency?: string;
}

interface SmartJobCreatorProps {
  onJobCreated?: () => void;
  onClose?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-job-creator`;

export const SmartJobCreator = ({ onJobCreated, onClose }: SmartJobCreatorProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Smart Job Creator assistant. Tell me what service you need help with, and I'll create a professional job posting for you. What do you need done around your home?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseStreamForToolCalls = (fullResponse: string): JobData | null => {
    try {
      // Look for tool call in the response
      const toolCallMatch = fullResponse.match(/create_job[^{]*({[^}]+})/);
      if (toolCallMatch) {
        return JSON.parse(toolCallMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let extractedJobData: JobData | null = null;

      const updateAssistant = (content: string) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Check for tool calls
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
              const toolCall = toolCalls[0];
              if (toolCall.function?.name === "create_job" && toolCall.function?.arguments) {
                try {
                  extractedJobData = JSON.parse(toolCall.function.arguments);
                } catch {
                  // Arguments might be streaming, accumulate them
                }
              }
            }

            // Check for finish reason with tool calls
            const finishReason = parsed.choices?.[0]?.finish_reason;
            if (finishReason === "tool_calls") {
              // Get the complete tool call from the message
              const toolCallsComplete = parsed.choices?.[0]?.message?.tool_calls;
              if (toolCallsComplete && toolCallsComplete.length > 0) {
                try {
                  extractedJobData = JSON.parse(toolCallsComplete[0].function.arguments);
                } catch (e) {
                  console.error("Failed to parse tool call arguments:", e);
                }
              }
            }

            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // If we extracted job data, set it
      if (extractedJobData) {
        setJobData(extractedJobData);
        if (!assistantContent.trim()) {
          const confirmMessage = `I've prepared your job listing! Here's what I've created based on our conversation. Please review the details below and click "Post Job" when you're ready.`;
          updateAssistant(confirmMessage);
        }
      }

    } catch (error) {
      console.error("Smart job creator error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostJob = async () => {
    if (!jobData) return;

    setIsPosting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not Authenticated",
          description: "Please log in to post a job",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("jobs" as any).insert([{
        title: jobData.title,
        category: jobData.category,
        description: jobData.description,
        budget: jobData.budget || null,
        city: jobData.city,
        posted_by: session.user.id,
      }] as any);

      if (error) throw error;

      toast({
        title: "Job Posted Successfully!",
        description: "Your job is now live and service providers can see it.",
      });

      setJobData(null);
      onJobCreated?.();
      
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast({
        title: "Failed to Post Job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const resetConversation = () => {
    setMessages([{
      role: "assistant",
      content: "Hi! I'm your Smart Job Creator assistant. Tell me what service you need help with, and I'll create a professional job posting for you. What do you need done around your home?",
    }]);
    setJobData(null);
    setInput("");
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      plumber: "🔧",
      electrician: "⚡",
      cleaner: "🧹",
      painter: "🎨",
      handyman: "🔨",
      carpenter: "🪚",
    };
    return icons[category] || "🏠";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Smart Job Creator</CardTitle>
              <p className="text-sm text-muted-foreground">AI-powered job posting assistant</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-[300px] overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-2xl px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Job Preview Card */}
        <AnimatePresence>
          {jobData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-primary/10 p-4 bg-gradient-to-br from-primary/5 to-secondary/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Job Preview</span>
              </div>

              <div className="bg-background rounded-xl p-4 space-y-3 border border-primary/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{jobData.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryIcon(jobData.category)} {jobData.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        📍 {jobData.city}
                      </Badge>
                      {jobData.budget && (
                        <Badge variant="outline" className="text-xs">
                          💰 {jobData.budget}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{jobData.description}</p>

                {jobData.urgency && (
                  <div className="text-xs text-muted-foreground">
                    ⏰ Urgency: {jobData.urgency === "immediate" ? "Immediate" : jobData.urgency === "within_week" ? "Within a week" : "Flexible"}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handlePostJob}
                  disabled={isPosting}
                  className="flex-1"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Post Job
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setJobData(null)}
                  disabled={isPosting}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="border-t border-primary/10 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you need help with..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="mt-2 text-xs text-muted-foreground"
            >
              Start Over
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
