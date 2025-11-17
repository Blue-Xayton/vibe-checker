import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Lovable AI for sentiment analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the given text and return a JSON response with this exact structure:
{
  "label": "positive" | "neutral" | "negative",
  "scores": {
    "positive": <float 0-1>,
    "neutral": <float 0-1>,
    "negative": <float 0-1>
  },
  "explanation": "<2-3 sentence explanation of why this sentiment was chosen>",
  "keywords": [
    {
      "token": "<word or phrase>",
      "polarity": "positive" | "negative" | "neutral",
      "score": <float 0-1>
    }
  ]
}

Rules:
- Scores must sum to 1.0
- Extract 3-5 most impactful keywords
- Explanation should be clear and specific to the text
- Only return valid JSON, no other text`
          },
          {
            role: 'user',
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the AI response
    let parsedResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?(.*?)\n?```/s) || content.match(/```\n?(.*?)\n?```/s);
      const jsonText = jsonMatch ? jsonMatch[1] : content;
      parsedResult = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // Calculate confidence as the score of the predicted label
    const confidence = parsedResult.scores[parsedResult.label];

    // Build the final result
    const result = {
      id: crypto.randomUUID(),
      text,
      label: parsedResult.label,
      scores: parsedResult.scores,
      confidence,
      explanation: parsedResult.explanation,
      keywords: parsedResult.keywords || [],
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-sentiment:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
