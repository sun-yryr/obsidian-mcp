import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { assertEquals, assertMatch, assertRejects } from "@std/assert";
import { createCreateNoteTool } from "./index.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";

describe("Tool: create-note", () => {
  let tempVaultPath: string;
  let vaults: Map<string, string>;

  beforeEach(async () => {
    // 準備 (Arrange): 独立したテスト環境としてテンポラリディレクトリを作成
    const rawTempPath = await fs.mkdtemp(path.join(os.tmpdir(), "obsidian-mcp-test-"));
    tempVaultPath = await fs.realpath(rawTempPath); // macOSのシンボリックリンク(/var -> /private/var)対策
    vaults = new Map([["test-vault", tempVaultPath]]);
  });

  afterEach(async () => {
    // クリーンアップ (Teardown): 実行後に環境を元に戻す
    await fs.rm(tempVaultPath, { recursive: true, force: true });
  });

  describe("実行（ハンドラーの振る舞い）", () => {
    it("有効なパラメータが渡された場合、指定されたVault内に新規ファイルが作成されること", async () => {
      // 準備
      const tool = createCreateNoteTool(vaults);
      const args = {
        vault: "test-vault",
        filename: "test-note.md",
        content: "# Test Note\nThis is a test."
      };
      
      // 実行 (Act)
      const result = await tool.handler(args);
      
      // 検証 (Assert)
      // 意図 1: 物理的に指定したパスにファイルが存在していること
      const createdFilePath = path.join(tempVaultPath, "test-note.md");
      const stat = await fs.stat(createdFilePath);
      assertEquals(stat.isFile(), true);
      
      // 意図 2: 書き込まれた内容が引数で渡したcontentと完全に一致すること
      const content = await fs.readFile(createdFilePath, "utf8");
      assertEquals(content, "# Test Note\nThis is a test.");
      
      // 意図 3: MCPサーバーとしての返り値のフォーマットが正しいこと
      assertEquals(result.content[0].type, "text");
      assertMatch(result.content[0].text, /Created file:.*test-note\.md/);
    });

    it("フォルダパス（folder引数）が指定された場合、存在しない親ディレクトリも自動的に生成されてファイルが配置されること", async () => {
      // 準備
      const tool = createCreateNoteTool(vaults);
      const args = {
        vault: "test-vault",
        filename: "sub-note.md",
        folder: "project/docs",
        content: "subfolder note content"
      };
      
      // 実行
      await tool.handler(args);
      
      // 検証
      const createdFilePath = path.join(tempVaultPath, "project/docs/sub-note.md");
      const content = await fs.readFile(createdFilePath, "utf8");
      assertEquals(content, "subfolder note content");
    });
    
    it("すでに同名のファイルが存在している場合、上書き防止のためにエラーが投げられること", async () => {
      // 準備: 事前にファイルを配置してコンフリクトを発生させる
      const tool = createCreateNoteTool(vaults);
      const existingPath = path.join(tempVaultPath, "conflict.md");
      await fs.writeFile(existingPath, "original content");
      
      const args = {
        vault: "test-vault",
        filename: "conflict.md",
        content: "new content"
      };
      
      // 実行 & 検証
      // 意図: `edit-note` ツールを使わず意図しない上書きが起きないよう保護されるべき
      await assertRejects(
        () => tool.handler(args),
        Error,
        "already exists"
      );
    });
  });
});
