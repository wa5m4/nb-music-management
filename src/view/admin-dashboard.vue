<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 菜单控制
const currentMenu = ref('dashboard')

// mock 数据 - 用户
const users = ref([
  { id: 1, username: 'alice', email: 'alice@example.com', role: 'user' },
  { id: 2, username: 'bob', email: 'bob@example.com', role: 'user' },
  { id: 3, username: 'admin', email: 'admin@example.com', role: 'admin' }
])

// mock 数据 - 歌曲
const songs = ref([
  { id: 1, title: 'Song A', artist: 'Artist 1' },
  { id: 2, title: 'Song B', artist: 'Artist 2' }
])

// 用户管理弹窗状态
const userDialogVisible = ref(false)
const editingUser = ref(null)
const userForm = reactive({ id: null, username: '', email: '', role: 'user' })

function openAddUser() {
  editingUser.value = null
  userForm.id = null
  userForm.username = ''
  userForm.email = ''
  userForm.role = 'user'
  userDialogVisible.value = true
}

function openEditUser(row) {
  editingUser.value = row.id
  userForm.id = row.id
  userForm.username = row.username
  userForm.email = row.email
  userForm.role = row.role
  userDialogVisible.value = true
}

function saveUser() {
  if (!userForm.username || !userForm.email) {
    ElMessage.warning('请填写用户名和邮箱')
    return
  }
  if (editingUser.value) {
    const idx = users.value.findIndex(u => u.id === editingUser.value)
    if (idx !== -1) {
      users.value[idx] = { id: userForm.id, username: userForm.username, email: userForm.email, role: userForm.role }
      ElMessage.success('用户已更新')
    }
  } else {
    const newId = Math.max(0, ...users.value.map(u => u.id)) + 1
    users.value.push({ id: newId, username: userForm.username, email: userForm.email, role: userForm.role })
    ElMessage.success('用户已添加')
  }
  userDialogVisible.value = false
}

function removeUser(row) {
  ElMessageBox.confirm(`确认删除用户 ${row.username} 吗？`, '删除确认', { type: 'warning' })
    .then(() => {
      users.value = users.value.filter(u => u.id !== row.id)
      ElMessage.success('用户已删除')
    })
    .catch(() => {})
}

// 歌曲管理（简单示例）
const songDialogVisible = ref(false)
const editingSong = ref(null)
const songForm = reactive({ id: null, title: '', artist: '' })

function openAddSong() {
  editingSong.value = null
  songForm.id = null
  songForm.title = ''
  songForm.artist = ''
  songDialogVisible.value = true
}

function openEditSong(row) {
  editingSong.value = row.id
  songForm.id = row.id
  songForm.title = row.title
  songForm.artist = row.artist
  songDialogVisible.value = true
}

function saveSong() {
  if (!songForm.title) {
    ElMessage.warning('请填写歌曲名称')
    return
  }
  if (editingSong.value) {
    const idx = songs.value.findIndex(s => s.id === editingSong.value)
    if (idx !== -1) {
      songs.value[idx] = { id: songForm.id, title: songForm.title, artist: songForm.artist }
      ElMessage.success('歌曲已更新')
    }
  } else {
    const newId = Math.max(0, ...songs.value.map(s => s.id)) + 1
    songs.value.push({ id: newId, title: songForm.title, artist: songForm.artist })
    ElMessage.success('歌曲已添加')
  }
  songDialogVisible.value = false
}

function removeSong(row) {
  ElMessageBox.confirm(`确认删除歌曲 ${row.title} 吗？`, '删除确认', { type: 'warning' })
    .then(() => {
      songs.value = songs.value.filter(s => s.id !== row.id)
      ElMessage.success('歌曲已删除')
    })
    .catch(() => {})
}

const stats = computed(() => ({
  userCount: users.value.length,
  songCount: songs.value.length
}))

function handleLogout() {
  localStorage.removeItem('isAdmin')
  ElMessage.success('已退出管理员模式')
  router.push('/login')
}
</script>

