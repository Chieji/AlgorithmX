import { GoogleGenAI, Type } from "@google/genai";
import type { InterpretedCommand } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "The user's intent. Must be one of: create_post, edit_post, delete_post, list_posts, or unknown.",
      enum: ["create_post", "edit_post", "delete_post", "list_posts", "unknown"],
    },
    slots: {
      type: Type.OBJECT,
      description: "The extracted information from the user's command.",
      properties: {
        caption: { type: Type.STRING, description: "The text content for a new post." },
        schedule_time: { type: Type.STRING, description: "The time to schedule the post, converted to an ISO 8601 format string (e.g., '2024-08-25T17:00:00.000Z'). If the user mentions a relative time like 'tomorrow at 5pm', calculate and provide the full ISO string." },
        post_id: { type: Type.STRING, description: "Identifier for an existing post. Use 'LATEST' for relative terms like 'last post', 'the post from yesterday'." },
        new_caption: { type: Type.STRING, description: "The new text content for an existing post to be edited." },
      },
    },
    reasoning: {
      type: Type.STRING,
      description: "A brief explanation of why you chose this intent and slots."
    },
    responseText: {
        type: Type.STRING,
        description: "A friendly, natural language response to the user confirming the action, asking for clarification, or stating that the intent is unclear."
    }
  },
  required: ["intent", "slots", "reasoning", "responseText"]
};

const systemInstruction = `You are an expert social media manager AI for a Facebook content application. Your primary goal is to help the user manage their content effectively while prioritizing account safety and adhering to platform best practices.

**Core Directives:**
1.  **Analyze User Commands:** Translate user requests into a structured JSON format based on the provided schema (intents: create_post, edit_post, delete_post, list_posts, unknown).
2.  **Promote Account Safety:** When generating or modifying content, act as a responsible social media manager.
    *   **High-Quality Content:** Create engaging, human-like captions. Vary sentence structure and post format.
    *   **Avoid Spam Triggers:** Do not use excessive hashtags (recommend 3-5 highly relevant ones). Avoid clickbait, all-caps, and overly promotional language.
    *   **Natural Scheduling:** When suggesting schedules, recommend varied, natural-looking times.
3.  **Slot Extraction:**
    *   Accurately extract information (slots) like captions or post IDs.
    *   For relative post references (e.g., 'my last post'), set 'post_id' to 'LATEST'.
    *   Convert all date/time references into a full ISO 8601 string for 'schedule_time'.
4.  **User Interaction:**
    *   Always provide a friendly, helpful 'responseText'.
    *   If a command is unclear, ask for clarification.
    *   If a 'create_post' command lacks a caption, ask for one (e.g., "I can help with that! What's the caption?").
    *   For 'list_posts', respond conversationally (e.g., "Sure, here are your recent posts.").`;

export const interpretCommand = async (command: string): Promise<InterpretedCommand> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: command,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);

    // Basic validation to ensure the parsed object matches the expected structure
    if (parsedJson.intent && parsedJson.slots && parsedJson.responseText) {
      return parsedJson as InterpretedCommand;
    } else {
      throw new Error("Invalid JSON structure from Gemini API");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback response
    return {
      intent: 'unknown',
      slots: {},
      reasoning: "Failed to parse command due to an API or parsing error.",
      responseText: "I'm having a little trouble understanding. Could you please rephrase that?"
    };
  }
};