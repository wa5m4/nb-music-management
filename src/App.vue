<!-- App.vue -->
<script setup lang="ts">
import Navigation from './components/Navigation.vue'
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import { useGlobalStore } from './store';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const store = useGlobalStore();
const route = useRoute();

const showLoginModal = computed(() => {
  return route.path.startsWith('/login') && !store.isLogin;
});
</script>

<template>
  <div class="common-layout" :class="{'blur-content': showLoginModal}">
    <el-container>
      <el-header>
        <Header></Header>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <Navigation />
        </el-aside>
        <el-container>
          <el-main>
            <RouterView/>
          </el-main>
          <el-footer>
            <Footer></Footer>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>

  <div v-if="showLoginModal" class="login-modal-overlay">
    <RouterView />
  </div>
</template>

<style scoped>
.common-layout{
  width: 100%;
  min-height: 100vh;
  transition: filter 0.3s ease;
}

.blur-content{
  filter: blur(5px);
  pointer-events: none;
}

/* 登录模态框遮罩层 */
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3); /* 半透明黑色背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
</style>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
}

a{
  text-decoration: none;      
}
</style>