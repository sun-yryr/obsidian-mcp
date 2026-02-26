import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { assertEquals, assertRejects } from "@std/assert";
import { createMoveKanbanTaskTool } from "./index.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";

describe("Tool: move-kanban-task", () => {
  let tempVaultPath: string;
  let vaults: Map<string, string>;

  beforeEach(async () => {
    const rawTempPath = await fs.mkdtemp(
      path.join(os.tmpdir(), "obsidian-mcp-test-"),
    );
    tempVaultPath = await fs.realpath(rawTempPath);
    vaults = new Map([["test-vault", tempVaultPath]]);
  });

  afterEach(async () => {
    await fs.rm(tempVaultPath, { recursive: true, force: true });
  });

  it("should move a task between lists", async () => {
    const tool = createMoveKanbanTaskTool(vaults);
    const boardPath = path.join(tempVaultPath, "kanban.md");
    const boardContent = `
---
kanban-plugin: basic
---

## Todo
- [ ] task 1
- [ ] task 2

## In Progress
- [ ] task 3

## Done
`;
    await fs.writeFile(boardPath, boardContent);

    const args = {
      vault: "test-vault",
      file: "kanban.md",
      task: "task 2",
      toList: "In Progress",
    };

    await tool.handler(args);

    const updatedContent = await fs.readFile(boardPath, "utf8");

    // Task 2 should be in In Progress list
    const lines = updatedContent.split("\n");
    const inProgressIndex = lines.findIndex((l) => l.startsWith("## In Progress"));
    const doneIndex = lines.findIndex((l) => l.startsWith("## Done"));
    const task2Index = lines.findIndex((l) => l.includes("task 2"));

    assertEquals(
      task2Index > inProgressIndex && task2Index < doneIndex,
      true,
      "Task 2 should be moved to In Progress",
    );

    // Task 2 should not be in Todo anymore
    const todoIndex = lines.findIndex((l) => l.startsWith("## Todo"));
    assertEquals(
      task2Index > todoIndex && task2Index < inProgressIndex,
      false,
      "Task 2 should be removed from Todo",
    );
  });

  it("should handle settings at the end of the file", async () => {
    const tool = createMoveKanbanTaskTool(vaults);
    const boardPath = path.join(tempVaultPath, "kanban.md");
    const boardContent = `
## Todo
- [ ] task 1

## Done

%% kanban:settings
{"kanban-plugin":"basic"}
%%
`;
    await fs.writeFile(boardPath, boardContent);

    const args = {
      vault: "test-vault",
      file: "kanban.md",
      task: "task 1",
      toList: "Done",
    };

    await tool.handler(args);

    const updatedContent = await fs.readFile(boardPath, "utf8");
    const lines = updatedContent.split("\n");
    const doneIndex = lines.findIndex((l) => l.startsWith("## Done"));
    const settingsIndex = lines.findIndex((l) => l.startsWith("%% kanban:settings"));
    const task1Index = lines.findIndex((l) => l.includes("task 1"));

    assertEquals(
      task1Index > doneIndex && task1Index < settingsIndex,
      true,
      "Task 1 should be moved to Done and before settings",
    );
  });

  it("should fail if task is not found", async () => {
    const tool = createMoveKanbanTaskTool(vaults);
    const boardPath = path.join(tempVaultPath, "kanban.md");
    const boardContent = "## Todo\n- [ ] existing task\n## Done";
    await fs.writeFile(boardPath, boardContent);

    const args = {
      vault: "test-vault",
      file: "kanban.md",
      task: "non-existent task",
      toList: "Done",
    };

    await assertRejects(
      () => tool.handler(args),
      Error,
      "not found in Kanban board",
    );
  });

  it("should fail if target list is not found", async () => {
    const tool = createMoveKanbanTaskTool(vaults);
    const boardPath = path.join(tempVaultPath, "kanban.md");
    const boardContent = "## Todo\n- [ ] task 1";
    await fs.writeFile(boardPath, boardContent);

    const args = {
      vault: "test-vault",
      file: "kanban.md",
      task: "task 1",
      toList: "Missing List",
    };

    await assertRejects(
      () => tool.handler(args),
      Error,
      'Target list "Missing List" not found',
    );
  });
});
