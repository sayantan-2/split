import {
  GoogleGenAI,
  Type,
  createUserContent,
  createPartFromUri
} from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the function declaration for updating payment
export const updatePaymentFunction = {
  name: 'update_payment',
  description: 'Update payment information based on receipt and edit instructions',
  parameters: {
    type: Type.OBJECT,
    properties: {
      payment: {
        type: Type.OBJECT,
        description: 'The updated payment object',
        properties: {
          id: { type: Type.STRING, description: 'Unique ID of the payment' },
          name: { type: Type.STRING, description: 'Name of the payment' },
          currency: { type: Type.STRING, description: 'Currency code (e.g., USD, INR)' },
          items: {
            type: Type.ARRAY,
            description: 'List of items in the payment',
            item: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Name of the item' },
                unitPrice: { type: Type.NUMBER, description: 'Price per unit' },
                quantity: { type: Type.NUMBER, description: 'Number of units' },
                discountPercentage: { type: Type.NUMBER, description: 'Discount percentage' },
                taxPercentage: { type: Type.NUMBER, description: 'Tax percentage' },
              },
              required: ['name', 'unitPrice', 'quantity']
            }
          },
          description: { type: Type.STRING, description: 'Optional description' },
        },
        required: ['id', 'name', 'currency', 'items']
      }
    },
    required: ['payment']
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { receiptUrl, prompt, payment: paymentJson } = req.query;

    if (!receiptUrl || !prompt || !paymentJson) {
      return res.status(400).json({
        error: 'Missing required parameters: receiptUrl, prompt, and payment are required'
      });
    }

    let payment;
    try {
      payment = JSON.parse(paymentJson);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid payment JSON' });
    }

    try {
      // Upload the receipt image
      const file = await ai.files.upload({
        file: receiptUrl,
        config: { mimeType: 'image/jpeg' },
      });

      // Create the user content with image and text
      const content = createUserContent([
        createPartFromUri(file.uri, file.mimeType),
        `Current payment details: ${JSON.stringify(payment, null, 2)}\n\nEdit instructions: ${prompt}`
      ]);

      // Call the AI model with function calling
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: content,
        config: {
          tools: [{
            functionDeclarations: [updatePaymentFunction]
          }],
          toolConfig: {
            functionCallingConfig: {
              mode: 'AUTO',
              allowedFunctionNames: ['update_payment']
            }
          }
        }
      });

      // Process the response
      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];
        if (functionCall.name === 'update_payment') {
          return res.status(200).json(functionCall.args.payment);
        }
      }

      // Fallback to text response if no function call
      return res.status(200).json({
        message: 'No function call in response',
        text: response.text
      });

    } catch (error) {
      console.error('Error processing payment edit:', error);
      return res.status(500).json({
        error: 'Failed to process payment edit',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error in payment edit handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}