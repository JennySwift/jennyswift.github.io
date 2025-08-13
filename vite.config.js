import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    base: '/',                 // add this (root since it's a user site)
    build: { outDir: 'docs' }, // add this
})