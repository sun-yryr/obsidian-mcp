import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertThrows, assertNotEquals } from "@std/assert";
import path from "node:path";
import { normalizePath } from "./path.ts";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

describe("normalizePath", () => {
  describe("Common tests", () => {
    it("should handle relative paths", () => {
      assertEquals(
        normalizePath("./path/to/file"),
        path.resolve("./path/to/file"),
      );
      assertEquals(
        normalizePath("../path/to/file"),
        path.resolve("../path/to/file"),
      );
    });

    it("should throw error for invalid paths", () => {
      assertThrows(() => normalizePath(""), McpError);
      assertThrows(() => normalizePath(null as any), McpError);
      assertThrows(() => normalizePath(undefined as any), McpError);
      assertThrows(() => normalizePath(123 as any), McpError);
    });
  });

  describe("Windows-specific tests", () => {
    it("should handle Windows drive letters", () => {
      assertEquals(
        normalizePath("C:\\path\\to\\file"),
        "C:/path/to/file",
      );
      assertEquals(normalizePath("D:/path/to/file"), "D:/path/to/file");
      assertEquals(normalizePath("Z:\\test\\folder"), "Z:/test/folder");
    });

    it("should allow colons in Windows drive letters", () => {
      assertEquals(
        normalizePath("C:\\path\\to\\file"),
        "C:/path/to/file",
      );
      assertEquals(normalizePath("D:/path/to/file"), "D:/path/to/file");
      assertEquals(normalizePath("X:\\test\\folder"), "X:/test/folder");
    });

    it("should reject Windows paths with invalid characters", () => {
      // Note: non-Windows platforms don't restrict these characters as much, 
      // but if we enforce Windows logic via process.platform === "win32" we should simulate it.
      // Since path validation relies on the current platform, we use process.platform to conditionally test.
      if (process.platform === "win32") {
        assertThrows(() => normalizePath("C:\\path\\to\\file<"), McpError);
        assertThrows(() => normalizePath("D:/path/to/file>"), McpError);
        assertThrows(() => normalizePath("E:\\test\\folder|"), McpError);
        assertThrows(() => normalizePath("F:/test/folder?"), McpError);
        assertThrows(() => normalizePath("G:\\test\\folder*"), McpError);
      }
    });

    it("should handle UNC paths correctly", () => {
      assertEquals(
        normalizePath("\\\\server\\share\\path"),
        "//server/share/path",
      );
      assertEquals(
        normalizePath("//server/share/path"),
        "//server/share/path",
      );
      assertEquals(
        normalizePath("\\\\server\\share\\folder\\file"),
        "//server/share/folder/file",
      );
    });

    it("should handle network drive paths", () => {
      assertEquals(
        normalizePath("Z:\\network\\drive"),
        "Z:/network/drive",
      );
      assertEquals(normalizePath("Y:/network/drive"), "Y:/network/drive");
    });

    it("should preserve path separators in UNC paths", () => {
      const result = normalizePath("\\\\server\\share\\path");
      assertEquals(result, "//server/share/path");
      assertNotEquals(result, path.resolve("//server/share/path"));
    });

    it("should preserve drive letters in Windows paths", () => {
      const result = normalizePath("C:\\path\\to\\file");
      assertEquals(result, "C:/path/to/file");
      assertNotEquals(result, path.resolve("C:/path/to/file"));
    });
  });

  describe("macOS/Unix-specific tests", () => {
    it("should handle absolute paths", () => {
      assertEquals(
        normalizePath("/path/to/file"),
        path.resolve("/path/to/file"),
      );
    });

    it("should handle mixed forward/backward slashes", () => {
      assertEquals(normalizePath("path\\to\\file"), "path/to/file");
    });

    it("should handle paths with colons in filenames", () => {
      assertEquals(
        normalizePath("/path/to/file:name"),
        path.resolve("/path/to/file:name"),
      );
    });
  });
});
