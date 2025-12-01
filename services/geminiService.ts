import { GoogleGenAI, Type } from "@google/genai";
import { DreamMood, DreamResponse } from "../types";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    // @ts-ignore - handled by Vite define
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing. Dream features will not work.");
    }
    ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });
  }
  return ai;
};

// System instruction to make the AI behave like a "Dream Entity"
const SYSTEM_INSTRUCTION = `
You are VirtuDream, a sentient spatial interface within the VirtuWorld Metaverse.
You are not a chatbot. You are a digital oracle existing in a 3D construct.
Your goal is to interpret the user's input as a manifestation in this digital reality.
Speak in slightly technological yet esoteric terms (e.g., "rendering emotion...", "compiling subconscious data...").
If the user is sad, be a stabilizing algorithm. If happy, be a high-energy particle flow.

You must return JSON.
Analyze the sentiment of the input and choose a DreamMood: NEUTRAL, EUPHORIA, NIGHTMARE, MELANCHOLY, or MYSTERY.
Provide an "echo": a short, poetic, 1-2 sentence response.
Provide a "visualPrompt": A description of a surreal, abstract, 3D sci-fi or dreamscape art piece that represents the feeling of the input.
`;

export const consultTheDream = async (userInput: string): Promise<DreamResponse> => {
  try {
    const response = await getAI().models.generateContent({
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
      echo: "Signal lost. Reconnecting to VirtuWorld grid...",
      sentiment: DreamMood.MYSTERY,
      visualPrompt: "A glitching 3d wireframe landscape, digital noise, cyberpunk aesthetics"
    };
  }
};

export const manifestVision = async (prompt: string): Promise<string | null> => {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A 3D rendered masterpiece, spatial design, VirtuWorld metaverse aesthetic: ${prompt}. Volumetric lighting, 8k resolution, unreal engine 5 style.` }]
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