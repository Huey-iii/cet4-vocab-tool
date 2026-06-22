export function getDB(): D1Database {
  const db = (process.env as Record<string, unknown>).DB;
  if (!db) {
    throw new Error("D1 database binding not found");
  }
  return db as D1Database;
}
