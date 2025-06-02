// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node
import { config } from './config';
import {
    GoogleGenAI
} from '@google/genai';

const base64ImageFile = fs.readFileSync("./public/uploads/efde3503-5962-429f-a626-07374e60216d.png", {
    encoding: "base64",
});
import * as fs from "node:fs";

async function main() {
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
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
                    text: `ok so this one’s from the night when 4 of them went out — amit, pratik, sneha, and kavya

  amit was craving something spicy so he straight up took the chicken angara, no one else even touched it
  pratik went a little fancy — he grabbed the seekh and also tried the nilgiri green curry, he said it looked interesting
  sneha, as usual, stuck with the vegetarian options — she had the shakarkand chaat and the purvanchal something (nobody even knows what that was, she said it tasted fine)
  kavya being a bong obviously went with the bangali chanar dalna — she kept praising it through the meal

  for the breads — the 3 rotis were split between sneha and kavya, they’re the roti gang
  amit and pratik shared the 3 parathas — classic combo with their dishes
  and that lone garlic naan, sneha ordered it just to try, ate like half, the rest got left behind lol

  they all chipped in for the service charge and gst, but food-wise everyone mostly stuck to their own plates
  `,
                },
            ],
        }
    ];

    const response = await ai.models.generateContent({
        model,
        config,
        contents,
    });

    console.log(response.text)
}

main();
