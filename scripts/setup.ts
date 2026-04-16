import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// --- Types ---

interface SetupConfig {
  name: string;
  description: string;
  owner: string;
  area?: string;
  capabilities: string[];
}

interface Replacement {
  file: string;
  description: string;
  replace: (content: string, config: SetupConfig) => string;
}

// --- Validation ---

const VALID_CAPABILITIES = [
  "frontend",
  "api",
  "cron",
  "slack_bot",
  "public_auth",
];

const VALID_AREAS = [
  "Payments",
  "Marketing",
  "Seguros",
  "Ventas SaaS",
  "Customer Care",
  "SaaS",
  "Residents",
  "Operaciones",
  "Finanzas",
  "Control de Acceso",
  "Personas",
  "Revenue",
];

function getDirName(): string {
  return ROOT.split(/[/\\]/).pop() || "app";
}

function validateOwner(owner: string | undefined): string | null {
  if (!owner) return "owner es requerido";
  if (!owner.endsWith("@comunidadfeliz.cl")) {
    return "Owner debe ser un email @comunidadfeliz.cl";
  }
  if (owner.split("@")[0].length === 0) {
    return "Owner debe tener un nombre antes de @comunidadfeliz.cl";
  }
  return null;
}

function validateCapabilities(caps: string[] | undefined): string | null {
  if (!caps || caps.length === 0) {
    return "capabilities es requerido (ej: frontend,api)";
  }
  const invalid = caps.filter((c) => !VALID_CAPABILITIES.includes(c));
  if (invalid.length > 0) {
    return `Capabilities invalidas: ${invalid.join(", ")}. Validas: ${VALID_CAPABILITIES.join(", ")}`;
  }
  return null;
}

function validateConfig(config: SetupConfig): string[] {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push("name es requerido");
  }

  if (!config.description || config.description.trim().length === 0) {
    errors.push("description es requerido");
  }
  const ownerErr = validateOwner(config.owner);
  if (ownerErr) errors.push(ownerErr);

  if (config.area && !VALID_AREAS.includes(config.area)) {
    // Area mal escrita — ignoramos, queda sin area
    config.area = "";
  }
  const capsErr = validateCapabilities(config.capabilities);
  if (capsErr) errors.push(capsErr);

  return errors;
}

// --- File replacements ---

function readFile(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf-8");
}

function writeFile(relativePath: string, content: string): void {
  writeFileSync(join(ROOT, relativePath), content, "utf-8");
}

function fileExists(relativePath: string): boolean {
  return existsSync(join(ROOT, relativePath));
}

const replacements: Replacement[] = [
  {
    file: "hub.config.json",
    description: "Configuracion del proyecto",
    replace: (content, config) => {
      const parsed = JSON.parse(content);
      parsed.name = config.name;
      parsed.description = config.description;
      parsed.owner = config.owner;
      if (config.area) {
        parsed.area = config.area;
      }
      parsed.capabilities = config.capabilities;
      parsed.type = config.capabilities[0];
      const dirName = getDirName();
      parsed.supabase.schema = dirName.replace(/-/g, "_");
      parsed.sidebar_nav[0].label = "Inicio";
      return JSON.stringify(parsed, null, 2) + "\n";
    },
  },
  {
    file: "package.json",
    description: "Nombre del paquete",
    replace: (content, config) => {
      const parsed = JSON.parse(content);
      parsed.name = getDirName();
      return JSON.stringify(parsed, null, 2) + "\n";
    },
  },
  {
    file: "app/layout.tsx",
    description: "Metadata title y description",
    replace: (content, config) => {
      return content
        .replace(
          /title: "CAMBIAR: Nombre App — ComunidadFeliz"/,
          `title: "${config.name} — ComunidadFeliz"`
        )
        .replace(
          /description: "CAMBIAR: Descripcion de tu app interna de ComunidadFeliz\."/,
          `description: "${config.description}"`
        );
    },
  },
  {
    file: "app/login/page.tsx",
    description: "Titulo y subtitulo del login",
    replace: (content, config) => {
      return content
        .replace("CAMBIAR: Nombre App", config.name)
        .replace("CAMBIAR: Descripcion corta", config.description);
    },
  },
  {
    file: "app/dashboard/page.tsx",
    description: "Titulo y descripcion del dashboard",
    replace: (content, config) => {
      let result = content
        .replace("CAMBIAR: Nombre App", config.name)
        .replace(
          "CAMBIAR: Descripcion de lo que hace tu app.",
          config.description
        );
      // Replace instructional text that references CAMBIAR
      result = result.replace(
        /Busca <code[^>]*>CAMBIAR<\/code> en todo el proyecto y reemplaza con tus valores/,
        "Personaliza esta pagina con el contenido de tu app"
      );
      return result;
    },
  },
  {
    file: "components/layout/Header.tsx",
    description: "Nombre de la app en el header",
    replace: (content, config) => {
      return content.replace(
        'appName = "CAMBIAR: Nombre App"',
        `appName = "${config.name}"`
      );
    },
  },
  {
    file: "migrations/001_initial.sql",
    description: "Schema name en SQL",
    replace: (content, config) => {
      const schemaName = getDirName().replace(/-/g, "_");
      // Remove CAMBIAR comments first, before replacing schema names
      return content
        .replace(
          /-- CAMBIAR: reemplazar "mi_app" por el nombre del schema de tu app \(definido en hub\.config\.json\)\r?\n/,
          ""
        )
        .replace(/-- CAMBIAR: Agrega aqui las tablas de tu app\r?\n/, "")
        .replace(/\(CAMBIAR seg[uú]n tu app\)/, `(${config.name})`)
        .replace(/CAMBIAR-slug/, getDirName())
        .replace(/CAMBIAR_app_slug/g, schemaName)
        .replace(/mi_app/g, schemaName);
    },
  },
  {
    file: "docs.md",
    description: "Nombre y descripcion en docs",
    replace: (content, config) => {
      return content
        .replace(/CAMBIAR: Nombre de la App/g, config.name)
        .replace(
          /CAMBIAR: Descripcion detallada de lo que hace la app y para quien es\./,
          config.description
        )
        .replace(/CAMBIAR: Agrega tus endpoints custom a esta tabla\./, "")
        .replace(
          /CAMBIAR: Instrucciones paso a paso para usar la app\./,
          "Consulta la documentacion del proyecto."
        )
        .replace(
          /CAMBIAR: Que necesita estar configurado o activado para que funcione\./,
          "Requisitos del proyecto:"
        )
        .replace(
          /CAMBIAR: Quien mantiene esta app y como contactarle\./,
          config.owner
        );
    },
  },
  {
    file: "app/(public)/public/page.tsx",
    description: "Titulo de la pagina publica",
    replace: (content, config) => {
      return content
        .replace("CAMBIAR: Titulo de la pagina publica", config.name)
        .replace(
          "CAMBIAR: Contenido publico. Esta pagina es accesible sin login.",
          `${config.description}. Esta pagina es accesible sin login.`
        )
        .replace(
          /\/\/ CAMBIAR: Esta es una pagina publica de ejemplo\.\r?\n/,
          ""
        );
    },
  },
];

