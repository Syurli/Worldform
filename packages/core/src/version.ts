/** Worldform 通用场景文档格式版本。 */
export type DocumentFormatVersion = string

/** Project Adapter 所声明的项目场景语义版本。 */
export type ProjectSceneSchemaVersion = string

/** Worldform 与 Project Adapter 之间的公共协议版本。 */
export type AdapterApiVersion = string

/** 某个 Project Adapter 包自身的实现版本。 */
export type AdapterImplementationVersion = string

/** 当前 Worldform 能够直接读写的文档格式版本。 */
export const WORLDFORM_DOCUMENT_FORMAT_VERSION: DocumentFormatVersion = '1.0.0'

export interface ParsedProtocolVersion {
  major: number
  minor: number
  patch: number
}

export class VersionCompatibilityError extends Error {
  public override readonly name = 'VersionCompatibilityError'

  public constructor(
    public readonly expected: string,
    public readonly actual: string,
    public readonly contract: string,
  ) {
    super(`${contract} version is incompatible: expected ${expected}, received ${actual}`)
  }
}

/**
 * 解析 Phase 1 公共协议采用的三段式版本号。
 *
 * Core 不引入 semver 依赖；这里只固定公共兼容性判断所需的最小语义。
 */
export function parseProtocolVersion(version: string): ParsedProtocolVersion {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) throw new TypeError(`Invalid protocol version: ${version}`)

  const [, majorText, minorText, patchText] = match
  return {
    major: Number(majorText),
    minor: Number(minorText),
    patch: Number(patchText),
  }
}

/** Phase 1 公共协议以主版本一致作为基础兼容规则。 */
export function isProtocolVersionCompatible(expected: string, actual: string): boolean {
  return parseProtocolVersion(expected).major === parseProtocolVersion(actual).major
}

export function assertProtocolVersionCompatible(
  expected: string,
  actual: string,
  contract: string,
): void {
  if (!isProtocolVersionCompatible(expected, actual)) {
    throw new VersionCompatibilityError(expected, actual, contract)
  }
}
