// Generates the content seed migration from content/. Run: npm run content:sql
import { writeFileSync } from "node:fs";
import { contentSql, CONTENT_MIGRATION } from "../lib/db/content-sql";

writeFileSync(CONTENT_MIGRATION, contentSql());
console.log(`wrote ${CONTENT_MIGRATION}`);
