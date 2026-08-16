#!/usr/bin/env node
import { runWorldformCli } from './cli.js'

const result = await runWorldformCli(process.argv.slice(2))
process.exitCode = result.exitCode
