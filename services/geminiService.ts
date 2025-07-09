
import { GoogleGenAI } from "@google/genai";
import { Customer, Agent, Disposition } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set for Gemini. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateReportSummary = async (
    reportData: { customers: Customer[], agents: Agent[], dispositions: Disposition[] },
    reportType: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Gemini API key is not configured. Please set the API_KEY environment variable.";
    }

    const prompt = `
        You are a data analyst for a fundraising company called PFFPNC.
        Analyze the following data for a "${reportType}" report and provide a concise summary with actionable insights.

        Data Overview:
        - Total Customers: ${reportData.customers.length}
        - Total Agents: ${reportData.agents.length}
        - Total Dispositions: ${reportData.dispositions.length}

        Key agents:
        ${reportData.agents.slice(0, 5).map(a => `- Agent ${a.agentNumber}: ${a.firstName} ${a.lastName}`).join('\n')}

        Key dispositions:
        ${reportData.dispositions.slice(0, 5).map(d => `- ${d.name} (Modifiers: ${d.modifiers.join(', ') || 'None'})`).join('\n')}

        Based on this data, what are the key trends, top-performing agents or strategies, and potential areas for improvement?
        Keep the summary under 200 words. Be professional and data-driven.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.5,
                topP: 0.95,
                topK: 64,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating report summary from Gemini:", error);
        return "An error occurred while generating the AI summary. Please check the console for details.";
    }
};