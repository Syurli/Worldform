---
name: worldform-development
description: Develop Worldform itself while preserving Core, Workspace, Adapter, Editor, CLI and MCP boundaries.
---

# Worldform Development

Use this skill only when modifying the Worldform repository itself.

1. Read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` and the current task.
2. Preserve SceneDocument as authority and Patch as the mutation format.
3. Route application state through Workspace/Session; do not create separate Editor/CLI/MCP state machines.
4. Keep project rules out of Core.
5. Before adding a public capability, update tests and relevant ADR/docs.
6. Do not start TWR/Place adapters before P1-009 passes.
7. Run `pnpm check`, `pnpm test` and `pnpm lint` before completion.
