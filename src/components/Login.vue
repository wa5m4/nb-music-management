<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="login-outer-box">
    <!-- 居中的选项卡容器 -->
    <div class="tabs-container">
      <div class="login-tabs">
        <RouterLink 
          to="/login" 
          class="tab-item" 
          :class="{ active: $route.path === '/login' }"
        >
          登录
        </RouterLink>
        <RouterLink 
          to="/login/registerview" 
          class="tab-item" 
          :class="{ active: $route.path === '/login/registerview' }"
        >
          注册
        </RouterLink>
      </div>
    </div>
    
    <!-- 子路由内容区域 -->
    <div class="login-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.login-outer-box {
  position: fixed;
  z-index: 1000;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  max-width: 90vw;
  height: 1500px;
  max-height: 90vh;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 选项卡居中容器 */
.tabs-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 0; /* 上下留白 */
}

/* 选项卡样式 */
.login-tabs {
  display: flex;
  gap: 5px; /* 选项卡之间的间距 */
}

.tab-item {
  padding: 12px 30px; /* 适中的点击区域 */
  font-size: 16px;
  font-weight: 500;
  color: #666666;
  text-decoration: none;
  border-radius: 6px; /* 轻微圆角 */
  transition: all 0.3s ease;
  position: relative;
}

/* 激活状态 */
.tab-item.active {
  color: #2c85ff;
  background-color: #ffffff; /* 激活项背景变白，与容器区分 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #2c85ff;
}

/* 悬停效果 */
.tab-item:not(.active):hover {
  color: #333333;
  background-color: #f0f0f0;
}

/* 内容区域 */
.login-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-outer-box {
    height: auto;
    min-height: 400px;
  }
  
  .tab-item {
    padding: 10px 20px;
    font-size: 15px;
  }
  
  .login-content {
    padding: 20px 15px;
  }
}
</style>