<template>
  <el-container style="height:100vh;">
    <el-aside width="240px" class="admin-aside">
      <div class="brand">
        <div class="brand-icon">
          <span class="icon-placeholder" aria-hidden="true"></span>
        </div>
        <span>管理员面板</span>
      </div>
      <el-menu default-active="dashboard" class="el-menu-vertical-demo" @select="key => currentMenu = key" :default-active="currentMenu">
        <el-menu-item index="dashboard" class="aside-item">
          <div class="menu-item-content">
            <div class="menu-icon">
              <span class="icon-placeholder" aria-hidden="true"></span>
            </div>
            <span>仪表盘</span>
          </div>
        </el-menu-item>
        <el-sub-menu index="users">
          <template #title>
            <div class="menu-item-content">
              <div class="menu-icon">
                <span class="icon-placeholder" aria-hidden="true"></span>
              </div>
              <span class="submenu-title">用户管理</span>
            </div>
          </template>
          <el-menu-item index="users_list" class="aside-item submenu-item">
            <div class="menu-item-content">
              <div class="submenu-dot"></div>
              <span>用户列表</span>
            </div>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="songs">
          <template #title>
            <div class="menu-item-content">
              <div class="menu-icon">
                <span class="icon-placeholder" aria-hidden="true"></span>
              </div>
              <span class="submenu-title">歌曲管理</span>
            </div>
          </template>
          <el-menu-item index="songs_list" class="aside-item submenu-item">
            <div class="menu-item-content">
              <div class="submenu-dot"></div>
              <span>歌曲列表</span>
            </div>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="settings" class="aside-item">
          <div class="menu-item-content">
              <div class="menu-icon">
                <span class="icon-placeholder" aria-hidden="true"></span>
              </div>
            <span>系统设置</span>
          </div>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <div>
          <strong style="font-size:18px;color:#2c3e50;">管理员后台</strong>
        </div>
        <div>
          <el-button type="danger" plain @click="handleLogout" style="border-radius:6px;font-weight:600;">退出管理员</el-button>
        </div>
      </el-header>

      <el-main style="padding:20px;overflow:auto;background:#f5f7fa;">
        <div v-if="currentMenu === 'dashboard'">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card :class="['dashboard-card', { active: currentMenu === 'users' || currentMenu === 'users_list' }]" shadow="hover">
                <div style="display:flex;align-items:center;">
                  <div class="stat-icon user-icon">
                    <span class="icon-placeholder" aria-hidden="true"></span>
                  </div>
                  <div>
                    <div style="font-size:14px;color:#909399;">用户总数</div>
                    <div style="font-size:28px;margin-top:4px;font-weight:700;color:#2c3e50;">{{ stats.userCount }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card :class="['dashboard-card', { active: currentMenu === 'songs' || currentMenu === 'songs_list' }]" shadow="hover">
                <div style="display:flex;align-items:center;">
                  <div class="stat-icon song-icon">
                    <span class="icon-placeholder" aria-hidden="true"></span>
                  </div>
                  <div>
                    <div style="font-size:14px;color:#909399;">歌曲总数</div>
                    <div style="font-size:28px;margin-top:4px;font-weight:700;color:#2c3e50;">{{ stats.songCount }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-if="currentMenu === 'users' || currentMenu === 'users_list'">
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
            <h3 class="h-title">用户管理</h3>
            <div>
              <el-button type="primary" @click="openAddUser" style="border-radius:6px;font-weight:600;">添加用户</el-button>
            </div>
          </div>
          <el-card shadow="never" style="border-radius:8px;">
            <el-table :data="users" stripe style="width:100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="role" label="角色" width="120" />
              <el-table-column label="操作" width="220">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="() => openEditUser(row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="() => removeUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <div v-if="currentMenu === 'songs' || currentMenu === 'songs_list'">
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
            <h3 class="h-title">歌曲管理</h3>
            <div>
              <el-button type="primary" @click="openAddSong" style="border-radius:6px;font-weight:600;">添加歌曲</el-button>
            </div>
          </div>
          <el-card shadow="never" style="border-radius:8px;">
            <el-table :data="songs" stripe style="width:100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="title" label="歌曲名" />
              <el-table-column prop="artist" label="歌手" />
              <el-table-column label="操作" width="220">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="() => openEditSong(row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="() => removeSong(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <div v-if="currentMenu === 'settings'">
          <h3 class="h-title">系统设置</h3>
          <el-card shadow="never" style="border-radius:8px;">
            <p>这里放一些管理员级别的配置（占位）</p>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </el-container>

  <!-- 用户弹窗 -->
  <el-dialog v-model="userDialogVisible" :title="editingUser ? '编辑用户' : '添加用户'" width="500px">
    <el-form label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="userForm.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="userForm.email" placeholder="请输入邮箱地址" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="userForm.role" placeholder="请选择角色">
          <el-option label="用户" value="user" />
          <el-option label="管理员" value="admin" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="userDialogVisible = false" style="border-radius:6px;">取消</el-button>
      <el-button type="primary" @click="saveUser" style="border-radius:6px;">保存</el-button>
    </template>
  </el-dialog>

  <!-- 歌曲弹窗 -->
  <el-dialog v-model="songDialogVisible" :title="editingSong ? '编辑歌曲' : '添加歌曲'" width="500px">
    <el-form label-width="80px">
      <el-form-item label="歌曲名">
        <el-input v-model="songForm.title" placeholder="请输入歌曲名称" />
      </el-form-item>
      <el-form-item label="歌手">
        <el-input v-model="songForm.artist" placeholder="请输入歌手名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="songDialogVisible = false" style="border-radius:6px;">取消</el-button>
      <el-button type="primary" @click="saveSong" style="border-radius:6px;">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 侧边栏容器，使用渐变和轻微阴影以提升层次感 */
.admin-aside {
  background: linear-gradient(180deg, #0b2740 0%, #001529 100%);
  color: #eaf6ff;
  box-shadow: 2px 0 10px rgba(0,0,0,0.12);
  position: relative;
  z-index: 10;
}
.admin-aside .brand {
  padding: 20px;
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 10px;
}
.brand-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 占位图标（原来使用内联 SVG 的位置） */
.icon-placeholder { display: block; width: 20px; height: 20px; }

/* menu-icon 默认颜色与激活态颜色 */
.menu-icon { color: #cfe8ff; display:flex; align-items:center; justify-content:center; }
.el-menu-vertical-demo .el-menu-item.is-active .menu-icon,
.el-menu-vertical-demo .el-submenu.is-active .menu-icon {
  color: #2b8cff;
}

/* 占位图标可继承容器颜色 */
.menu-icon .icon-placeholder { width: 20px; height: 20px; display:flex; align-items:center; justify-content:center; }
.brand-icon .icon-placeholder { width: 24px; height: 24px; display:flex; align-items:center; justify-content:center; }

/* 菜单基础样式：去掉右侧边框，使用浅蓝色字体 */
.el-menu-vertical-demo {
  border-right: none;
  background: transparent;
  color: #cfe8ff;
}
.el-menu-vertical-demo .el-menu-item,
.el-menu-vertical-demo .el-submenu__title {
  color: #d9efff;
  height: 48px;
  line-height: 48px;
}

/* 菜单项内容布局 */
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.submenu-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
}

/* 悬停与激活样式，提升可点击反馈 */
.el-menu-vertical-demo .el-menu-item:hover,
.el-menu-vertical-demo .el-submenu__title:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
}
.el-menu-vertical-demo .el-menu-item.is-active,
.el-menu-vertical-demo .el-submenu.is-active > .el-submenu__title {
  background: linear-gradient(90deg, rgba(43,140,255,0.15), rgba(43,140,255,0.05));
  color: #2b8cff;
  font-weight: 700;
  border-left: 4px solid #2b8cff;
  padding-left: 16px;
}

/* 子菜单标题稍微加粗以增强分组感 */
.el-menu-vertical-demo .el-submenu__title {
  font-weight: 700;
}

/* 子项保持相对浅色，以便与主分组标题区分 */
.el-menu-vertical-demo .el-menu-item.submenu-item {
  font-weight: 500;
  color: #bcdcff;
  padding-left: 52px !important;
}
.el-menu-vertical-demo .el-menu-item.submenu-item.is-active {
  background: rgba(43,140,255,0.08);
  color: #2b8cff;
  border-left: 4px solid #2b8cff;
}

/* 统一子菜单标题样式 */
.submenu-title {
  color: #eaf6ff;
  font-weight: 700;
  display: inline-block;
}

.el-menu-vertical-demo .el-submenu__title .submenu-title {
  color: inherit;
}

/* 侧边菜单项统一样式：与仪表盘卡片对齐 */
.aside-item {
  padding-left: 20px;
  transition: background .2s, color .15s, transform .08s;
  border-radius: 0;
}
.aside-item:hover { transform: translateX(2px); }
.el-menu-vertical-demo .el-menu-item.is-active.aside-item {
  background: rgba(43,140,255,0.06);
  color: #2b8cff !important;
  font-weight: 700;
  border-left: 4px solid #2b8cff;
  padding-left: 16px;
}

/* 仪表盘卡片，与侧边栏激活态视觉统一 */
.dashboard-card {
  border-radius: 10px;
  transition: box-shadow .18s, transform .12s;
  border: none;
  padding: 20px;
  cursor: pointer;
}
.dashboard-card:hover {
  box-shadow: 0 6px 18px rgba(11,39,64,0.12);
  transform: translateY(-4px);
}
.dashboard-card.active {
  border-left-color: #2b8cff;
  box-shadow: 0 10px 26px rgba(43,140,255,0.06);
}

/* 统计图标样式 */
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}
.user-icon {
  background: rgba(64,158,255,0.1);
  color: #409eff;
}
.song-icon {
  background: rgba(103,194,58,0.1);
  color: #67c23a;
}

/* 简单帮助类：让卡片与菜单标题在颜色和权重上统一 */
.dashboard-card .h-card-title { color: #2b8cff; font-weight: 700; }

/* 标题与表格统一视觉 */
.h-title {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.el-table th {
  color: #2f3640;
  font-weight: 600;
}
.el-button {
  font-weight: 600;
}

/* 响应式：小屏时收起侧边栏（视觉对齐） */
@media (max-width: 900px) {
  .admin-aside { width: 56px !important; }
  .el-menu-vertical-demo .el-menu-item,
  .el-menu-vertical-demo .el-submenu__title { text-align: center; }
  .admin-aside .brand { display: none; }
  .menu-item-content span { display: none; }
  .menu-icon { margin: 0 auto; }
}
</style>