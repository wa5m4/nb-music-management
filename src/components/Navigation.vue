<script lang="ts" setup>
import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
} from '@element-plus/icons-vue'
import '../assets/icon_store/iconfont.css'
</script>

<template>
    <el-menu default-active="1" class="el-menu-vertical-demo" style="height: 100%;" >
        <RouterLink to="/home">
            <el-menu-item index="1">
              <div class="iconfont icon-tuijian"></div>
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
        <RouterLink to="/discover">
            <el-menu-item index="3">
                <el-icon>
                    <setting />
                </el-icon>
                <template #title>发现</template>
            </el-menu-item>
        </RouterLink>
        <el-sub-menu index="4">
            <template #title>
                <div class="iconfont icon-wode"></div>
                <span>我的</span>
            </template>
            <RouterLink to="/profile">
              <el-menu-item index="4-1">
                <div class="iconfont icon-home-g"></div>
                <template #title>我的主页</template>
              </el-menu-item>
            </RouterLink>
            <RouterLink to="/collect">
              <el-menu-item index="4-2">
                <div class="iconfont icon-gedan"></div>
                <template #title>我的歌单</template>
              </el-menu-item>
            </RouterLink>
            <RouterLink to="/upload">
              <el-menu-item index="4-3">
                <div class="iconfont icon-24px"></div>
                <template #title>我的上传</template>
              </el-menu-item>
            </RouterLink>
        </el-sub-menu>
      <RouterLink to="/pk">
        <el-menu-item index="5">
          <div class="iconfont icon-icon_pk"></div>
          <template #title> 听歌猜曲PK</template>
        </el-menu-item>
      </RouterLink>
        <RouterLink to="/chat">
            <el-menu-item index="6">
              <div class="iconfont icon-aislogo"></div>
                <template #title>AI 对话</template>
            </el-menu-item>
        </RouterLink>
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

.iconfont {
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