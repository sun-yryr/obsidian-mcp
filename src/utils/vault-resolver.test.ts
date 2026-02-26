import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertThrows } from "@std/assert";
import { VaultResolver } from "./vault-resolver.ts";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

describe("VaultResolver", () => {
  describe("インスタンス化（準備フェーズ）", () => {
    it("1つ以上のVaultが提供された場合、正常に初期化され利用可能なVaultのリストを返すこと", () => {
      // 準備 (Arrange)
      const vaults = new Map([["test-vault", "/path/to/vault"]]);
      
      // 実行 (Act)
      const resolver = new VaultResolver(vaults);
      const available = resolver.getAvailableVaults();
      
      // 検証 (Assert)
      assertEquals(available, ["test-vault"]);
    });

    it("空のVaultマップが提供された場合、初期化エラーとなること", () => {
      // 準備 (Arrange)
      const emptyVaults = new Map<string, string>();
      
      // 実行 & 検証 (Act & Assert)
      assertThrows(
        () => new VaultResolver(emptyVaults),
        Error,
        "At least one vault is required"
      );
    });
  });

  describe("Vaultの解決（resolveVault）", () => {
    // 準備 (Arrange)
    const vaults = new Map([
      ["work", "/docs/work"],
      ["personal", "/docs/personal"]
    ]);
    const resolver = new VaultResolver(vaults);

    it("存在するVault名を指定した場合、正しいパスと名前が返されること", () => {
      // 実行 (Act)
      const result = resolver.resolveVault("work");
      
      // 検証 (Assert)
      assertEquals(result.vaultName, "work");
      assertEquals(result.vaultPath, "/docs/work");
    });

    it("存在しないVault名を指定した場合、InvalidParamsのMcpErrorが投げられること", () => {
      // 実行 & 検証 (Act & Assert)
      let caughtError: McpError | undefined;
      try {
        resolver.resolveVault("unknown");
      } catch (e) {
        if (e instanceof McpError) {
          caughtError = e;
        }
      }
      
      // Intent: 誤ったVault名はMCPプロトコル上、不正なパラメータとして扱われるべきである
      assertEquals(caughtError?.code, ErrorCode.InvalidParams);
    });
  });
});
