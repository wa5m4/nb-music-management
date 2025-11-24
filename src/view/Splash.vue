<template>
  <!-- 点击页面任意位置跳过（点击卡片内部不会触发） -->
  <div class="splash-container" @click="enter">
    <div class="splash-card">
      <h1>NB Music</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

function enter() {
  try {
    // 标记本次会话已跳过 Splash，允许路由守卫放行到目标页（但不持久化）
    try { sessionStorage.setItem('splashSkipped', '1') } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }
  // 跳转到登录页
  router.push({ path: '/login' })
}
</script>

<style scoped>
body{
    overflow: hidden;
    background:#000;
    height: 100vh;
    color: #fff;
}

.splash-container{
  width:100%;
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background: #000; /* 页面背景黑色 */
}

.splash-card{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  background: #000; /* 卡片背景黑色 */
}

h1{
    width: 100%;
    margin: 0;
    text-align: center;
    font-size: 16vw;
    line-height: 1;
    color: #fff; /* 标题白色，确保在黑色背景可见 */
    animation: scale 3s forwards;
    background: url('/background.jpg') no-repeat center;
}

@keyframes scale{
    from{
        font-size: 22vw;
    }
    to{
        font-size: 10vw;
    }
}

</style>