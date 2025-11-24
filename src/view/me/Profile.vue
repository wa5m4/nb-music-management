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
            <div class="grid-item" v-for="pl in playlists" :key="pl.id" @click="openPlaylist(pl)" style="cursor:pointer;">
              <el-card class="playlist-card" shadow="hover">
                <div class="playlist-cover">
                  <el-image :src="playlistCover(pl)" fit="cover" class="cover-img"></el-image>
                </div>
                <div class="playlist-body">
                  <div class="title">{{ pl.name || pl.title || '未命名歌单' }}</div>
                  <div class="meta">{{ playlistCount(pl) }} 首</div>
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
import { getUserPlaylists, getPlaylistDetail, getMusicList } from '../../services/api'
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
      // 若后端返回的每个歌单没有 musics 明细，但有 musicCount，则尝试补充首曲封面以作歌单封面
      fillMissingCovers()
        } else {
            ElMessage.error(resp.data?.msg || '获取歌单失败')
        }
    } catch (e) {
        ElMessage.error('获取歌单请求失败')
    }
}

/**
 * 遍历当前 playlists，针对没有封面且存在歌曲数量的歌单，异步拉取歌单详情以尝试获取首首歌曲的封面
 */
async function fillMissingCovers() {
  try {
    for (const pl of playlists.value) {
      try {
        const hasCover = !!(pl.image || pl.cover || pl.coverUrl || pl.imageUrl)
        const count = pl.musicCount ?? pl.trackCount ?? pl.count ?? (Array.isArray(pl.musics) ? pl.musics.length : (Array.isArray(pl.list) ? pl.list.length : (Array.isArray(pl.records) ? pl.records.length : 0)))
        if (!hasCover && count > 0) {
          console.debug('[Profile] 尝试补充封面，playlist id=', pl.id)
          const detailResp = await getPlaylistDetail(pl.id)
          const detail = detailResp?.data?.data ?? detailResp?.data ?? {}
          const mus = detail.musics ?? detail.records ?? detail.list ?? detail.musicIds ?? []
          if (!mus || (Array.isArray(mus) && mus.length === 0)) {
            console.debug('[Profile] 歌单详情未返回 musics/list/records，跳过', pl.id)
            continue
          }

          // 第一项可能是对象或只是 id
          const first = mus[0]
          let img: string | null = null
          if (first && typeof first === 'object') {
            img = first.image || first.cover || null
          } else if (first) {
            // first 是 id，需要再拉取该歌曲详情
            try {
              const songResp = await getMusicList({ pageNum: 1, pageSize: 1, id: first })
              const records = songResp?.data?.data?.records ?? songResp?.data?.data ?? songResp?.data ?? []
              const song = Array.isArray(records) && records.length ? records[0] : null
              img = song?.image || song?.cover || null
            } catch (e) {
              console.warn('[Profile] 获取首曲详情失败', first, e)
            }
          }

          if (img) {
            pl.image = img
            console.debug('[Profile] 补充到歌单封面', pl.id, img)
          } else {
            console.debug('[Profile] 未找到可用封面 for', pl.id)
          }
        }
      } catch (err) {
        // 单个歌单请求失败不影响整体
        console.warn('fillMissingCovers failed for', pl?.id, err)
      }
    }
  } catch (e) {
    console.error('fillMissingCovers error', e)
  }
}

function refresh() {
    fetchPlaylists()
}

function goSettings() {
    router.push('/settings')
}

/** 点击歌单卡片并跳转到歌单详情页 */
function openPlaylist(pl: any) {
  if (!pl || !pl.id) return
  router.push({ name: 'like', params: { id: pl.id } })
}

/**
 * 兼容计算歌单内歌曲数量
 */
function playlistCount(pl: any) {
  if (!pl) return 0
  if (pl.musicCount != null) return pl.musicCount
  if (pl.trackCount != null) return pl.trackCount
  if (pl.count != null) return pl.count
  const mus = pl.musics ?? pl.list ?? pl.records ?? pl.musicIds
  if (Array.isArray(mus)) return mus.length
  return 0
}

/**
 * 计算歌单封面：优先使用歌单自身的 image/cover 字段，
 * 否则尝试使用歌单第一首歌曲的 image 字段作为封面
 */
function playlistCover(pl: any) {
  if (!pl) return '/default-cover.png'
  if (pl.image) return pl.image
  if (pl.cover) return pl.cover
  if (pl.coverUrl) return pl.coverUrl
  if (pl.imageUrl) return pl.imageUrl
  const mus = pl.musics ?? pl.list ?? pl.records
  if (Array.isArray(mus) && mus.length > 0) {
    const first = mus[0]
    if (first && typeof first === 'object') {
      if (first.image) return first.image
      if (first.cover) return first.cover
    }
  }
  return '/default-cover.png'
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