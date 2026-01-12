import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

@Injectable({ providedIn: 'root' })
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize with the environment variable API key
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  async parseTransactionIntent(text: string): Promise<{ amount: number; description: string; date?: string } | null> {
    if (!text || text.length < 3) return null;

    try {
      const prompt = `
        You are a helper for a merchant ledger app. 
        Extract the transaction details from this text: "${text}".
        Return ONLY a raw JSON object (no markdown, no backticks) with these keys:
        - amount: number (required)
        - description: string (summary of items or reason)
        - date: string (ISO 8601 YYYY-MM-DD if mentioned, otherwise null)
        
        Example input: "200 for milk and eggs"
        Example output: { "amount": 200, "description": "Milk and eggs", "date": null }
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const rawText = response.text.trim();
      // Remove any potential markdown formatting if the model adds it despite instructions
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('AI Parsing failed', e);
      return null;
    }
  }
}