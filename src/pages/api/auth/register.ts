import { NextApiRequest, NextApiResponse } from "next";
import { createUser } from "@/lib/user";
import { z } from "zod";

// Validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.issues,
      });
    }

    const { email, name, password } = validation.data;

    // Create user
    const user = await createUser({ email, name, password });

    return res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
