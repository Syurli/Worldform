import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app.js'
import { WorldformEditorSession } from './editor-session.js'
import { loadEditorProject } from './project-loader.js'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Worldform editor root element was not found')

try {
  const project = await loadEditorProject(window.location.search, window.location.href)
  const session = project
    ? new WorldformEditorSession(project.adapter, project.document)
    : new WorldformEditorSession()
  await session.initialize()

  createRoot(rootElement).render(
    <StrictMode>
      <App session={session} />
    </StrictMode>,
  )
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  rootElement.textContent = `Worldform 项目加载失败：${message}`
  throw error
}
