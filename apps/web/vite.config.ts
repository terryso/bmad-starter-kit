import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // 代理 API 请求到后端服务器，避免 CORS 问题
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: 'copy-200-html',
      writeBundle() {
        // Surge.sh 需要在构建后创建 200.html 用于 SPA 路由回退
        const indexHtml = fs.readFileSync('dist/index.html', 'utf-8');
        fs.writeFileSync('dist/200.html', indexHtml);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
