---
name: worldform-adapter-development
description: Integrate an independent project with Worldform through the official Project Adapter boundary without modifying Worldform core.
---

# Worldform Adapter Development

Use this skill only in a consumer project repository. Do not modify Worldform to make a project-specific rule fit.

## Required reading

1. `docs/PROJECT_ADAPTER.md`
2. `docs/THIRD_PARTY_INTEGRATION.md`
3. `docs/COMPATIBILITY.md`
4. `templates/adapter-minimal/README.md`

## Workflow

1. Inventory universal scene data, project descriptors, and real project algorithms separately.
2. Keep generation, physics, navigation, mission, completion, and compile logic in the project; expose calls as capabilities.
3. Start from the minimal template and install one matching `@worldform/*` Alpha version group.
4. Declare a unique Adapter ID, Adapter API version, project scene schema version, and implementation version.
5. Declare namespaced node, component, property, validator, capability, and export descriptors.
6. Normalize project validation into structured issues. Never leak local filesystem paths.
7. Return proposed `ScenePatch[]` from mutating capabilities. Never mutate the authoritative document or renderer state directly.
8. Add `checkAdapterContract()` tests and at least one valid fixture scene.
9. Build before loading the Adapter; expose a unique `default`, `adapter`, or `worldformAdapter` export.
10. Run all required checks:

```bash
pnpm build
pnpm test
worldform adapter:check ./dist/index.js --json
worldform validate ./scene.worldform.json --adapter ./dist/index.js --json
worldform inspect ./scene.worldform.json --json
```

11. Configure `worldform-mcp --scene <scene> --adapter <built-module>` and verify query → Draft → Preview → Apply → Undo.
12. If integration still requires a Worldform change, record the smallest reproducible missing platform capability. Do not copy project rules into Core.

## Ownership checks

- `SceneDocument`, Patch, revision and structural validation belong to Core.
- Runtime state, History, Draft and Apply belong to Workspace.
- Project schema and project algorithm calls belong to the Adapter/project.
- Pascal/Three state is an authoring projection, never the formal document.
- CLI/MCP/Editor must not implement a second mutation pipeline.

Stop and report a platform gap if a requirement cannot cross these boundaries without arbitrary code execution, renderer persistence, or project code inside Worldform.
