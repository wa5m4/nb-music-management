<script setup>
    import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="login-outer-box">
    <div class="login-choice">
      <span><RouterLink to="/login">密码登录  |</RouterLink></span>
      <span><RouterLink to="/login/messageLogin">  短信登录</RouterLink></span>
    </div>
    <div class="login-view">
      <RouterView/> <!-- 渲染登录子路由 -->
    </div>
  </div>
</template>

<style scoped>
    .login-outer-box{
        position: fixed;
        z-index: 1000;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-50%);
        background-color: white;
        width: 700px;
        height: 400px;
        border-radius: 8px;
        display: flex;
        border: solid;
        flex-direction: column;
        align-items: center;
    }
    a{
        top: 20px;
        text-decoration: none;
        color: inherit;
    }
    span{
        position: relative;
        top: 20px;
    }
    .login-view{
        position: relative;
        top: 30px;
    }
    
</style>