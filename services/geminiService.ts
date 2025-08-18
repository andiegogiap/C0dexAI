
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Ensure API_KEY is available in the environment.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const runCodeInterpreter = async (
    prompt: string,
    currentPath: string,
    systemOrchestratorInstruction: string,
    aiSupervisorInstruction: string
): Promise<string> => {
    
    // Dynamically create the final system instruction
    const finalSystemInstruction = `
${aiSupervisorInstruction}

---

${systemOrchestratorInstruction.replace('{{currentPath}}', currentPath || 'root')}
`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: finalSystemInstruction,
                temperature: 0.5,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return `An error occurred while communicating with the AI. Please check the console for details. Make sure your API key is configured correctly.`;
    }
};
