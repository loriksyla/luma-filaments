import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AdvisorRequest, PrintSettings } from '../types';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key not found in environment variables");
        throw new Error("API Key is missing");
    }
    return new GoogleGenAI({ apiKey });
}

const printSettingsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nozzleTemp: { type: Type.STRING, description: "Recommended nozzle temperature range (e.g., 200-220°C)" },
    bedTemp: { type: Type.STRING, description: "Recommended bed temperature range" },
    speed: { type: Type.STRING, description: "Recommended print speed range" },
    fanSpeed: { type: Type.STRING, description: "Cooling fan percentage" },
    retraction: { type: Type.STRING, description: "Retraction distance and speed suggestions" },
    expertTip: { type: Type.STRING, description: "A concise, expert tip for this specific combination" },
  },
  required: ["nozzleTemp", "bedTemp", "speed", "fanSpeed", "retraction", "expertTip"],
};

export const getPrintAdvice = async (request: AdvisorRequest): Promise<PrintSettings> => {
  try {
    const ai = getClient();
    const prompt = `
      I am a 3D printing enthusiast.
      Printer: ${request.printerModel || "Generic FDM Printer"}
      Filament: ${request.filamentType}
      Intended Use/Object: ${request.application || "General Purpose"}

      Provide optimal slicer settings and a pro tip. Keep it concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: printSettingsSchema,
        systemInstruction: "You are a world-class materials engineer specializing in additive manufacturing. Provide precise, safe, and optimal settings.",
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response from AI");
    }
    
    return JSON.parse(text) as PrintSettings;
  } catch (error) {
    console.error("Gemini Service Error:", error);
    // Return safe fallback defaults if AI fails
    return {
      nozzleTemp: "200-220°C",
      bedTemp: "60°C",
      speed: "50-60 mm/s",
      fanSpeed: "100%",
      retraction: "5mm @ 45mm/s",
      expertTip: "Ensure your bed is leveled perfectly before starting. (AI Offline Mode)",
    };
  }
};
