#!/usr/bin/env node
/**
 * Provide a clean settings host app (no cmdk / cmdk-vectorized) for testing
 * the SupaSearch install prompt end-to-end.
 *
 * Usage (from cmdk-vectorized root):
 *   node scripts/provide-clean-settings-demo.mjs
 *   node scripts/provide-clean-settings-demo.mjs --dev
 *   pnpm example:plain:fresh
 *   pnpm example:plain:fresh -- --dev
 *
 * Flags:
 *   --dev       Start Vite after reset
 *   --no-install  Skip pnpm install
 *   --json      Print machine-readable summary only
 */

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, "..");
const DEMO_REL = "examples/settings-demo-plain";
const DEMO_ROOT = join(PACKAGE_ROOT, DEMO_REL);

const args = new Set(process.argv.slice(2));
const wantDev = args.has("--dev");
const skipInstall = args.has("--no-install");
const asJson = args.has("--json");

function log(message) {
  if (!asJson) {
    console.log(message);
  }
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function rmIfExists(path) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

function stripCmdkDeps(packageJsonPath) {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  let changed = false;
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const block = pkg[field];
    if (!block || typeof block !== "object") continue;
    for (const name of Object.keys(block)) {
      if (name === "cmdk" || name === "cmdk-vectorized" || name.startsWith("cmdk-")) {
        delete block[name];
        changed = true;
      }
    }
  }
  if (changed) {
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
  return changed;
}

const CLEAN_APP_TSX = `import { Navigate, Route, Routes } from 'react-router-dom'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { useAppSelector } from '../features/settings/settings-store.ts'
import './App.css'

/**
 * Clean settings shell — no cmdk / cmdk-vectorized / SupaSearch wiring.
 * Use this app to validate the dashboard install prompt + integrate skill.
 */
function AppShell() {
  const theme = useAppSelector((state) => state.settings.theme)
  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={\`app-shell theme-\${effectiveTheme}\`}>
      <Routes>
        <Route path="/" element={<Navigate to="/settings" replace />} />
        <Route path="/settings/*" element={<SettingsLayout />} />
        <Route path="*" element={<Navigate to="/settings" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return <AppShell />
}
`;

function scrubSettingsLayout(layoutPath) {
  if (!existsSync(layoutPath)) {
    return false;
  }
  let source = readFileSync(layoutPath, "utf8");
  const before = source;

  // Drop palette imports
  source = source.replace(
    /^import\s+\{[^}]*OPEN_PALETTE_EVENT[^}]*\}\s+from\s+['"][^'"]+['"]\s*\n/gm,
    "",
  );
  source = source.replace(
    /^import\s+.+from\s+['"][^'"]*CmdkSaasPalette[^'"]*['"]\s*\n/gm,
    "",
  );
  source = source.replace(
    /^import\s+.+from\s+['"]cmdk-vectorized['"]\s*\n/gm,
    "",
  );
  source = source.replace(
    /^import\s+.+from\s+['"]cmdk['"]\s*\n/gm,
    "",
  );

  // Disable topbar Search button that opened the palette
  source = source.replace(
    /onClick=\{\(\)\s*=>\s*window\.dispatchEvent\(new Event\(OPEN_PALETTE_EVENT\)\)\}/g,
    "disabled",
  );
  source = source.replace(
    /title="Open command palette \(⌘K\)"/g,
    'title="Local sidebar search only — no command palette yet"',
  );

  if (source !== before) {
    writeFileSync(layoutPath, source);
    return true;
  }
  return false;
}

function removePaletteFiles(srcRoot) {
  const removed = [];
  const candidates = [
    join(srcRoot, "shared/ui/CmdkSaasPalette.tsx"),
    join(srcRoot, "shared/ui/CmdkSaasPalette.css"),
    join(srcRoot, "shared/ui/CmdkSaasPalette.ts"),
    join(srcRoot, "app/CommandDialog.tsx"),
    join(srcRoot, "app/CommandDialog.css"),
    join(srcRoot, "app/SiriVoiceNavigator.tsx"),
    join(srcRoot, "app/SiriVoiceNavigator.css"),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      rmSync(file, { force: true });
      removed.push(file);
    }
  }

  // Any *Palette* that imports cmdk-vectorized
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist") continue;
        walk(full);
        continue;
      }
      if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
      if (!/palette|command-dialog|commandmenu|voice/i.test(entry.name)) continue;
      const text = readFileSync(full, "utf8");
      if (/cmdk-vectorized|from ['"]cmdk['"]|AICommandPalette|useAICommand/.test(text)) {
        rmSync(full, { force: true });
        removed.push(full);
      }
    }
  }
  walk(srcRoot);
  return removed;
}

