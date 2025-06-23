import { db } from "../db";
import { users, passwords } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
}

export async function createUser({ email, name, password }: CreateUserData) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
      })
      .returning();

    // Create password record
    await db.insert(passwords).values({
      userId: newUser[0].id,
      hashedPassword,
    });

    return {
      id: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return user[0] || null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user[0] || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}
