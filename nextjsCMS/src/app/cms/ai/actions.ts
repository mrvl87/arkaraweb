"use server"

import { SURVIVAL_SYSTEM_PROMPT } from "@/components/ai/prompt-templates";

export async function generateAIContent(userPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured in environment variables.");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": siteUrl,
        "X-Title": "Arkara CMS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", // Fast and reliable for text
        messages: [
          { role: "system", content: SURVIVAL_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate AI content");
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: data.model,
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error(error instanceof Error ? error.message : "An unexpected error occurred");
  }
}
