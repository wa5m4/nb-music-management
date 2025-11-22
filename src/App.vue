<script setup lang="ts">
import AudioPlayer from './components/AudioPlayer.vue'
</script>

<template>
  <!-- 主应用容器 -->
  <div class="app-container">
    <!-- 页面内容区域 -->
    <div class="page-content">
      <router-view></router-view>
    </div>
    
    <!-- 全局音频播放器 -->
    <AudioPlayer />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  padding-bottom: 80px; /* 为播放器预留空间 */
}
</style>