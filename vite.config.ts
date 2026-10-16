import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'

const isElectron = process.env.ELECTRON === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    ...(isElectron
      ? [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
            {
              entry: 'electron/preload.ts',
              onstart(args) {
                args.reload()
              },
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
          ]),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
