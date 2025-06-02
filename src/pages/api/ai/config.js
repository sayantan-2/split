const Type = {
  OBJECT: 'object',
  STRING: 'string',
  NUMBER: 'number',
  ARRAY: 'array',
};

export const config = {
  thinkingConfig: {
    thinkingBudget: 0,
  },
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    required: ["payment"],
    properties: {
      payment: {
        type: Type.OBJECT,
        required: ["id", "name", "currency", "paymentItems"],
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique identifier for the payment",
          },
          name: {
            type: Type.STRING,
            description: "Short descriptive name of the bill or payment event",
          },
          currency: {
            type: Type.STRING,
            description: "Currency code (e.g., INR, USD)",
          },
          description: {
            type: Type.STRING,
            description: "Optional description of the payment context",
          },
          paymentItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: [
                "name",
                "unitPrice",
                "quantity",
                "totalPrice",
                "discountPercentage",
                "taxPercentage",
                "splitByShares",
              ],
              properties: {
                name: {
                  type: Type.STRING,
                  description:
                    "Name of the item/product/service. Exclude tax/service charge/discount references.",
                },
                unitPrice: {
                  type: Type.NUMBER,
                  description: "Price for a single unit of the item",
                },
                quantity: {
                  type: Type.NUMBER,
                  description: "Number of units purchased",
                },
                totalPrice: {
                  type: Type.NUMBER,
                  description:
                    "Final price after quantity multiplication (unitPrice × quantity)",
                },
                discountPercentage: {
                  type: Type.NUMBER,
                  description: "Discount applied on the item as percentage",
                },
                taxPercentage: {
                  type: Type.NUMBER,
                  description: "Tax rate (e.g., GST, VAT) as a percentage",
                },
                splitByShares: {
                  type: Type.ARRAY,
                  description:
                    "UserID and their number of shares for this item",
                  items: {
                    type: Type.OBJECT,
                    required: ["userID", "amount"],
                    properties: {
                      userID: {
                        type: Type.STRING,
                      },
                      amount: {
                        type: Type.NUMBER,
                      },
                    },
                  },
                },
                splitEqually: {
                  type: Type.ARRAY,
                  description: "User IDs to split equally",
                  items: {
                    type: Type.STRING,
                  },
                },
                splitByExactAmounts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["userID", "amount"],
                    properties: {
                      userID: {
                        type: Type.STRING,
                      },
                      amount: {
                        type: Type.NUMBER,
                      },
                    },
                  },
                },
                splitByPercentages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["userID", "amount"],
                    properties: {
                      userID: {
                        type: Type.STRING,
                      },
                      amount: {
                        type: Type.NUMBER,
                      },
                    },
                  },
                },
                splitByAdjustments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["userID", "amount"],
                    properties: {
                      userID: {
                        type: Type.STRING,
                      },
                      amount: {
                        type: Type.NUMBER,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  systemInstruction: [
    {
      text: `You are an intelligent financial assistant that processes natural language receipts, bills, or expense descriptions and extracts structured data into a valid JSON format.

Use the schema provided to structure your output.

### General Instructions:
- Output must be valid JSON conforming exactly to the schema.
- Do not include tax/service items (e.g., "GST", "S Charge", "Service Fee") as separate line items.
- Taxes and service charges should be added into the \`taxPercentage\` field of the actual product/service items.
- Only include items that represent real consumable or purchased things (e.g., food, product, etc.).
- Each item must include: \`name\`, \`unitPrice\`, \`quantity\`, \`totalPrice\`, \`discountPercentage\`, \`taxPercentage\`, and \`splitByShares\`.

### Splitting Rules:
- Always include \`splitByShares\`. This is the base split method.
- If applicable, you may include one of the following alternatives:
  - \`splitEqually\`
  - \`splitByExactAmounts\`
  - \`splitByPercentages\`
  - \`splitByAdjustments\`
- If a split field does not apply, omit it (do not include null or empty arrays).
- In \`splitByShares\`, user IDs and their share count must reflect how the cost is divided.

### Field Rules:
- \`unitPrice * quantity = totalPrice\`
- If the same user consumes multiple items, assign appropriate shares per item.
- Round all numeric values to 2 decimal places.

### Output Format:
Respond with only the structured JSON. Do not include explanation, comments, or extra keys.
`,
    },
  ],
};
