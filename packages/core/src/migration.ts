import { cloneSceneData } from './clone.js'
import type { SceneDocument } from './model.js'

/** 一个明确的单向 SceneDocument schema 迁移步骤。 */
export interface SceneDocumentMigration {
  fromVersion: string
  toVersion: string
  migrate(document: SceneDocument): SceneDocument
}

/**
 * 按版本链迁移文档。
 *
 * Phase 1 不规定版本号比较算法；迁移图由显式 fromVersion/toVersion 决定，
 * 避免把 semver、日期版本或项目自定义版本策略写死在 Core 中。
 */
export function migrateSceneDocument(
  source: SceneDocument,
  targetVersion: string,
  migrations: readonly SceneDocumentMigration[],
): SceneDocument {
  let current = cloneSceneData(source)
  const visitedVersions = new Set<string>()

  while (current.schemaVersion !== targetVersion) {
    if (visitedVersions.has(current.schemaVersion)) {
      throw new Error(`Scene migration cycle detected at version: ${current.schemaVersion}`)
    }
    visitedVersions.add(current.schemaVersion)

    const candidates = migrations.filter(
      (migration) => migration.fromVersion === current.schemaVersion,
    )
    if (candidates.length === 0) {
      throw new Error(`No scene migration from ${current.schemaVersion} to ${targetVersion}`)
    }
    if (candidates.length > 1) {
      throw new Error(`Ambiguous scene migrations from version: ${current.schemaVersion}`)
    }

    const migration = candidates[0]
    if (!migration) throw new Error('Scene migration lookup failed unexpectedly')

    const migrated = migration.migrate(cloneSceneData(current))
    if (migrated.schemaVersion !== migration.toVersion) {
      throw new Error(
        `Scene migration ${migration.fromVersion} -> ${migration.toVersion} returned version ${migrated.schemaVersion}`,
      )
    }
    current = cloneSceneData(migrated)
  }

  return current
}
