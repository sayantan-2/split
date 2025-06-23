import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

async function testDatabaseConnection() {
  try {
    console.log("🧪 Testing database connection...");

    // Test 1: Simple query to check if tables exist
    const result = await db.select().from(users).limit(1);
    console.log("✅ Database connection successful!");
    console.log("📊 Users table exists, current count:", result.length);

    // Test 2: Create a test user
    const testUser = await db
      .insert(users)
      .values({
        email: "test@example.com",
        name: "Test User",
      })
      .returning();

    console.log("✅ Created test user:", testUser[0]);

    // Test 3: Fetch the user back
    const fetchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@example.com"));
    console.log("✅ Fetched test user:", fetchedUsers[0]);

    console.log("🎉 All database tests passed!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    throw error;
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection();
