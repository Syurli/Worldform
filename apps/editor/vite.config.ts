import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Pascal Viewer 0.9.2 的发布 bundle 仍读取该 Node 风格常量，Host 在打包边界显式替换。
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  server: { host: '127.0.0.1', port: 4173 },
  build: { sourcemap: true },
}))
