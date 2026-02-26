import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { createListAvailableVaultsTool } from "./index.ts";

describe("Tool: list-available-vaults", () => {
  describe("実行（ハンドラーの振る舞い）", () => {
    it("登録されているVaultのリストがユーザーにわかりやすいテキストフォーマットで返されること", async () => {
      // 準備 (Arrange)
      // 複数のVaultが提供されている状態をエミュレートする
      const vaults = new Map([
        ["vault-a", "/path/to/a"],
        ["vault-b", "/path/to/b"]
      ]);
      const tool = createListAvailableVaultsTool(vaults);
      
      // 実行 (Act)
      // MCPプロトコルからツールが呼び出された時と同様にhandlerを実行する
      const result = await tool.handler({});
      
      // 検証 (Assert)
      // 意図: 返却されるメッセージは、箇条書きでVault名が列挙された読みやすいテキストであること
      const expectedMessage = "Available vaults:\n  - vault-a\n  - vault-b";
      assertEquals(result.content[0].type, "text");
      assertEquals(result.content[0].text, expectedMessage);
    });
  });
});
