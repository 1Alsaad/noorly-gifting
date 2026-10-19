import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import * as prettier from "prettier";

const paths = execFileSync("git", ["ls-files"], {
  encoding: "utf8",
}).trim().split("\n");
for (const path of paths) {
  const info = await prettier.getFileInfo(path, { ignorePath: ".prettierignore" });
  if (info.ignored || !info.inferredParser) continue;
  const content = await readFile(path, "utf8");
  const config = await prettier.resolveConfig(path);
  const formatted = await prettier.format(content, { ...config, filepath: path });
  if (formatted !== content)
    console.log("NOORLY_FORMAT_FILE:" + JSON.stringify({ path, content: formatted }));
}
process.exitCode = 1;
