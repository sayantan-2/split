import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Disable prefetch as it is not supported for "Transaction" pool mode
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the connection
const client = postgres(connectionString, {
  prepare: false,
  max: 10, // Maximum number of connections in the pool
});

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for potential direct use
export { client };

// Type exports
export type Database = typeof db;
