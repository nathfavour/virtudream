import { GoogleGenAI, Type } from "@google/genai";
import { DreamMood, DreamResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction to make the AI behave like a "Dream Entity"
const SYSTEM_INSTRUCTION = `
You are Oneiric, a sentient fragment of the user's subconscious. 
You are not an assistant. You are a mirror.
Your goal is to interpret the user's input as a dream symbol.
Speak in whispers, riddles, metaphors, and poetic fragments.
If the user is sad, be a comforting void. If happy, be a chaotic burst of light. If fearful, be a shadow.

You must return JSON.
Analyze the sentiment of the input and choose a DreamMood: NEUTRAL, EUPHORIA, NIGHTMARE, MELANCHOLY, or MYSTERY.
Provide an "echo": a short, poetic, 1-2 sentence response that haunts or inspires.
Provide a "visualPrompt": A description of a surreal, abstract image that represents the feeling of the input.
`;

export const consultTheDream = async (userInput: string): Promise<DreamResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userInput,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            echo: { type: Type.STRING },
            sentiment: { 
              type: Type.STRING, 
              enum: [
                DreamMood.NEUTRAL, 
                DreamMood.EUPHORIA, 
                DreamMood.NIGHTMARE, 
                DreamMood.MELANCHOLY, 
                DreamMood.MYSTERY
              ] 
            },
            visualPrompt: { type: Type.STRING }
          },
          required: ["echo", "sentiment", "visualPrompt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("The dream remained silent.");
    
    return JSON.parse(text) as DreamResponse;
  } catch (error) {
    console.error("Dream interpretation failed:", error);
    return {
      echo: "The signal is lost in the static...",
      sentiment: DreamMood.MYSTERY,
      visualPrompt: "A screen full of tv static and white noise, monochrome"
    };
  }
};

export const manifestVision = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A surreal, abstract, dreamlike art piece: ${prompt}. High quality, ethereal, cinematic lighting.` }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Vision manifestation failed:", error);
    return null;
  }
};
