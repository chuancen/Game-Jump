import { GoogleGenAI } from "@google/genai";
import { AnnouncerMessage } from "../types.ts";

// Professional and encouraging messages for fallback
const FALLBACK_MESSAGES = {
  start: [
    "Ascension protocol initiated. Safe climbing, operative.",
    "System online. Monitoring your progress in the grid.",
    "Good luck. The higher you go, the better the data.",
    "Neon Ascent ready. You've got this.",
  ],
  milestone: [
    "Incredible progress! New altitude record confirmed.",
    "Your reflexes are peak-performance. Keep it up!",
    "Exceptional climbing. Sector data is looking perfect.",
    "Milestone reached. You're becoming a legend in the grid.",
  ],
  death: [
    "Connection lost. Re-establishing link for next attempt.",
    "A valiant effort. Let's analyze and try again.",
    "Critical error, but your performance was noted. Re-entry suggested.",
    "You were doing great. Ready for another run?",
  ],
  level_up: [
    "Security clearance increased. You have leveled up!",
    "Performance profile upgraded. Rank progression confirmed.",
    "System synchronization improved. New level reached.",
    "Your neural link is strengthening. Ascension level up."
  ]
};

const getRandomFallback = (reason: 'death' | 'milestone' | 'start' | 'level_up') => {
  const messages = FALLBACK_MESSAGES[reason];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getAnnouncerCommentary = async (
  score: number, 
  reason: 'death' | 'milestone' | 'start' | 'level_up'
): Promise<AnnouncerMessage> => {
  try {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = reason === 'death' 
      ? `The player reached a score of ${score} before failing. Give a polite, professional, and encouraging message to motivate them to try again in 15 words or less.`
      : reason === 'milestone'
      ? `The player reached a score of ${score}. Give a highly supportive, hype-filled encouraging message in 15 words or less.`
      : reason === 'level_up'
      ? `The player just leveled up. Congratulate them on their rank advancement in the Neon Ascent grid in 15 words or less.`
      : `The game is starting. Give a professional and welcoming mission briefing for the Neon Ascent in 10 words or less.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are AURORA, a highly supportive, professional, and encouraging AI tactical assistant. You use futuristic terminology but remain polite and motivational. You never insult the player.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    return {
      text: text.trim(),
      type: (reason === 'milestone' || reason === 'level_up') ? 'praise' : 'neutral'
    };

  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429;
    if (isRateLimit) console.warn("Aurora AI: Quota reached. Using local tactical logs.");

    return {
      text: getRandomFallback(reason),
      type: (reason === 'milestone' || reason === 'level_up') ? 'praise' : 'neutral'
    };
  }
};