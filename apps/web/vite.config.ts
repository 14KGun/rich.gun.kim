import { API_PORT, API_PREFIX, WEB_PORT } from '@rich/constants'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: WEB_PORT,
    proxy: {
      [`/${API_PREFIX}`]: `http://localhost:${API_PORT}`,
    },
  },
})
