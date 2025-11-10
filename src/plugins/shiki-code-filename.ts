import type { ShikiTransformer } from "shiki";

const langToFilenameMap: Record<string, string> = {
  astro: "Astro",
  bash: "Shell",
  css: "CSS",
  dockerfile: "Dockerfile",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  jinja: "Jinja",
  json: "JSON",
  jsx: "JSX",
  makefile: "Makefile",
  markdown: "Markdown",
  mdx: "MDX",
  nginx: "Nginx",
  python: "Python",
  rust: "Rust",
  sh: "Shell",
  sql: "SQL",
  systemd: "Systemd Units",
  terraform: "Terraform",
  toml: "TOML",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
  zsh: "Shell",
};

export default function shikiCodeMetadata(): ShikiTransformer {
  return {
    pre(node) {
      // Get raw metadata string.
      const meta = this.options.meta?.__raw;

      // Match strings separated by spaces, keeping quoted substrings intact.
      const matches = meta?.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];

      const attributes = Object.fromEntries(
        // Parse each match into key-value pairs.
        matches.map((match) => {
          const [key, ...rest] = match.split("=");
          let value = rest.join("=");
          if (value) value = value.replace(/^['"]|['"]$/g, ""); // strip quotes
          return [key, value || true];
        })
      );

      // Set data-filename property based on 'file' attribute or language.
      node.properties.dataFilename = String(
        attributes.file ?? langToFilenameMap[this.options.lang] ?? ""
      );
    },
  };
}
