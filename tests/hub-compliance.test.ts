import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf-8");
const exists = (p: string) => existsSync(join(ROOT, p));

// Recursively list all files in a directory
function listFiles(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const entries: string[] = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const full = join(abs, entry.name);
    if (entry.isDirectory()) {
      entries.push(...listFiles(join(dir, entry.name)));
    } else {
      entries.push(relative(ROOT, full).replace(/\\/g, "/"));
    }
  }
  return entries;
}

// Read capabilities from hub.config.json
function getCapabilities(): string[] {
  if (!exists("hub.config.json")) return [];
  const config = JSON.parse(read("hub.config.json"));
  return config.capabilities || [];
}

const capabilities = getCapabilities();
const hasCapability = (cap: string) => capabilities.includes(cap);
const hasFrontend = hasCapability("frontend");
const needsDocs = !hasFrontend;

describe("hub.config.json", () => {
  it("exists", () => {
    expect(exists("hub.config.json")).toBe(true);
  });

  it("has required fields", () => {
    const config = JSON.parse(read("hub.config.json"));
    for (const field of [
      "name",
      "description",
      "type",
      "visibility",
      "owner",
    ]) {
      expect(config[field], `Missing field: ${field}`).toBeDefined();
    }
  });

  it("has valid type", () => {
    const config = JSON.parse(read("hub.config.json"));
    expect(["frontend", "api", "slack_bot", "cron"]).toContain(config.type);
  });

  it("has capabilities array", () => {
    const config = JSON.parse(read("hub.config.json"));
    expect(
      Array.isArray(config.capabilities),
      "capabilities must be an array"
    ).toBe(true);
    const validCaps = ["frontend", "api", "cron", "slack_bot"];
    for (const cap of config.capabilities) {
      expect(validCaps, `Invalid capability: ${cap}`).toContain(cap);
    }
  });

  it("has endpoints defined", () => {
    const config = JSON.parse(read("hub.config.json"));
    expect(config.endpoints?.health).toBeDefined();
    expect(config.endpoints?.metrics_menu).toBeDefined();
    expect(config.endpoints?.metrics).toBeDefined();
  });

  it("no CAMBIAR placeholders in non-template usage", () => {
    const config = read("hub.config.json");
    // Skip this check if the project still has CAMBIAR in owner (unconfigured template)
    if (config.includes('"owner": "CAMBIAR@comunidadfeliz.cl"')) return;
    expect(config).not.toContain("CAMBIAR");
  });
});

describe("Project structure", () => {
  it("has .gitignore", () => {
    expect(exists(".gitignore")).toBe(true);
  });

  it(".gitignore includes required entries", () => {
    const gitignore = read(".gitignore");
    expect(gitignore).toContain("node_modules");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain(".next");
  });

  it("does not commit .env files", () => {
    expect(exists(".env")).toBe(false);
    expect(exists(".env.local")).toBe(false);
  });
});

describe("Scaffold integrity", () => {
  const coreFiles = [
    "app/layout.tsx",
    "app/page.tsx",
    "app/globals.css",
    "middleware.ts",
    "lib/supabase/client.ts",
    "lib/supabase/server.ts",
    "lib/supabase/middleware.ts",
    "lib/auth.ts",
    "lib/types.ts",
    "components/layout/Header.tsx",
    "components/layout/AppLayout.tsx",
    "components/layout/ThemeProvider.tsx",
    "components/layout/PublicLayout.tsx",
    "hub.config.json",
    "migrations/001_initial.sql",
    "app/api/auth/profile/route.ts",
  ];

  for (const file of coreFiles) {
    it(`has ${file}`, () => {
      expect(exists(file), `Missing scaffold file: ${file}`).toBe(true);
    });
  }
});

