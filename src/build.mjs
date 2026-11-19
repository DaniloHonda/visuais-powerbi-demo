// Monta a página de demonstração: copia o código dos visuais (trocando o prefixo das classes
// CSS por um nome genérico), compila o LESS e empacota tudo num bundle só.
import * as esbuild from "esbuild";
import less from "less";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "Visuais_PBI");
const SRC = path.join(REPO, "visuals");
const COPY = path.join(HERE, ".src");
const OUT = path.resolve(HERE, "..", "site-clean");

const VISUALS = fs.readdirSync(SRC).filter(d => fs.existsSync(path.join(SRC, d, "src", "visual.ts")));

// Troca o prefixo das classes CSS e tira as menções ao nome da empresa.
function generic(text) {
  return text
    .replace(/xp-/g, "pv-")
    .replace(/pela XP/g, "pela empresa")
    .replace(/visuais XP/g, "visuais")
    // O nome do sistema de origem não interessa numa demonstração genérica.
    .replace(/"Greenhouse"/g, '"Registro"');
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name), b = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(a, b);
    else if (/\.(ts|less)$/.test(entry.name)) fs.writeFileSync(b, generic(fs.readFileSync(a, "utf8")));
  }
}

fs.rmSync(COPY, { recursive: true, force: true });
for (const v of VISUALS) {
  copyTree(path.join(SRC, v, "src"), path.join(COPY, v, "src"));
  copyTree(path.join(SRC, v, "style"), path.join(COPY, v, "style"));
}
console.log(`copiados ${VISUALS.length} visuais`);

// Gera o módulo que importa todas as classes Visual.
const registry = VISUALS.map((v, i) => `import { Visual as V${i} } from "./.src/${v}/src/visual";`).join("\n") +
  `\nexport const CLASSES = {\n` + VISUALS.map((v, i) => `  ${v}: V${i}`).join(",\n") + `\n};\n`;
fs.writeFileSync(path.join(HERE, "registry.generated.ts"), registry);

// O pacote powerbi-visuals-api só existe como tipos; no Power BI os enums vêm do host.
const shim = {
  name: "powerbi-shim",
  setup(build) {
    build.onResolve({ filter: /^powerbi-visuals-api$/ }, () => ({ path: path.join(HERE, "harness", "powerbi-shim.js") }));
    build.onLoad({ filter: /\.less$/ }, async (args) => {
      const source = fs.readFileSync(args.path, "utf8");
      const out = await less.render(source, { filename: args.path, paths: [path.dirname(args.path)] });
      return { contents: out.css, loader: "css" };
    });
  }
};

await esbuild.build({
  entryPoints: [path.join(HERE, "harness", "main.js")],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  nodePaths: [path.join(REPO, "node_modules")],
  plugins: [shim],
  loader: { ".ts": "ts" },
  outfile: path.join(OUT, "assets", "demo.js"),
  logLevel: "info"
});
