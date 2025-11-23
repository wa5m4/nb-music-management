<template>
  <div class="profile-page">
    <!-- 顶部：头像与用户信息 -->
    <div class="profile-top">
      <div class="profile-top-inner">
        <!-- 设置按钮放到右上角 -->
        <div class="top-actions">
          <el-button type="primary" :icon="Setting" title="设置" @click="goSettings" circle></el-button>
        </div>

        <div class="avatar-display">
          <div class="avatar-frame">
            <el-avatar :src="user?.avatar" :size="140" />
          </div>
        </div>

        <div class="user-info">
          <h2 class="user-name">{{ user?.username || '匿名用户' }}</h2>
          <div class="user-meta">
            <span v-if="user?.email">{{ user.email }}</span>
            <span v-if="user?.sex"> · {{ user.sex }}</span>
            <span v-if="(user as any)?.age"> · {{ (user as any).age }}岁</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 下部：歌单区域（可滚动并占满剩余空间） -->
    <hr class="section-sep" />
    <div class="profile-playlists">
      <div class="playlists-inner">
        <div class="playlists-header">
          <h3>我创建的歌单</h3>
          <el-button type="primary" size="small" @click="refresh">刷新</el-button>
        </div>

        <div class="playlists-grid">
          <div v-if="!playlists.length" class="empty-wrap">
            <el-empty description="暂无歌单" />
          </div>

          <div v-else class="grid-inner">
            <div class="grid-item" v-for="pl in playlists" :key="pl.id">
              <el-card class="playlist-card" shadow="hover">
                <div class="playlist-cover">
                  <el-image :src="pl.cover || '/default-cover.png'" fit="cover" class="cover-img"></el-image>
                </div>
                <div class="playlist-body">
                  <div class="title">{{ pl.name || pl.title || '未命名歌单' }}</div>
                  <div class="meta">{{ pl.trackCount ?? pl.count ?? 0 }} 首</div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../../store/auth'
import { useRouter } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'
import { getUserPlaylists } from '../../services/api'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const router = useRouter()
const user = auth.user
const playlists = ref<any[]>([])

async function fetchPlaylists() {
    if (!user || !(user as any).id) return
    try {
        const resp = await getUserPlaylists((user as any).id)
        if (resp.data?.code === 200) {
            // 兼容多种后端字段结构
            playlists.value = resp.data.data?.records || resp.data.data || []
        } else {
            ElMessage.error(resp.data?.msg || '获取歌单失败')
        }
    } catch (e) {
        ElMessage.error('获取歌单请求失败')
    }
}

function refresh() {
    fetchPlaylists()
}

function goSettings() {
    router.push('/settings')
}

onMounted(() => {
    fetchPlaylists()
})
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  gap: 12px;
  padding: 12px 14px;
  background: transparent;
}

.profile-top {
  flex: 0 0 auto;
}

.profile-playlists {
  flex: 1 1 auto;
  overflow: auto;
}

.profile-card {
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  border: none;
}

.profile-top-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 12px;
  position: relative;
  background: transparent;
  border-radius: 8px;
}

.top-actions {
  position: absolute;
  top: 10px;
  right: 10px;
}

.avatar-display {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.avatar-frame {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.avatar-frame::before {
  content: '';
  position: absolute;
  width: 150%;
  height: 150%;
  background: conic-gradient(transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.user-meta {
  color: #6b7280;
  font-size: 14px;
}

.playlists-card {
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  border: none;
  height: 100%;
}

.playlists-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 6px 12px;
  border-bottom: none;
  background: transparent;
}

.section-sep{
  height:1px;
  background: rgba(15,23,42,0.06);
  margin: 6px 0 8px;
  border-radius:1px;
}

.playlists-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.playlists-grid {
  padding: 8px 6px 16px;
}

.grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.playlist-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: none;
}

.playlist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.playlist-cover .cover-img {
  width: 100%;
  height: 160px;
  border-radius: 8px 8px 0 0;
}

.playlist-body {
  padding: 16px;
}

.playlist-body .title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-body .meta {
  color: #6b7280;
  font-size: 14px;
}

.empty-wrap {
  padding: 60px 0;
  text-align: center;
}

.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
}

.el-button--primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

@media (max-width: 768px) {
  .profile-page {
    padding: 12px;
    gap: 16px;
  }
  
  .profile-top-inner {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 20px;
  }
  
  .avatar-display {
    width: 120px;
    height: 120px;
  }
  
  .grid-inner {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
  
  .playlist-cover .cover-img {
    height: 120px;
  }
}
</style>