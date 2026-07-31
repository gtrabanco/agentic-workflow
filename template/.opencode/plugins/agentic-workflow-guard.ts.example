// Copy to .opencode/plugins/agentic-workflow-guard.ts to enable it.
// OpenCode auto-loads .js/.ts files in that directory at startup.
export const AgenticWorkflowGuard = async (context: any) => {
  return {
    "tool.execute.before": async (input: any, output: any) => {
      if (input.tool !== "bash" && input.tool !== "read") return;

      const args = output?.args ?? {};
      const command = input.tool === "bash" ? String(args.command ?? "") : "";
      const filePath = input.tool === "read"
        ? String(args.filePath ?? args.file_path ?? args.path ?? "")
        : "";
      const worktree = String(context?.worktree ?? process.cwd());
      const guard = `${worktree}/.agentic-workflow/hooks/guard-command.sh`;
      const child = Bun.spawn([guard, "--command", command, "--path", filePath], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const [status, stderr] = await Promise.all([
        child.exited,
        new Response(child.stderr).text(),
      ]);
      if (status !== 0) {
        throw new Error(stderr.trim() || "Blocked by agentic-workflow safety policy");
      }
    },
  };
};
