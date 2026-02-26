import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
  ensureMarkdownExtension,
  validateVaultPath,
} from "../../utils/path.ts";
import { fileExists, safeReadFile } from "../../utils/files.ts";
import { createTool } from "../../utils/tool-factory.ts";

// Input validation schema with descriptions
const schema = z.object({
  vault: z.string()
    .min(1, "Vault name cannot be empty")
    .describe("Name of the vault containing the Kanban board"),
  file: z.string()
    .min(1, "File path cannot be empty")
    .describe(
      "Path to the Kanban board relative to vault root (e.g., 'Projects/Board.md')",
    ),
  task: z.string()
    .min(1, "Task text cannot be empty")
    .describe("The text of the task to move (exactly as it appears)"),
  toList: z.string()
    .min(1, "Target list name cannot be empty")
    .describe("The name of the list to move the task to (e.g., 'Done')"),
}).strict();

type MoveKanbanTaskArgs = z.infer<typeof schema>;

async function moveKanbanTask(
  vaultPath: string,
  filePath: string,
  taskText: string,
  toListName: string,
): Promise<string> {
  const fullPath = path.join(vaultPath, filePath);

  // Validate path is within vault
  await validateVaultPath(vaultPath, fullPath);

  try {
    // Check if file exists
    if (!await fileExists(fullPath)) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Kanban board not found: ${filePath}`,
      );
    }

    // Read file content
    const content = await safeReadFile(fullPath);
    if (content === null) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read file: ${filePath}`,
      );
    }

    const lines = content.split("
");
    let taskLineIndex = -1;
    let targetListHeaderIndex = -1;
    let foundTaskLine = "";

    // Regex to match a task line like "- [ ] task text" or "- [x] task text"
    // Escaping special regex characters in the task text
    const escapedTaskText = taskText.replace(/[.*+?^${}()|[\]\]/g, "\$&");
    const taskRegex = new RegExp(`^\s*-\s*\[[ xX]\]\s*${escapedTaskText}\s*$`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for list header
      if (line.startsWith("## ") && line.slice(3).trim() === toListName) {
        targetListHeaderIndex = i;
      }
      // Check for task line
      if (taskRegex.test(line)) {
        taskLineIndex = i;
        foundTaskLine = line;
      }
    }

    if (taskLineIndex === -1) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Task "${taskText}" not found in Kanban board.`,
      );
    }

    if (targetListHeaderIndex === -1) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Target list "${toListName}" not found in Kanban board.`,
      );
    }

    // Remove task from its current position
    lines.splice(taskLineIndex, 1);
    
    // Adjust target header index if it was after the task line we just removed
    if (targetListHeaderIndex > taskLineIndex) {
      targetListHeaderIndex--;
    }

    // Find the end of the target list to append the task
    // The end is reached at the next list header or the Kanban settings block
    let insertIndex = targetListHeaderIndex + 1;
    while (
      insertIndex < lines.length &&
      !lines[insertIndex].startsWith("## ") &&
      !lines[insertIndex].startsWith("%%")
    ) {
      insertIndex++;
    }
    
    // Insert at the end of the target list
    lines.splice(insertIndex, 0, foundTaskLine);

    // Save changes
    await fs.writeFile(fullPath, lines.join("
"));

    return `Successfully moved task "${taskText}" to list "${toListName}" in "${filePath}"`;
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to move Kanban task: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function createMoveKanbanTaskTool(vaults: Map<string, string>) {
  return createTool<MoveKanbanTaskArgs>({
    name: "move-kanban-task",
    description: "Move a task between lists in an Obsidian Kanban board.",
    schema,
    handler: async (args, vaultPath, _vaultName) => {
      const filePath = ensureMarkdownExtension(args.file);
      const resultMessage = await moveKanbanTask(
        vaultPath,
        filePath,
        args.task,
        args.toList,
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
