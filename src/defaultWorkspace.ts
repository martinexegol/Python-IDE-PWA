import { FileNode } from './types';

export const DEFAULT_WORKSPACE_FILES: FileNode[] = [
  {
    id: 'file-main-zig',
    name: 'main.zig',
    path: 'main.zig',
    isFolder: false,
    content: `const std = @import("std");

pub fn main() !void {
    std.debug.print("Hello, Zig!\\n", .{});
}
`,
  },
];
