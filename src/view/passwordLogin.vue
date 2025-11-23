<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGlobalStore } from '../store';
import { useAuthStore } from '../store/auth';
import { ElMessage } from 'element-plus';

const store = useGlobalStore();
const router = useRouter();

const username = ref('');
const password = ref('');

const updateLogin = () => {
    if (!username.value.trim()) {
        ElMessage.error('请输入账号');
        return;
    }
    if (!password.value.trim()) {
        ElMessage.error('请输入密码');
        return;
    }

    // 管理员快捷登录（使用 auth store）
    if (username.value.trim() === 'admin' && password.value.trim() === '123456') {
        // 使用 auth store 记录管理员身份
        const auth = useAuthStore()
        auth.setAdmin(true)
        ElMessage.success('管理员登录成功')
        router.push('/admin')
        return
    }

    // 直接更新登录状态（与之前逻辑一致）
    store.isLogin = true;
    router.push('/home');
}
</script>

<template>
    <div class="form-container-psd">
        <el-form>
            <el-form-item>
                <el-input v-model="username" placeholder="请输入账号" />
            </el-form-item>
            <el-form-item>
                <el-input v-model="password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
            <el-form-item>
                <el-button @click="updateLogin">注册</el-button>
                <el-button @click="updateLogin">登录</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<style scoped>
</style>