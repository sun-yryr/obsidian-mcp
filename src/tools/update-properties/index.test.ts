import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { assertEquals, assertRejects } from "@std/assert";
import { createUpdatePropertiesTool } from "./index.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";

describe("Tool: update-properties", () => {
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

  it("should update existing properties and add new ones", async () => {
    const tool = createUpdatePropertiesTool(vaults);
    const notePath = path.join(tempVaultPath, "test.md");
    await fs.writeFile(
      notePath,
      "---\nstatus: todo\ntags: [tag1]\n---\n# Content",
    );

    const args = {
      vault: "test-vault",
      file: "test.md",
      properties: {
        status: "done",
        priority: "high",
      },
    };

    await tool.handler(args);

    const content = await fs.readFile(notePath, "utf8");
    assertEquals(
      content.includes("status: done"),
      true,
      "Status should be updated",
    );
    assertEquals(
      content.includes("priority: high"),
      true,
      "Priority should be added",
    );
    assertEquals(content.includes("tags:"), true, "Existing tags should remain");
  });

  it("should remove properties when set to null", async () => {
    const tool = createUpdatePropertiesTool(vaults);
    const notePath = path.join(tempVaultPath, "test.md");
    await fs.writeFile(
      notePath,
      "---\nstatus: todo\npriority: high\n---\n# Content",
    );

    const args = {
      vault: "test-vault",
      file: "test.md",
      properties: {
        status: null,
      },
    };

    await tool.handler(args);

    const content = await fs.readFile(notePath, "utf8");
    assertEquals(
      content.includes("status:"),
      false,
      "Status should be removed",
    );
    assertEquals(
      content.includes("priority: high"),
      true,
      "Priority should remain",
    );
  });

  it("should create frontmatter if it doesn't exist", async () => {
    const tool = createUpdatePropertiesTool(vaults);
    const notePath = path.join(tempVaultPath, "test.md");
    await fs.writeFile(notePath, "# Content without frontmatter");

    const args = {
      vault: "test-vault",
      file: "test.md",
      properties: {
        author: "AI",
      },
    };

    await tool.handler(args);

    const content = await fs.readFile(notePath, "utf8");
    assertEquals(content.startsWith("---\nauthor: AI\n---"), true);
    assertEquals(content.includes("# Content without frontmatter"), true);
  });

  it("should fail if file doesn't exist", async () => {
    const tool = createUpdatePropertiesTool(vaults);
    const args = {
      vault: "test-vault",
      file: "non-existent.md",
      properties: { key: "value" },
    };

    await assertRejects(
      () => tool.handler(args),
      Error,
      "Note not found",
    );
  });
});
