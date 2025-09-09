<script lang="ts" setup>
import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
} from '@element-plus/icons-vue'

</script>

<template>
    <el-menu default-active="1" class="el-menu-vertical-demo" style="height: 100%;" >
        <RouterLink to="/home">
            <el-menu-item index="1">
                <el-icon>
                    <icon-menu />
                </el-icon>
                <template #title>
                    推荐
                </template>
            </el-menu-item>
        </RouterLink>
        <RouterLink to="/subscribe">
            <el-menu-item index="2">
                <el-icon>
                    <document />
                </el-icon>
                <template #title>关注</template>
            </el-menu-item>
        </RouterLink>
        <RouterLink to="/download">
            <el-menu-item index="3">
                <el-icon>
                    <setting />
                </el-icon>
                <template #title>下载</template>
            </el-menu-item>
        </RouterLink>
        <el-sub-menu index="4">
            <template #title>
                <el-icon>
                    <location />
                </el-icon>
                <span>我</span>
            </template>
            <RouterLink to="/profile">
                <el-menu-item index="4-1">我的主页</el-menu-item>
            </RouterLink>
            <RouterLink to="/like">
                <el-menu-item index="1-1">我的喜欢</el-menu-item>
            </RouterLink>
            <RouterLink to="/upload">
                <el-menu-item index="1-2">我的上传</el-menu-item>
            </RouterLink>
        </el-sub-menu>

    </el-menu>
</template>

<style scoped>
:host, .el-menu-vertical-demo {
    height: 100%;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 0;
    height: 100%;
}

.nav-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 14px 30px;
    cursor: pointer;
    transition: 0.2s;
}

.nav-item:hover {
    background: #282c34;
}

.icon {
    margin-right: 12px;
    font-size: 1.4em;
}

.text {
    white-space: nowrap;
}

.el-menu-vertical-demo a {
    text-decoration: none;
}

el-menu-item a {
    text-decoration: none;
}
</style>