<script setup>
    import { RouterLink } from 'vue-router';
    const changeLoginStatus = ()=>{

    }
</script>

<template>
    <div class="form-container-msg">
        <el-form>
            <el-form-item >
                <el-input placeholder="请输入手机号">
                </el-input>
            </el-form-item>
            <el-form-item>
                <el-input placeholder="请输入验证码">
                </el-input>
            </el-form-item>
            <el-form-item>
                <el-button @click="changeLoginStatus">注册</el-button>
                <el-button @click="changeLoginStatus">登录</el-button>
            </el-form-item>
    </el-form>
    </div>
    
</template>

<style scoped>
</style>