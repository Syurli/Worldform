---
name: worldform-adapter-development
description: Integrate an independent project with Worldform through the official Project Adapter boundary without modifying Worldform core.
---

# Worldform Adapter Development

Use this skill from a consumer project repository.

1. Read Worldform `PROJECT_ADAPTER.md` and `THIRD_PARTY_INTEGRATION.md`.
2. Separate universal scene data, project-specific descriptors and real project algorithms.
3. Keep real generation/physics/navigation/task logic in the project and expose it as capabilities.
4. Implement node/component/property descriptors, validators and required export targets.
5. Run Adapter contract tests and `worldform adapter check` when available.
6. Use Workspace/CLI/MCP for scene mutation; never edit Pascal/Three internal state as the formal format.
7. If integration requires changing Worldform, document the missing platform capability before doing so.
