import type { DraftChange, ValidationResult } from '@worldform/core'

export class WorkspaceDraftNotFoundError extends Error {
  public override readonly name = 'WorkspaceDraftNotFoundError'

  public constructor(public readonly draftId: string) {
    super(`Workspace draft does not exist: ${draftId}`)
  }
}

export class WorkspaceDraftStateError extends Error {
  public override readonly name = 'WorkspaceDraftStateError'

  public constructor(public readonly draft: DraftChange) {
    super(`Workspace draft ${draft.id} cannot be changed from status ${draft.status}`)
  }
}

export class WorkspaceValidationError extends Error {
  public override readonly name = 'WorkspaceValidationError'

  public constructor(
    public readonly draftId: string,
    public readonly validation: ValidationResult,
  ) {
    super(`Workspace draft failed validation: ${draftId}`)
  }
}
