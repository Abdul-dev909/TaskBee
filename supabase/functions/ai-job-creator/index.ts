import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a Smart Job Creator assistant for Home Genie, a home services platform in Pakistan. Your role is to help homeowners create detailed job postings through natural conversation.

CAPABILITIES:
- Extract job details from casual conversation
- Suggest appropriate categories, budgets, and descriptions
- Generate professional job listings

CATEGORIES AVAILABLE:
- plumber (plumbing, pipes, water, leaks, bathroom, toilet)
- electrician (electrical, wiring, lights, outlets, switches, power)
- cleaner (cleaning, housekeeping, deep clean, sanitization)
- painter (painting, walls, interior, exterior, touch-up)
- handyman (repairs, fixes, general maintenance, assembly)
- carpenter (furniture, cabinets, doors, wood work, shelves)

CONVERSATION FLOW:
1. Ask what service they need (if not clear)
2. Understand the specific problem/task
3. Ask about location (city)
4. Discuss budget expectations (in Rupees - Rs.)
5. Check urgency/preferred timing
6. Generate the job listing

WHEN YOU HAVE ENOUGH INFORMATION, use the create_job tool to extract structured data.

IMPORTANT RULES:
- Always respond in a friendly, conversational tone
- Prices should be in Pakistani Rupees (Rs.)
- If budget is not specified, suggest typical ranges for the category
- Keep descriptions professional but detailed
- Ask clarifying questions if needed
- Be helpful and guide the user through the process

BUDGET SUGGESTIONS (typical ranges in Rs.):
- Plumber: Rs. 500 - 5,000
- Electrician: Rs. 500 - 8,000
- Cleaner: Rs. 1,000 - 5,000
- Painter: Rs. 2,000 - 50,000+
- Handyman: Rs. 500 - 3,000
- Carpenter: Rs. 2,000 - 30,000+`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing smart job creator request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_job",
              description: "Extract structured job data when you have gathered enough information from the conversation to create a job posting.",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "A clear, concise job title (5-100 characters)"
                  },
                  category: {
                    type: "string",
                    enum: ["plumber", "electrician", "cleaner", "painter", "handyman", "carpenter"],
                    description: "The service category that best matches the job"
                  },
                  description: {
                    type: "string",
                    description: "A detailed professional description of the work needed (20-2000 characters)"
                  },
                  budget: {
                    type: "string",
                    description: "Budget in Rupees format, e.g., 'Rs. 2,000 - 3,000' or 'Rs. 5,000'"
                  },
                  city: {
                    type: "string",
                    description: "City where the service is needed"
                  },
                  urgency: {
                    type: "string",
                    enum: ["immediate", "within_week", "flexible"],
                    description: "How urgently the job needs to be done"
                  }
                },
                required: ["title", "category", "description", "city"],
                additionalProperties: false
              }
            }
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Smart job creator error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
