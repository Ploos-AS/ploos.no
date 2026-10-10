import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({site:'https://ploos.no',output:'static',vite:{plugins:[tailwindcss()]}});