// --- CLI argument parsing ---

function parseArgs(args: string[]): Partial<SetupConfig> | null {
  const config: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[++i];
      if (value === undefined) {
        console.error(`Falta valor para --${key}`);
        return null;
      }
      config[key] = value;
    }
  }

  if (Object.keys(config).length === 0) return null;

  return {
    name: config.name,
    description: config.description,
    owner: config.owner,
    area: config.area,
    capabilities: config.capabilities?.split(",").map((c) => c.trim()),
  };
}

// --- Interactive mode ---

function prompt(
  rl: ReturnType<typeof createInterface>,
  question: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function interactiveSetup(): Promise<SetupConfig> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n  Setup de cf-app-template\n");
  console.log(
    "  Responde las siguientes preguntas para configurar tu proyecto.\n"
  );

  const name = await prompt(rl, "  Nombre de la app (ej: Monitoreo Diario): ");
  const description = await prompt(rl, "  Descripcion corta: ");
  const owner = await prompt(
    rl,
    "  Email del owner (ej: juan@comunidadfeliz.cl): "
  );
  const area = await prompt(rl, `  Area (${VALID_AREAS.join(", ")}): `);
  const capsInput = await prompt(
    rl,
    `  Capabilities (${VALID_CAPABILITIES.join(", ")}), separadas por coma: `
  );

  rl.close();

  return {
    name,
    description,
    owner,
    area,
    capabilities: capsInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  };
}

// --- Main ---

async function main() {
  // Check if already configured
  if (fileExists("hub.config.json")) {
    const current = readFile("hub.config.json");
    if (!current.includes("CAMBIAR")) {
      console.log(
        "\n  Este proyecto ya fue configurado (no se encontraron CAMBIAR en hub.config.json)."
      );
      console.log(
        "  Si quieres reconfigurar, restaura hub.config.json desde el template.\n"
      );
      process.exit(0);
    }
  }

  // Parse CLI args or go interactive
  const cliArgs = parseArgs(process.argv.slice(2));
  let config: SetupConfig;

  if (cliArgs && cliArgs.name) {
    config = cliArgs as SetupConfig;
  } else if (process.argv.slice(2).length > 0 && !cliArgs?.name) {
    console.error("\n  Uso CLI:");
    console.error(
      '  npm run setup -- --name "Mi App" --description "Desc" --owner "email@comunidadfeliz.cl" --capabilities "frontend,api" [--area "Area"]\n'
    );
    process.exit(1);
  } else {
    config = await interactiveSetup();
  }

  // Validate
  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.error("\n  Errores de validacion:");
    for (const err of errors) {
      console.error(`    - ${err}`);
    }
    console.error("");
    process.exit(1);
  }

  // Sanitize values that go into TSX/TS string literals
  config.name = config.name.replace(/"/g, '\\"');
  config.description = config.description.replace(/"/g, '\\"');

  // Apply replacements
  console.log("\n  Configurando proyecto...\n");
  const changes: string[] = [];

  for (const r of replacements) {
    if (!fileExists(r.file)) {
      console.log(`    Saltando ${r.file} (no existe)`);
      continue;
    }

    const original = readFile(r.file);
    const updated = r.replace(original, config);

    if (original !== updated) {
      writeFile(r.file, updated);
      changes.push(`    ${r.file} — ${r.description}`);
    }
  }

  // Summary
  if (changes.length > 0) {
    console.log("  Archivos modificados:");
    for (const change of changes) {
      console.log(change);
    }
  } else {
    console.log("  No se modificaron archivos.");
  }

  console.log("\n  Setup completado.\n");
  console.log("  Siguiente paso:");
  console.log("    1. Copia .env.example a .env.local");
  console.log("    2. Configura las credenciales de Supabase en .env.local");
  console.log("    3. Ejecuta: npm run dev\n");
}

main().catch((err) => {
  console.error("Error en setup:", err);
  process.exit(1);
});