function run(command, commandArgs, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: asJson ? "ignore" : "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${commandArgs.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  if (!existsSync(DEMO_ROOT)) {
    fail(`demo not found at ${DEMO_ROOT}`);
  }

  const removedArtifacts = [];
  const artifactGlobs = [
    "public/intent-map.json",
    "public/intent-map.csv",
    "public/cmdk-sitemap.json",
    "public/cmdk-index-report.json",
    "public/cmdk-shards",
    ".env.cmdk",
    ".env.local",
    ".env",
    "dist",
  ];

  for (const rel of artifactGlobs) {
    const full = join(DEMO_ROOT, rel);
    if (existsSync(full)) {
      rmIfExists(full);
      removedArtifacts.push(rel);
    }
  }

  // Skills dropped into the demo by install
  for (const rel of [".agents", ".claude", ".codex", "skills", ".cursor"]) {
    const full = join(DEMO_ROOT, rel);
    if (existsSync(full)) {
      rmIfExists(full);
      removedArtifacts.push(rel);
    }
  }

  const packageJsonPath = join(DEMO_ROOT, "package.json");
  const strippedDeps = stripCmdkDeps(packageJsonPath);

  const appTsx = join(DEMO_ROOT, "src/app/App.tsx");
  writeFileSync(appTsx, CLEAN_APP_TSX);

  const layoutPath = join(DEMO_ROOT, "src/features/settings/SettingsLayout.tsx");
  const layoutScrubbed = scrubSettingsLayout(layoutPath);

  const removedFiles = removePaletteFiles(join(DEMO_ROOT, "src"));

  // Ensure public exists with only static assets we keep
  mkdirSync(join(DEMO_ROOT, "public"), { recursive: true });

  if (!skipInstall) {
    log("→ pnpm install (settings-demo-plain)");
    await run("pnpm", ["install"], DEMO_ROOT);
  }

  const summary = {
    ok: true,
    path: DEMO_ROOT,
    relativePath: DEMO_REL,
    packageRoot: PACKAGE_ROOT,
    strippedCmdkDeps: strippedDeps,
    restoredAppTsx: true,
    scrubbedSettingsLayout: layoutScrubbed,
    removedArtifacts,
    removedFiles: removedFiles.map((f) => f.replace(`${DEMO_ROOT}/`, "")),
    commands: {
      dev: `pnpm --dir ${DEMO_REL} dev`,
      devFromDemo: "pnpm dev",
      typecheck: `pnpm --dir ${DEMO_REL} typecheck`,
    },
    installPromptHint:
      "Point the SupaSearch dashboard install agent at this folder, then paste the setup prompt.",
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log("");
    console.log("Clean settings demo ready (no cmdk / cmdk-vectorized).");
    console.log("");
    console.log(`  path:  ${DEMO_ROOT}`);
    console.log(`  run:   pnpm --dir ${DEMO_REL} dev`);
    console.log(`  or:    cd ${DEMO_REL} && pnpm dev`);
    console.log("");
    console.log("Use this path as the project root for the SupaSearch install prompt.");
    if (removedArtifacts.length || removedFiles.length) {
      console.log("");
      console.log("Reset:");
      if (strippedDeps) console.log("  - removed cmdk* deps from package.json");
      for (const a of removedArtifacts) console.log(`  - removed ${a}`);
      for (const f of summary.removedFiles) console.log(`  - removed ${f}`);
    }
    console.log("");
  }

  if (wantDev) {
    log("→ starting Vite…");
    await run("pnpm", ["dev"], DEMO_ROOT);
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
