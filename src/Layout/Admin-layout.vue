<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, watch } from 'vue'
import { ElButton } from 'element-plus'

const router = useRouter()
const route = useRoute()
import { useAuthStore } from '../store/auth'
const authStore = useAuthStore()

const active = ref(route.name || 'dashboard')
watch(() => route.name, (v) => { active.value = v })

function navigate(key) {
  // key is route name
  router.push({ name: key })
}

function handleLogout() {
  // 清理 store 中的管理员标识
  if (authStore && typeof authStore.setAdmin === 'function') authStore.setAdmin(false)
  router.push('/login')
}
</script>

<template>
  <el-container style="height:100vh;">
    <el-aside width="220px" class="admin-aside">
      <div class="admin-aside__brand">管理员面板</div>
      <el-menu :default-active="active" class="el-menu-vertical-demo admin-menu" @select="navigate">
        <el-menu-item index="dashboard">仪表盘</el-menu-item>
        <el-sub-menu index="users">
          <template #title>用户管理</template>
          <el-menu-item index="users">用户列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="songs">
          <template #title>歌曲管理</template>
          <el-menu-item index="songs">歌曲列表</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="settings">系统设置</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#fff;">
        <div>
          <strong>管理员后台</strong>
        </div>
        <div>
          <el-button type="danger" plain @click="handleLogout">退出管理员</el-button>
        </div>
      </el-header>

      <el-main style="padding:20px;overflow:auto;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-aside {
  background: linear-gradient(180deg, #0b2740 0%, #001529 100%);
  color: #eaf6ff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(2,6,12,0.18);
}
.admin-aside__brand {
  padding: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.03), transparent);
}
.admin-menu {
  border-right: none;
  background: transparent;
  color: #cfe8ff;
  padding-top: 8px;
}
.admin-menu .el-menu-item,
.admin-menu .el-submenu__title {
  color: #d9efff !important;
  height: 48px;
  line-height: 48px;
}

.admin-menu .el-menu-item {
  padding-left: 18px;
  transition: background .18s, color .12s, transform .08s;
}
.admin-menu .el-menu-item:hover,
.admin-menu .el-submenu__title:hover {
  background: rgba(255,255,255,0.03);
  color: #fff !important;
}
.admin-menu .el-menu-item.is-active,
.admin-menu .el-submenu.is-active > .el-submenu__title {
  background: linear-gradient(90deg, rgba(43,140,255,0.08), rgba(43,140,255,0.02));
  color: #2b8cff !important;
  font-weight: 700;
  border-left: 4px solid #2b8cff;
  padding-left: 14px;
}
</style>

