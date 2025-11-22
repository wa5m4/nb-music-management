<script setup>
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ElMessage } from 'element-plus';

// 状态管理和路由
const store = useAuthStore();
const router = useRouter();

// 表单数据（仅保留用户名和密码）
const loginForm = ref({
  username: '',
  password: ''
});

const handleLogin = async () => {
  // 基础验证（匹配后端必填参数要求）
  if (!loginForm.value.username.trim()) {
    ElMessage.error('请输入用户名');
    return;
  }
  if (!loginForm.value.password.trim()) {
    ElMessage.error('请输入密码');
    return;
  }

  try {
    // 传递符合后端要求的参数
    const success = await store.login({
      username: loginForm.value.username.trim(),
      password: loginForm.value.password.trim()
    });

    if (success) {
      ElMessage.success('登录成功');
      router.push('/home'); // 登录成功跳转首页
    } else {
      ElMessage.error(store.error || '登录失败');
    }
  } catch (err) {
    console.error('登录错误:', err);
    ElMessage.error('登录过程出错，请重试');
  }
};
</script>

<template>
  <div class="form-container">
    <div class="left-container">
      <div class="left-content">
        <h2 class="welcome-title">欢迎回来</h2>
        <p class="welcome-text">请登录您的账户继续使用</p>
        <div class="decorative-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>
    </div>
    <div class="right-form">
      <div class="form-header">
        <h1 class="form-title">账户登录</h1>
        <p class="form-subtitle">请输入您的用户名和密码</p>
      </div>
      <el-form class="login-form">
        <!-- 用户名输入框 -->
        <div class="form-group">
          <div class="form-label-group">
            <span class="form-label">账户信息</span>
            <div class="label-line"></div>
          </div>
          <el-form-item>
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名" 
              size="large"
              class="form-input"
            >
              <template #prefix>
                <i class="icon-user"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 密码输入框 -->
          <el-form-item>
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码" 
              size="large"
              class="form-input"
              show-password
            >
              <template #prefix>
                <i class="icon-lock"></i>
              </template>
            </el-input>
          </el-form-item>
        </div>

        <!-- 登录按钮 -->
        <el-form-item class="form-buttons">
          <el-button 
            @click="handleLogin" 
            type="primary" 
            size="large"
            class="login-btn"
            :loading="store.isLoading"
          >
            <span class="btn-text">立即登录</span>
            <i class="btn-arrow">→</i>
          </el-button>
        </el-form-item>

        <!-- 辅助链接 -->
        <div class="form-footer">
          <p>没有账户？<RouterLink to="/login" class="register-link">立即注册</RouterLink></p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 外层容器：适配内容高度 */
.form-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8fafc;
}

/* 左侧区域 */
.left-container {
  width: 40%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.left-content {
  text-align: center;
  color: white;
  z-index: 2;
  position: relative;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

.welcome-text {
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 300;
}

.decorative-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  left: -50px;
}

.shape-2 {
  width: 150px;
  height: 150px;
  bottom: 100px;
  right: 50px;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 200px;
  left: 100px;
}

/* 右侧表单区域 */
.right-form {
  width: 60%;
  padding: 40px 60px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #fff;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.03);
}

.form-header {
  margin-bottom: 30px;
  text-align: center;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.form-subtitle {
  color: #718096;
  font-size: 1rem;
}

.login-form {
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
}

/* 表单组：增加间距 */
.form-group {
  margin-bottom: 28px;
  width: 100%;
}

.form-label-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.form-label {
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
  margin-right: 12px;
  white-space: nowrap;
}

.label-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, #e2e8f0, transparent);
}

/* 输入框：增大尺寸 */
.form-input {
  width: 100%;
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #667eea, 0 4px 8px rgba(102, 126, 234, 0.2);
}

/* 登录按钮：突出显示 */
.form-buttons {
  margin-top: 30px;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-text {
  margin-right: 8px;
}

.btn-arrow {
  transition: transform 0.3s;
}

.login-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* 图标样式 */
:deep(.el-input__prefix) {
  display: flex;
  align-items: center;
  padding-left: 12px;
}

.icon-user, .icon-lock {
  width: 18px;
  height: 18px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
}

.icon-user {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E");
}

.icon-lock {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/%3E%3C/svg%3E");
}

/* 表单底部 */
.form-footer {
  text-align: center;
  margin-top: 25px;
  color: #718096;
  font-size: 0.95rem;
}

.register-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.register-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 响应式调整：保证适配性 */
@media (max-width: 992px) {
  .form-container {
    flex-direction: column;
    min-height: 100vh;
  }

  .left-container, .right-form {
    width: 100%;
  }

  .left-container {
    height: 200px;
  }

  .right-form {
    padding: 30px 25px;
    flex: 1;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
}

@media (max-width: 576px) {
  .right-form {
    padding: 20px 15px;
  }
  
  .form-title {
    font-size: 1.7rem;
  }
}
</style>