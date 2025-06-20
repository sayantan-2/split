import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import path from 'path';
import yaml from 'js-yaml';

// Load configuration from YAML file
const loadConfig = () => {
    try {
        const configPath = path.join(process.cwd(), 'src', 'pages', 'api', 'ai', 'config.yaml');
        const configFile = fs.readFileSync(configPath, 'utf8');
        return yaml.load(configFile);
    } catch (error) {
        console.error('Error loading config.yaml:', error);
        throw new Error('Failed to load AI configuration');
    }
};
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrl, userInput } = req.body;

    if (!imageUrl || !userInput) {
        return res.status(400).json({ error: 'Image URL and user input are required' });
    } try {
        const config = loadConfig();

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        // Convert relative URL to absolute file path
        const imagePath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
        const base64ImageFile = fs.readFileSync(imagePath, {
            encoding: "base64",
        });

        const model = 'gemini-2.5-flash';
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