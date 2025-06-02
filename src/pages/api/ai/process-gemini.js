import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import path from 'path';
import { config } from './config';
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrl, userInput } = req.body;

    if (!imageUrl || !userInput) {
        return res.status(400).json({ error: 'Image URL and user input are required' });
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        // Convert relative URL to absolute file path
        const imagePath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
        const base64ImageFile = fs.readFileSync(imagePath, {
            encoding: "base64",
        });

        const model = 'gemini-2.5-flash-preview-05-20';
        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: base64ImageFile,
                        },
                    },
                    {
                        text: userInput,
                    },
                ],
            }
        ];

        const response = await ai.models.generateContent({
            model,
            config,
            contents,
        });

        res.status(200).json({ result: response.text });
    } catch (error) {
        console.error('Gemini processing error:', error);
        res.status(500).json({ error: 'Failed to process with Gemini' });
    }
}