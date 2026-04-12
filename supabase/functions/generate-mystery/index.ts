import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { duration } = await req.json();
    const isAllDay = duration === "all_day";
    const clueCount = isAllDay ? 35 : 20;

    const prompt = `Generate a ${isAllDay ? "3-4 hour" : "1.5-2 hour"} episodic mystery for a theme park adventure game.

TONE: Agatha Christie meets Murder She Wrote meets Inspector Gadget. Lighthearted, clever, family-friendly. Slightly edgy humor but nothing dark. Quirky characters with funny motives.

SETTING: A fictional generic theme park called "Adventure World" — rides, restaurants, gift shops. NO Disney references. NO real theme park names.

REQUIREMENTS:
- 5 distinct suspects with believable motives, alibis, personality quirks, and interrogation dialogue
- ${clueCount}+ total clues (mix of witness, evidence, location, motive categories)
- At least 3 red herrings that seem convincing
- 1 major plot twist that genuinely surprises
- 1 secondary mystery (sub-plot worth bonus points)
- Resolution that makes logical sense
- Each clue tied to zone_type: "ride_line", "restaurant", or "merchandise"
- Funny character names and quirky dialogue

Return ONLY valid JSON (no markdown, no explanation):
{
  "title": "The [Mystery Name]",
  "crime": "What happened (1 paragraph)",
  "introStory": "5 minute read setting the scene (3-4 paragraphs, use \\n\\n between)",
  "suspects": [
    {
      "id": "s1",
      "name": "Character Name",
      "role": "Their job at the park",
      "description": "Physical description + personality (2 sentences)",
      "motive": "Why they might have done it",
      "alibi": "Where they claim to have been",
      "isCulprit": false,
      "isAccomplice": false,
      "interrogation": {
        "about_crime": "What they say about the crime",
        "about_alibi": "Details of their alibi",
        "about_others": "What they say about other suspects",
        "contradiction": "A statement that contradicts evidence"
      }
    }
  ],
  "clues": [
    {
      "id": "c1",
      "text": "Detailed clue description (2-3 sentences)",
      "category": "witness|evidence|location|motive",
      "act": 1,
      "revealed": false,
      "isRedHerring": false,
      "points": 10,
      "zone": "ride_line|restaurant|merchandise"
    }
  ],
  "twist": "The twist description that changes everything (1 paragraph)",
  "secondaryMystery": "Sub-plot description and solution",
  "resolution": "Concluding narrative (2-3 paragraphs, use \\n\\n between)",
  "culpritId": "s2",
  "accompliceId": "s3",
  "motive": "The real motive",
  "method": "How they did it",
  "timeline": "Step-by-step what happened"
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 8000,
      }),
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content from GPT-4");

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse mystery JSON");

    const mystery = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ mystery }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Mystery generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate mystery", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
