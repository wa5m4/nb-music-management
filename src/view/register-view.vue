<script setup>
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import api from '../services/api';
// 引入 Element Plus 的消息提示组件
import { ElMessage } from 'element-plus';

const getIn = () => {
  // 1. 模拟一个 token（随便填一个字符串）
  const mockToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE4MzIwNzcyNzEsInVzZXJJZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.os_tB3lYYnz9J6Zfz_sqEBSZ2G8FvIUiTqs9I2Vzu7g';
  // 2. 模拟一个用户对象（结构符合你的 User 类型）
  const mockUser = {
    id: '1',
    username: 'test-user',
  };

  // 3. 更新 store 状态
  store.token = mockToken;
  store.user = mockUser;

  // 4. 持久化到 localStorage
  localStorage.setItem('token', mockToken);
  localStorage.setItem('user', JSON.stringify(mockUser));

  // 5. 提示并跳转
  ElMessage.success('已模拟登录，进入首页');
  router.push('/home');
};

const store = useAuthStore();
const router = useRouter();

// 表单数据绑定
const loginForm = ref({
  email: '',
  password: '',
  username: '',
  code: '',
  sex: '男',
  emailCode: '',
});

// 验证码倒计时
const countdown = ref(0);
const isSending = ref(false);

// 登录方法
const handleLogin = async () => {
  if (!loginForm.value.email || !loginForm.value.password) {
    // 替换为警告提示
    ElMessage.warning('请输入邮箱和密码');
    return;
  }

  try {
    const success = await store.login({
      email: loginForm.value.email,
      password: loginForm.value.password
    });

    if (success) {
      // 成功提示
      ElMessage.success('登录成功，正在跳转...');
      router.push('/home');
    } else {
      // 错误提示
      ElMessage.error(store.error || '登录失败');
    }
  } catch (err) {
    console.error('登录错误:', err);
    ElMessage.error('登录过程出错，请重试');
  }
};

// 注册方法
const handleRegister = async () => {
  if (!loginForm.value.username || !loginForm.value.email || !loginForm.value.password || !loginForm.value.code || !loginForm.value.sex || !loginForm.value.emailCode) {
    ElMessage.warning('请填写完整注册信息');
    return;
  }

  try {
    const success = await store.register({
      username: loginForm.value.username,
      email: loginForm.value.email,
      password: loginForm.value.password,
      code: loginForm.value.code,
      sex: loginForm.value.sex,
      emailCode: loginForm.value.emailCode,
      codeKey: store.codeKey
    });
    if (success) {
      ElMessage.success('注册成功，请登录');
      router.push('/home');
      // 清空表单
      Object.keys(loginForm.value).forEach(key => {
        loginForm.value[key] = '';
      });
      loginForm.value.sex = '男';
    } else {
      ElMessage.error(store.error || '注册失败');
    }
  } catch (err) {
    console.error('注册错误:', err);
    ElMessage.error('注册过程出错，请重试');
  }
};

// 刷新图片验证码
const refreshCaptcha = () => {
  store.handlePic();
};

const sendEmailCode = async () => {
  if (isSending.value || countdown.value > 0) return;
  
  if (!loginForm.value.email) {
    ElMessage.warning('请先输入邮箱地址');
    return;
  }

  const success = await sendCode(loginForm.value.email);
  if (success) {
    isSending.value = true;
    countdown.value = 60;
    ElMessage.success('验证码已发送，请注意查收');
    
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
        isSending.value = false; 
      }
    }, 1000);
  } else {
    ElMessage.error(store.error || '验证码发送失败，请重试');
  }
};

const sendCode = async () => {
  try {
    const codeRes = await api.get('/user/emailCode', {
      params: { email: loginForm.value.email }
    });

    if (codeRes.data.code === 200) {
      console.log('发送验证码成功');
      return true;
    } else {
      console.log('发送失败:', codeRes.data.msg);
      store.error = codeRes.data.msg || '验证码发送失败';
      return false;
    }
  } catch (err) {
    console.error('发送验证码错误:', err);
    if (axios.isAxiosError(err)) {
      store.error = err.response?.data?.msg || '网络异常，发送失败';
    } else {
      store.error = '发送过程发生错误';
    }
    return false;
  }
}

onMounted(() => {
  store.handlePic();
});
</script>

