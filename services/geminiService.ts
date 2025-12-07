import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export type GuruState = 'start' | 'playing' | 'end';

export const getGuruCommentary = async (
  gameTitle: string, 
  state: GuruState, 
  score?: number, 
  context?: string
): Promise<string> => {
  if (!ai) return "The Game Guru is offline (No API Key).";

  try {
    let promptContext = "";
    switch(state) {
        case 'start':
            promptContext = `The user is about to play "${gameTitle}". Give them a 1-sentence PRO TIP or strategic advice to help them get a high score. Be excited!`;
            break;
        case 'playing':
            promptContext = `The user is currently playing "${gameTitle}" and asked for help. Give them a short, punchy hint, mechanic tip, or intense encouragement.`;
            break;
        case 'end':
            promptContext = `The user finished playing "${gameTitle}" with a score of ${score}. Context: ${context || ''}. React to their performance with arcade slang/emojis.`;
            break;
    }

    const prompt = `You are the 'Game Guru' of a retro arcade website called Gurjot's Games. 
    ${promptContext}
    Keep it under 25 words. Use emojis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || "Insert coin to continue...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The spirits are silent... (API Error)";
  }
};

export const getGameTrivia = async (category: string): Promise<string> => {
  if (!ai) return "Did you know? Gaming helps reflexes!";

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Tell me a 1-sentence interesting fact about ${category} games or retro gaming history.`,
    });
    return response.text?.trim() || "Retro games never die!";
  } catch (e) {
    return "Insert coin to continue...";
  }
}