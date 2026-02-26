import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { createToolResponse, formatFileResult } from "./responses.ts";

describe("Responses Utilities", () => {
  describe("createToolResponse", () => {
    it("テキストメッセージを受け取り、MCPプロトコルの規定に準拠したcontent配列を持つオブジェクトを返すこと", () => {
      // 準備 & 実行 (Arrange & Act)
      const response = createToolResponse("処理が完了しました");
      
      // 検証 (Assert)
      // 意図: クライアントが解釈できるよう、必ず type: "text" の要素を持つ配列でラップされていること
      assertEquals(response.content.length, 1);
      assertEquals(response.content[0].type, "text");
      assertEquals(response.content[0].text, "処理が完了しました");
    });
  });

  describe("formatFileResult", () => {
    it("ファイル作成操作（create）の成功結果を受け取った場合、直感的に理解できるサマリー文字列を組み立てること", () => {
      // 実行 (Act)
      const formatted = formatFileResult({
        success: true,
        message: "Note created successfully",
        operation: "create",
        path: "/mock/vault/new-note.md"
      });
      
      // 検証 (Assert)
      // 意図: 操作内容（Created）と対象パスが1行目に、詳細メッセージが2行目に表示されること
      assertEquals(
        formatted,
        "Created file: /mock/vault/new-note.md\nNote created successfully"
      );
    });

    it("ファイル変更操作（edit）の成功結果を受け取った場合、Modifiedと表現された文字列を組み立てること", () => {
      // 実行 (Act)
      const formatted = formatFileResult({
        success: true,
        message: "Content appended",
        operation: "edit",
        path: "/mock/vault/existing.md"
      });
      
      // 検証 (Assert)
      assertEquals(
        formatted,
        "Modified file: /mock/vault/existing.md\nContent appended"
      );
    });
  });
});
