import path from "node:path";
import { mkdir, open, stat, writeFile } from "node:fs/promises";

export function handoffPathFor(cwd: string, agentId: string, now: number): string {
  if (!path.isAbsolute(cwd)) throw new Error("The agent working directory must be absolute.");
  if (!/^[a-zA-Z0-9_-]+$/.test(agentId)) throw new Error("Unsafe agent id for a handoff filename.");
  const stamp = new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return path.join(cwd, ".paseo", "switchboard", `${agentId}-${stamp}.md`);
}

export async function writeHandoff(file: string, document: string): Promise<void> {
  if (!document.trim()) throw new Error(`Cannot write an empty handoff: ${file}`);
  await mkdir(path.dirname(file), { recursive: true });
  // Never overwrite a previous handoff, even after a fast failed retry.
  await writeFile(file, document, { encoding: "utf8", flag: "wx" });
  const saved = await stat(file);
  if (!saved.isFile() || saved.size === 0) throw new Error(`Handoff verification failed: ${file}`);
}

/** Extend our verified file if an initially idle source starts a turn during capture. */
export async function appendInterruption(file: string, section: string): Promise<void> {
  const handle = await open(file, "r+");
  try {
    const before = await handle.stat();
    if (!before.isFile() || !before.size) throw new Error(`Handoff verification failed: ${file}`);
    const bytes = Buffer.from(section, "utf8");
    let written = 0;
    while (written < bytes.length) {
      const result = await handle.write(bytes, written, bytes.length - written, before.size + written);
      if (!result.bytesWritten) throw new Error(`Interruption note write made no progress: ${file}`);
      written += result.bytesWritten;
    }
    if ((await handle.stat()).size <= before.size) throw new Error(`Interruption note was not saved: ${file}`);
  } finally {
    await handle.close();
  }
}
