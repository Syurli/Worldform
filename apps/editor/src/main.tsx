import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app.js'
import { WorldformEditorSession } from './editor-session.js'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Worldform editor root element was not found')

const session = new WorldformEditorSession()
await session.initialize()

createRoot(rootElement).render(
  <StrictMode>
    <App session={session} />
  </StrictMode>,
)
