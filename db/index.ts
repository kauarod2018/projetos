import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import * as schema from "./schema";

const state = globalThis as unknown as { vemoPool?: Pool };

export function getDb() {
  if (!state.vemoPool) {
    for (const key of ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]) {
      if (!process.env[key]) throw new Error("Database configuration incomplete");
    }
    const host = process.env.DB_HOST!;
    const local = ["localhost", "127.0.0.1", "::1"].includes(host);
    state.vemoPool = createPool({
      host, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306),
      charset: "utf8mb4", timezone: "Z", dateStrings: true,
      waitForConnections: true, connectionLimit: 5, queueLimit: 50,
      connectTimeout: 10_000, multipleStatements: false,
      ssl: !local || process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    });
  }
  return drizzle(state.vemoPool, { schema, mode: "default" });
}
