<script setup>
    import { RouterLink } from 'vue-router';
    import { useGlobalStore } from '../store';
    import { useRouter } from 'vue-router';
    const store = useGlobalStore();
    const router = useRouter();
    const updateLogin = () => {
        store.isLogin = true;
        router.push('/home');
    }
</script>

<template>
    <div class="form-container-psd">
        <el-form>
            <el-form-item >
                <el-input placeholder="请输入账号">
                </el-input>
            </el-form-item>
            <el-form-item>
                <el-input type="password" placeholder="请输入密码" show-password>
                </el-input>
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