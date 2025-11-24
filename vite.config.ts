import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// element-plus
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';


// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), AutoImport({
    resolvers: [ElementPlusResolver()],
  }),
  Components({
    resolvers: [
      ElementPlusResolver(),
      AntDesignVueResolver()
    ],
  }),],
  // 开发时代理后端接口（包括 websocket）到真实后端，避免 CORS 问题
  server: {
    // port: 5174,
    proxy: {
      // 将 /td 路径代理到后端（请确保后端地址与下方 target 匹配）
      '/td': {
        target: 'http://192.168.208.146:9527',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
})
