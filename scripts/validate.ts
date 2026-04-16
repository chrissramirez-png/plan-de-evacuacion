import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const FILES_TO_CHECK = [
  "hub.config.json",
  "package.json",
  "app/layout.tsx",
  "app/login/page.tsx",
  "app/dashboard/page.tsx",
  "components/layout/Header.tsx",
  "migrations/001_initial.sql",
  "docs.md",
  "app/(public)/public/page.tsx",
];

interface Finding {
  file: string;
  line: number;
  text: string;
}

function checkFile(relativePath: string): Finding[] {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return [];

  const content = readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");
  const findings: Finding[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("CAMBIAR")) {
      findings.push({
        file: relativePath,
        line: i + 1,
        text: lines[i].trim(),
      });
    }
  }

  return findings;
}

function validateMigration(): string[] {
  const errors: string[] = [];

  // Read hub.config.json to get migration path
  const configPath = join(ROOT, "hub.config.json");
  if (!existsSync(configPath)) return errors;

  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const migrationPath = config.supabase?.migration;

  if (!migrationPath) {
    errors.push(
      "hub.config.json: supabase.migration no esta definido — el Hub necesita un archivo SQL para ejecutar la migracion"
    );
    return errors;
  }

  const fullMigrationPath = join(ROOT, migrationPath);
  if (!existsSync(fullMigrationPath)) {
    errors.push(
      `${migrationPath}: archivo de migracion no existe — el Hub no podra ejecutar la migracion`
    );
    return errors;
  }

  const content = readFileSync(fullMigrationPath, "utf-8").trim();
  if (content.length === 0) {
    errors.push(`${migrationPath}: archivo de migracion esta vacio`);
    return errors;
  }

  // Check RLS: if there are active CREATE TABLE statements, there must be active ENABLE ROW LEVEL SECURITY
  const activeLines = content
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"));
  const activeContent = activeLines.join("\n").toLowerCase();
  const hasActiveTables = /create\s+table/i.test(activeContent);
  if (hasActiveTables) {
    const hasActiveRls = activeContent.includes("enable row level security");
    if (!hasActiveRls) {
      errors.push(
        `${migrationPath}: migracion tiene CREATE TABLE sin ENABLE ROW LEVEL SECURITY — RLS es obligatorio en cada tabla`
      );
    }
  }

  return errors;
}

function isTemplate(): boolean {
  const pkgPath = join(ROOT, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.name === "cf-app-template";
  } catch {
    return false;
  }
}

function main() {
  // Skip validation if this IS the template repo (CAMBIAR is expected)
  if (isTemplate()) {
    console.log(
      "\n  Validacion saltada — este es el template base (cf-app-template).\n"
    );
    process.exit(0);
  }

  const allFindings: Finding[] = [];
  let hasErrors = false;

  // Check CAMBIAR placeholders
  for (const file of FILES_TO_CHECK) {
    allFindings.push(...checkFile(file));
  }

  if (allFindings.length > 0) {
    hasErrors = true;
    console.error(`\n  ${allFindings.length} CAMBIAR pendiente(s):\n`);
    for (const f of allFindings) {
      console.error(`    ${f.file}:${f.line}`);
      console.error(`      ${f.text}\n`);
    }
    console.error("  Ejecuta npm run setup para configurar el proyecto.\n");
  }

  // Validate migration
  const migrationErrors = validateMigration();
  if (migrationErrors.length > 0) {
    hasErrors = true;
    console.error("\n  Errores de migracion:\n");
    for (const err of migrationErrors) {
      console.error(`    ${err}\n`);
    }
  }

  if (!hasErrors) {
    console.log(
      "\n  Validacion OK — no quedan CAMBIAR pendientes, migracion valida.\n"
    );
    process.exit(0);
  }

  process.exit(1);
}

main();