describe("Auth implementation", () => {
  it("has Supabase dependencies", () => {
    const pkg = JSON.parse(read("package.json"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps["@supabase/supabase-js"]).toBeDefined();
    expect(allDeps["@supabase/ssr"]).toBeDefined();
  });

  it("login page exists with Google OAuth", () => {
    const login = read("app/login/page.tsx");
    expect(login).toContain("signInWithOAuth");
    expect(login).toContain("google");
  });

  it("callback uses onAuthStateChange", () => {
    const callback = read("app/auth/callback/page.tsx");
    expect(callback).toContain("onAuthStateChange");
  });
});

describe("Baseline skills", () => {
  const baselineSkills = [
    "skills/baseline/design-system-cf.md",
    "skills/baseline/seguridad.md",
    "skills/baseline/stack-aprobado.md",
    "skills/baseline/navegacion.md",
    "skills/baseline/metricas.md",
    "skills/baseline/git.md",
    "skills/baseline/testing-y-codigo.md",
    "skills/baseline/pr-checklist.md",
  ];

  for (const skill of baselineSkills) {
    it(`has ${skill}`, () => {
      expect(exists(skill), `Missing skill: ${skill}`).toBe(true);
    });
  }
});

describe("Security", () => {
  it("no hardcoded secrets in source", () => {
    const patterns = [
      /sk_live_[a-zA-Z0-9]{20,}/,
      /AKIA[A-Z0-9]{16}/,
      /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
    ];

    const files = [
      "lib/auth.ts",
      "lib/auth-api.ts",
      "lib/supabase/client.ts",
      "lib/supabase/server.ts",
      "middleware.ts",
    ];

    for (const file of files) {
      if (!exists(file)) continue;
      const content = read(file);
      for (const pattern of patterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  });

  it("migration has RLS enabled", () => {
    if (!exists("migrations/001_initial.sql")) return;
    const sql = read("migrations/001_initial.sql");
    expect(sql.toLowerCase()).toContain("enable row level security");
  });

  it("migration SQL contains CREATE TABLE for every .from() table in code", () => {
    if (!exists("hub.config.json")) return;
    const config = JSON.parse(read("hub.config.json"));
    const migrationPath = config.supabase?.migration;
    if (!migrationPath || !exists(migrationPath)) return;

    const migration = read(migrationPath);
    // Skip if still template
    if (migration.includes("CAMBIAR")) return;

    const migrationLower = migration.toLowerCase();

    // Find all .from("table") calls in TS/TSX files
    const codeFiles = [
      ...listFiles("app"),
      ...listFiles("lib"),
      ...listFiles("components"),
    ].filter(
      (f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && !f.includes(".test.")
    );

    const fromPattern = /\.from\(\s*["']([a-z_][a-z0-9_]*)["']/g;
    const tables = new Set<string>();

    for (const file of codeFiles) {
      const content = read(file);
      let match;
      while ((match = fromPattern.exec(content)) !== null) {
        tables.add(match[1]);
      }
    }

    if (tables.size === 0) return;

    const missing: string[] = [];
    for (const table of tables) {
      if (
        !migrationLower.includes(`create table`) ||
        !migrationLower.includes(table)
      ) {
        missing.push(table);
      }
    }

    expect(
      missing,
      `Tablas usadas en codigo pero no en migracion: ${missing.join(", ")}. Actualiza ${migrationPath}.`
    ).toHaveLength(0);
  });
});

describe("Stack enforcement", () => {
  it("project is Next.js (package.json has next)", () => {
    const pkg = JSON.parse(read("package.json"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(
      allDeps["next"],
      "package.json must have 'next' as dependency — only Next.js is allowed"
    ).toBeDefined();
  });

  it("no Python files in project", () => {
    const pyFiles = listFiles(".").filter(
      (f) =>
        f.endsWith(".py") &&
        !f.startsWith("skills/") &&
        !f.startsWith("tests/test_") &&
        !f.startsWith("node_modules/")
    );
    expect(
      pyFiles,
      `Python files found: ${pyFiles.join(", ")}. Only Next.js is allowed.`
    ).toHaveLength(0);
  });

  it("no Go files in project", () => {
    const goFiles = listFiles(".").filter(
      (f) =>
        f.endsWith(".go") &&
        !f.startsWith("skills/") &&
        !f.startsWith("node_modules/")
    );
    expect(
      goFiles,
      `Go files found: ${goFiles.join(", ")}. Only Next.js is allowed.`
    ).toHaveLength(0);
  });

  it("no requirements.txt (Python)", () => {
    expect(
      exists("requirements.txt"),
      "requirements.txt found — only Next.js is allowed, remove Python dependencies"
    ).toBe(false);
  });

  it("no Pipfile (Python)", () => {
    expect(exists("Pipfile"), "Pipfile found — only Next.js is allowed").toBe(
      false
    );
  });

  it("no go.mod (Go)", () => {
    expect(exists("go.mod"), "go.mod found — only Next.js is allowed").toBe(
      false
    );
  });

  it("no Procfile (use Next.js start instead)", () => {
    expect(
      exists("Procfile"),
      "Procfile found — Next.js apps use 'npm start', remove Procfile"
    ).toBe(false);
  });

  it("does not use disallowed npm packages", () => {
    const pkg = JSON.parse(read("package.json"));
    const allDeps = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    });
    const blocked = [
      "mongoose",
      "mongodb",
      "firebase",
      "firebase-admin",
      "@auth0/nextjs-auth0",
      "@clerk/nextjs",
      "@aws-sdk/client-s3",
      "@upstash/redis",
      "@upstash/qstash",
      "mysql2",
      "mysql",
      "planetscale-database",
      "@neondatabase/serverless",
      "@libsql/client",
      "express",
    ];
    for (const dep of blocked) {
      expect(
        allDeps,
        `Blocked package: ${dep}. See skills/baseline/stack-aprobado.md`
      ).not.toContain(dep);
    }
  });
});

describe("Capabilities validation", () => {
  describe("frontend capability", () => {
    const skip = !hasCapability("frontend");

    it("app/login/page.tsx exists", () => {
      if (skip) return;
      expect(exists("app/login/page.tsx"), "Missing app/login/page.tsx").toBe(
        true
      );
    });

    it("app/auth/callback/page.tsx exists", () => {
      if (skip) return;
      expect(
        exists("app/auth/callback/page.tsx"),
        "Missing app/auth/callback/page.tsx"
      ).toBe(true);
    });

    it("app/dashboard/layout.tsx exists", () => {
      if (skip) return;
      expect(
        exists("app/dashboard/layout.tsx"),
        "Missing app/dashboard/layout.tsx"
      ).toBe(true);
    });

    it("app/dashboard/page.tsx exists", () => {
      if (skip) return;
      expect(
        exists("app/dashboard/page.tsx"),
        "Missing app/dashboard/page.tsx"
      ).toBe(true);
    });

    it("login page contains signInWithOAuth", () => {
      if (skip) return;
      const login = read("app/login/page.tsx");
      expect(login).toContain("signInWithOAuth");
    });
  });

  describe("api capability", () => {
    const skip = !hasCapability("api");

    it("app/api/health/route.ts exists", () => {
      if (skip) return;
      expect(
        exists("app/api/health/route.ts"),
        "Missing app/api/health/route.ts"
      ).toBe(true);
    });

    it("app/api/metrics/route.ts exists", () => {
      if (skip) return;
      expect(
        exists("app/api/metrics/route.ts"),
        "Missing app/api/metrics/route.ts"
      ).toBe(true);
    });

    it("app/api/metrics/menu/route.ts exists", () => {
      if (skip) return;
      expect(
        exists("app/api/metrics/menu/route.ts"),
        "Missing app/api/metrics/menu/route.ts"
      ).toBe(true);
    });
  });

  describe("cron capability", () => {
    const skip = !hasCapability("cron");

    it("lib/cron.ts exists", () => {
      if (skip) return;
      expect(exists("lib/cron.ts"), "Missing lib/cron.ts").toBe(true);
    });

    it("app/api/cron/route.ts exists (list endpoint)", () => {
      if (skip) return;
      expect(
        exists("app/api/cron/route.ts"),
        "Missing app/api/cron/route.ts"
      ).toBe(true);
    });

    it("app/api/cron/[name]/route.ts exists (execute endpoint)", () => {
      if (skip) return;
      expect(
        exists("app/api/cron/[name]/route.ts"),
        "Missing app/api/cron/[name]/route.ts"
      ).toBe(true);
    });
  });

  describe("slack_bot capability", () => {
    const skip = !hasCapability("slack_bot");

    it("lib/slack/verify.ts exists", () => {
      if (skip) return;
      expect(exists("lib/slack/verify.ts"), "Missing lib/slack/verify.ts").toBe(
        true
      );
    });

    it("lib/slack/client.ts exists", () => {
      if (skip) return;
      expect(exists("lib/slack/client.ts"), "Missing lib/slack/client.ts").toBe(
        true
      );
    });

    it("lib/slack/commands.ts exists", () => {
      if (skip) return;
      expect(
        exists("lib/slack/commands.ts"),
        "Missing lib/slack/commands.ts"
      ).toBe(true);
    });

    it("lib/slack/events.ts exists", () => {
      if (skip) return;
      expect(exists("lib/slack/events.ts"), "Missing lib/slack/events.ts").toBe(
        true
      );
    });

    it("app/api/slack/commands/route.ts exists", () => {
      if (skip) return;
      expect(
        exists("app/api/slack/commands/route.ts"),
        "Missing app/api/slack/commands/route.ts"
      ).toBe(true);
    });

    it("app/api/slack/events/route.ts exists", () => {
      if (skip) return;
      expect(
        exists("app/api/slack/events/route.ts"),
        "Missing app/api/slack/events/route.ts"
      ).toBe(true);
    });

    it("app/api/slack/interactions/route.ts exists", () => {
      if (skip) return;
      expect(
        exists("app/api/slack/interactions/route.ts"),
        "Missing app/api/slack/interactions/route.ts"
      ).toBe(true);
    });

    it("lib/slack/verify.ts contains verifySlackSignature", () => {
      if (skip) return;
      const content = read("lib/slack/verify.ts");
      expect(content).toContain("verifySlackSignature");
    });
  });

  describe("documentation page (required when no frontend)", () => {
    const skip = !needsDocs;

    it("app/(public)/docs/page.tsx exists", () => {
      if (skip) return;
      expect(
        exists("app/(public)/docs/page.tsx"),
        "Missing app/(public)/docs/page.tsx — required for backend capabilities"
      ).toBe(true);
    });

    it("docs.md exists and has content", () => {
      if (skip) return;
      expect(
        exists("docs.md"),
        "Missing docs.md — required for backend capabilities"
      ).toBe(true);
      const content = read("docs.md");
      expect(content.trim().length, "docs.md is empty").toBeGreaterThan(0);
    });
  });
});

describe("Public routes security", () => {
  // Patterns that indicate sensitive data exposure
  const sensitivePatterns = [
    {
      pattern: /process\.env\.(?!NEXT_PUBLIC_)\w+/,
      name: "server-side env var access (non NEXT_PUBLIC_)",
    },
    {
      pattern: /SUPABASE_SERVICE_ROLE_KEY/,
      name: "service role key reference",
    },
    { pattern: /service_?[Rr]ole/, name: "service role client usage" },
    { pattern: /createServiceRoleClient/, name: "service role client call" },
    { pattern: /sk_live_[a-zA-Z0-9]{20,}/, name: "Stripe live key" },
    { pattern: /AKIA[A-Z0-9]{16}/, name: "AWS access key" },
    { pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, name: "private key" },
    { pattern: /password/i, name: "password reference" },
    { pattern: /secret/i, name: "secret reference" },
    { pattern: /credential/i, name: "credential reference" },
  ];

  // Patterns that are OK in public files (false positive exclusions)
  const allowedContexts = [
    /x-webhook-secret/i, // webhook example references "secret" in header name
    /WEBHOOK_SECRET/, // env var name for webhook validation
    /METRICS_API_KEY/, // metrics protection pattern (ok to reference in comments)
    /CAMBIAR/i, // template placeholders
    /\/\/.*/, // single-line comments (we'll handle separately)
  ];

  function isFalsePositive(line: string): boolean {
    // Skip comment-only lines
    const trimmed = line.trim();
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    ) {
      return true;
    }
    return allowedContexts.some((ctx) => ctx.test(line));
  }

  it("public pages do not reference sensitive data", () => {
    // Scan all files under app/(public)/
    const publicFiles = listFiles("app/(public)");
    const violations: string[] = [];

    for (const file of publicFiles) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const content = read(file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isFalsePositive(line)) continue;

        for (const { pattern, name } of sensitivePatterns) {
          if (pattern.test(line)) {
            violations.push(`${file}:${i + 1} — ${name}: ${line.trim()}`);
          }
        }
      }
    }

    expect(
      violations,
      `Sensitive data in public pages:\n${violations.join("\n")}`
    ).toHaveLength(0);
  });

  it("public API routes do not reference sensitive data", () => {
    // Scan all files under app/api/public/
    const publicApiFiles = listFiles("app/api/public");
    const violations: string[] = [];

    for (const file of publicApiFiles) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const content = read(file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isFalsePositive(line)) continue;

        for (const { pattern, name } of sensitivePatterns) {
          if (pattern.test(line)) {
            violations.push(`${file}:${i + 1} — ${name}: ${line.trim()}`);
          }
        }
      }
    }

    expect(
      violations,
      `Sensitive data in public API routes:\n${violations.join("\n")}`
    ).toHaveLength(0);
  });

  it("public API routes do not use auth tokens", () => {
    const publicApiFiles = listFiles("app/api/public");

    for (const file of publicApiFiles) {
      if (!file.endsWith(".ts")) continue;
      const content = read(file);

      // Public APIs should NOT require auth
      expect(
        content,
        `${file} should not use verifyToken — it's a public route`
      ).not.toContain("verifyToken");
      expect(
        content,
        `${file} should not use getSession — it's a public route`
      ).not.toContain("getSession");
      expect(
        content,
        `${file} should not use auth.getUser — it's a public route`
      ).not.toContain("auth.getUser");
    }
  });

  it("public pages do not fetch protected endpoints", () => {
    const publicFiles = listFiles("app/(public)");

    for (const file of publicFiles) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const content = read(file);

      // Public pages should not use authFetch (which adds Bearer token)
      expect(
        content,
        `${file} should not use authFetch — public pages don't have auth`
      ).not.toContain("authFetch");
    }
  });

  it("public routes in middleware match hub.config.json publicRoutes", () => {
    if (!exists("hub.config.json")) return;
    const config = JSON.parse(read("hub.config.json"));
    if (!config.publicRoutes || config.publicRoutes.length === 0) return;

    const middlewareContent = read("middleware.ts");

    for (const route of config.publicRoutes) {
      expect(
        middlewareContent,
        `Public route "${route}" declared in hub.config.json but not in middleware.ts PUBLIC_ROUTES`
      ).toContain(route);
    }
  });

  it("public pages do not expose user emails or PII", () => {
    const publicFiles = listFiles("app/(public)");
    const piiPatterns = [
      { pattern: /\.email\b/, name: "email field access" },
      { pattern: /\.full_name\b/, name: "full_name field access" },
      { pattern: /\.avatar_url\b/, name: "avatar_url field access" },
      { pattern: /user_id|userId|owner_id|ownerId/, name: "user ID reference" },
    ];

    const violations: string[] = [];
    for (const file of publicFiles) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const content = read(file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isFalsePositive(line)) continue;

        for (const { pattern, name } of piiPatterns) {
          if (pattern.test(line)) {
            violations.push(`${file}:${i + 1} — ${name}: ${line.trim()}`);
          }
        }
      }
    }

    expect(
      violations,
      `PII exposure in public pages:\n${violations.join("\n")}`
    ).toHaveLength(0);
  });
});