<template>
  <div class="form-container-psd">
    <div class="left-container">
      <div class="left-content">
        <h2 class="welcome-title">欢迎注册</h2>
        <p class="welcome-text">加入我们，开启全新体验</p>
        <div class="decorative-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>
    </div>
    <div class="right-form">
      <div class="form-header">
        <h1 class="form-title">创建账户</h1>
        <p class="form-subtitle">请填写以下信息完成注册</p>
      </div>
      <el-form class="login-form">
        <!-- 第一组：用户名、密码、图片验证码 -->
        <div class="form-group">
          <div class="form-label-group">
            <span class="form-label">基本信息</span>
            <div class="label-line"></div>
          </div>
          <el-form-item>
            <el-input 
              placeholder="请输入用户名" 
              v-model="loginForm.username"
              class="form-input"
              size="large"
            >
              <template #prefix>
                <i class="icon-user"></i>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input 
              type="password" 
              placeholder="请输入密码" 
              v-model="loginForm.password"
              class="form-input"
              size="large"
              show-password
            >
              <template #prefix>
                <i class="icon-lock"></i>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item class="input-with-side">
            <el-input 
              placeholder="图片验证码" 
              v-model="loginForm.code"
              class="form-input flex-grow"
              size="large"
            >
              <template #prefix>
                <i class="icon-shield"></i>
              </template>
            </el-input>
            <div class="pic-container" @click="refreshCaptcha">
              <img :src="store.imgUrl" alt="验证码" class="verification-img">
              <div class="refresh-tip">点击刷新</div>
            </div>
          </el-form-item>
        </div>

        <!-- 第二组：邮箱、邮箱验证码 -->
        <div class="form-group">
          <div class="form-label-group">
            <span class="form-label">邮箱验证</span>
            <div class="label-line"></div>
          </div>
          <el-form-item class="input-with-side">
            <el-input 
              placeholder="请输入邮箱" 
              v-model="loginForm.email"
              class="form-input flex-grow"
              size="large"
            >
              <template #prefix>
                <i class="icon-email"></i>
              </template>
            </el-input>
            <el-button 
              @click="sendEmailCode" 
              :disabled="isSending || countdown > 0"
              class="send-code-btn"
              size="large"
            >
              {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
            </el-button>
          </el-form-item>

          <el-form-item>
            <el-input 
              placeholder="邮箱验证码" 
              v-model="loginForm.emailCode"
              class="form-input"
              size="large"
            >
              <template #prefix>
                <i class="icon-code"></i>
              </template>
            </el-input>
          </el-form-item>
        </div>

        <!-- 性别选项框 -->
        <div class="form-group">
          <div class="form-label-group">
            <span class="form-label">性别选择</span>
            <div class="label-line"></div>
          </div>
          <el-form-item class="sex-group">
            <el-radio-group v-model="loginForm.sex" class="sex-radio-group">
              <el-radio label="男" class="sex-radio">
                <span class="sex-symbol male">♂</span>
                <span class="sex-text">男</span>
              </el-radio>
              <el-radio label="女" class="sex-radio">
                <span class="sex-symbol female">♀</span>
                <span class="sex-text">女</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item class="form-buttons">
          <el-button @click="handleRegister" class="register-btn" type="primary" size="large">
            <span class="btn-text">立即注册</span>
            <i class="btn-arrow">→</i>
          </el-button>
        </el-form-item>
        
        <div class="form-footer">
          <p>已有账户？点击上方登录</p>
          <el-button @click="getIn">
            跳过登录
          </el-button>
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
.form-container-psd {
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

/* 带侧边元素的容器：优化间距 */
.input-with-side {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.flex-grow {
  flex: 1;
}

/* 图片验证码容器：协调尺寸 */
.pic-container {
  width: 120px;
  height: 44px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pic-container:hover {
  border-color: #667eea;
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.pic-container:hover .refresh-tip {
  opacity: 1;
}

.verification-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.refresh-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.7rem;
  text-align: center;
  padding: 2px;
  opacity: 0;
  transition: opacity 0.3s;
}

/* 发送验证码按钮：增大尺寸 */
.send-code-btn {
  width: 130px;
  padding: 0 12px;
  border-radius: 8px;
  white-space: nowrap;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  transition: all 0.3s;
}

.send-code-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.send-code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 注册按钮：突出显示 */
.form-buttons {
  margin-top: 30px;
  width: 100%;
}

.register-btn {
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

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-text {
  margin-right: 8px;
}

.btn-arrow {
  transition: transform 0.3s;
}

.register-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* 性别选项：优化尺寸 */
.sex-group {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.sex-radio-group {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 15px;
}

.sex-radio {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 14px 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.3s;
  background: #f8fafc;
}

.sex-radio:hover {
  border-color: #cbd5e0;
  background: #edf2f7;
}

.sex-symbol {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  border-radius: 50%;
  margin-right: 8px;
  font-weight: bold;
  font-size: 1.1rem;
}

.male {
  background-color: #e6f7ff;
  color: #1890ff;
}

.female {
  background-color: #fff0f6;
  color: #eb2f96;
}

.sex-text {
  font-size: 15px;
  font-weight: 500;
}

/* 选中状态样式优化 */
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #667eea;
  border-color: #667eea;
}

:deep(.el-radio.is-checked) {
  border-color: #667eea;
  background-color: #f0f7ff;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.15);
}

/* 图标样式 */
:deep(.el-input__prefix) {
  display: flex;
  align-items: center;
  padding-left: 12px;
}

.icon-user, .icon-lock, .icon-shield, .icon-email, .icon-code {
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

.icon-shield {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E");
}

.icon-email {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E");
}

.icon-code {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z'/%3E%3C/svg%3E");
}

/* 表单底部 */
.form-footer {
  text-align: center;
  margin-top: 25px;
  color: #718096;
  font-size: 0.95rem;
}

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.login-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 响应式调整：保证适配性 */
@media (max-width: 992px) {
  .form-container-psd {
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
  
  .input-with-side {
    flex-direction: column;
    gap: 10px;
  }
  
  .send-code-btn {
    width: 100%;
  }
  
  .sex-radio-group {
    flex-direction: column;
    gap: 10px;
  }
}
</style>