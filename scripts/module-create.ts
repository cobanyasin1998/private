import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const raw = process.argv[2]?.trim();
if (!raw || !/^[a-z][a-z0-9-]*$/.test(raw)) {
  console.error("Usage: pnpm module:create <module-name> (example: journal)");
  process.exit(1);
}

const id = raw.toLowerCase();
const root = process.cwd();
const feature = join(root, "src", "features", id);
const files: Record<string, string> = {
  "index.ts": `/** Public boundary for the ${id} feature. Export only stable contracts. */\nexport const ${id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}ModuleId = "${id}" as const;\n`,
  "validation.ts": `import { z } from "zod";\n\nexport const ${id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Schema = z.object({\n  name: z.string().trim().min(1).max(160),\n});\n`,
  "data.ts": `// Add owner-scoped queries and mutations here. Validate every input with the feature schema.\nexport {};\n`,
  "components/empty-state.tsx": `export function EmptyState() {\n  return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No ${id} records yet.</div>;\n}\n`,
  "__tests__/validation.test.ts": `import { describe, expect, it } from "vitest";\nimport { ${id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Schema } from "../validation";\n\ndescribe("${id} validation", () => {\n  it("requires a name", () => { expect(${id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Schema.safeParse({ name: "" }).success).toBe(false); });\n});\n`,
};

for (const [relative, contents] of Object.entries(files)) {
  const destination = join(feature, relative);
  if (existsSync(destination)) { console.log(`skip ${relative}`); continue; }
  mkdirSync(join(destination, ".."), { recursive: true });
  writeFileSync(destination, contents, "utf8");
  console.log(`created ${relative}`);
}

console.log(`\nFeature scaffold created at src/features/${id}. Register it in src/config/modules.ts and add its Prisma migration intentionally.`);
