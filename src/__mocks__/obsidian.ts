/**
 * Mock for Obsidian module
 *
 * Provides minimal mocks for testing card-parser.ts
 */

export class TFile {
  basename: string;
  path: string;

  constructor(path: string = "test.md") {
    this.path = path;
    this.basename = path.split("/").pop() || path;
  }
}

/**
 * Simple YAML parser for testing
 */
export function parseYaml(yamlString: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yamlString.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: unknown = line.slice(colonIndex + 1).trim();

      // Parse arrays like [tag1, tag2]
      if (typeof value === "string" && value.startsWith("[")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim());
      }
      // Parse numbers
      else if (typeof value === "string" && /^\d+$/.test(value)) {
        value = parseInt(value, 10);
      }

      result[key] = value;
    }
  }

  return result;
}
