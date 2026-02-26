import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
  ensureMarkdownExtension,
  validateVaultPath,
} from "../../utils/path.ts";
import { fileExists, safeReadFile } from "../../utils/files.ts";
import { parseNote, stringifyNote } from "../../utils/tags.ts";
import { createTool } from "../../utils/tool-factory.ts";

// Input validation schema with descriptions
const schema = z.object({
  vault: z.string()
    .min(1, "Vault name cannot be empty")
    .describe("Name of the vault containing the note"),
  file: z.string()
    .min(1, "File path cannot be empty")
    .describe(
      "Path to the note relative to vault root (e.g., 'folder/note.md')",
    ),
  properties: z.record(z.any())
    .describe(
      "Key-value pairs to update in frontmatter. Set a value to null to remove the property.",
    ),
}).strict();

type UpdatePropertiesArgs = z.infer<typeof schema>;

async function updateProperties(
  vaultPath: string,
  filePath: string,
  properties: Record<string, any>,
): Promise<string> {
  const fullPath = path.join(vaultPath, filePath);

  // Validate path is within vault
  await validateVaultPath(vaultPath, fullPath);

  try {
    // Check if file exists
    if (!await fileExists(fullPath)) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Note not found: ${filePath}`,
      );
    }

    // Read file content
    const content = await safeReadFile(fullPath);
    if (content === null) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read note: ${filePath}`,
      );
    }

    // Parse the note
    const parsed = parseNote(content);

    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      if (value === null) {
        delete parsed.frontmatter[key];
      } else {
        parsed.frontmatter[key] = value;
      }
    }

    // Ensure hasFrontmatter reflects state
    parsed.hasFrontmatter = Object.keys(parsed.frontmatter).length > 0;

    // Save changes
    const updatedContent = stringifyNote(parsed);
    await fs.writeFile(fullPath, updatedContent);

    return `Successfully updated properties in "${filePath}"`;
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to update properties: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function createUpdatePropertiesTool(vaults: Map<string, string>) {
  return createTool<UpdatePropertiesArgs>({
    name: "update-properties",
    description:
      "Update frontmatter properties (YAML) in a note. Set a value to null to remove a property.",
    schema,
    handler: async (args, vaultPath, _vaultName) => {
      const filePath = ensureMarkdownExtension(args.file);
      const resultMessage = await updateProperties(
        vaultPath,
        filePath,
        args.properties,
      );

      return {
        content: [
          {
            type: "text",
            text: resultMessage,
          },
        ],
      };
    },
  }, vaults);
}
