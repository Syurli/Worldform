import { checkAdapterContract } from '@worldform/adapter-sdk'
import { deserializeSceneDocument } from '@worldform/core'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { helloAdapter } from '../src/index.js'

describe('Hello Adapter', () => {
  it('通过公共 SDK contract check 和 fixture validation', async () => {
    const document = deserializeSceneDocument(await readFile('scene.worldform.json', 'utf8'))
    const report = await checkAdapterContract(helloAdapter, { document, expectedValid: true })
    expect(report).toEqual({ valid: true, issues: [] })
  })
})
