import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    sourcemap: false, // Disable source maps in production
  },
  server: {
    sourcemapIgnoreList: (sourcePath, sourcemapPath) => {
      // Ignore source maps for node_modules and React DevTools
      return sourcePath.includes('node_modules') ||
             sourcemapPath.includes('installHook') ||
             sourcemapPath.includes('react_devtools');
    },
  },
})
