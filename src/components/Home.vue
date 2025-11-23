<template>
  <div class="recommend-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>正在加载推荐音乐...</span>
    </div>

    <!-- 推荐内容 -->
    <div v-else class="recommend-content">
      <!-- 第一部分：轮播图 -->
      <div class="carousel-section">
        <h2 class="section-title">热门推荐</h2>
            <div class="carousel">
              <div 
                class="carousel-item" 
                v-for="(song, index) in featured.slice(0, 3)" 
                :key="song.id"
                :class="{ active: carouselIndex === index }"
                @click="handlePlaySong(song, featured)"
              >
                <img :src="song.image" :alt="song.name" class="carousel-image">
                <div class="carousel-info">
                  <h3 class="song-title">{{ song.name }}</h3>
                  <p class="song-artist">{{ song.author }}</p>
                </div>
              </div>
            </div>
        <div class="carousel-indicators">
          <span 
            v-for="(_, index) in 3" 
            :key="index"
            :class="{ active: carouselIndex === index }"
            @click="carouselIndex = index"
          ></span>
        </div>
      </div>

      <!-- 第二部分：横向色块 -->
      <div class="horizontal-grid-section">
        <h2 class="section-title">精选推荐</h2>
        <div class="horizontal-grid">
          <div 
            class="horizontal-grid-item" 
            v-for="(song, index) in featured.slice(0, 4)" 
            :key="song.id"
            :style="{ backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][index] }"
          >
            <div class="horizontal-grid-content" @click="handlePlaySong(song, featured)">
              <img :src="song.image" :alt="song.name" class="horizontal-grid-image">
              <div class="horizontal-grid-overlay">
                <h4>{{ song.name }}</h4>
                <p>{{ song.author }}</p>
                <div class="play-icon">▶</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三部分：可刷新区域 -->
      <div class="refresh-section">
        <div class="refresh-header">
          <h2 class="section-title">每日推荐</h2>
          <button class="refresh-btn" @click="refreshDailyRecommend" :disabled="refreshing">
            {{ refreshing ? '刷新中...' : '换一批' }}
          </button>
        </div>
        <div class="daily-recommend">
          <div class="recommend-column">
            <div 
              class="recommend-item" 
              v-for="song in dailyRecommend.slice(0, 3)" 
              :key="song.id"
            >
              <div class="item-content" @click="handlePlaySong(song, dailyRecommend)">
                <div class="image-container">
                    <img :src="song.image" :alt="song.name" class="item-image">
                    <div class="play-overlay">
                <div class="play-icon">▶</div>
              </div>
            </div>
            <div class="item-info">
              <h3 class="item-title">{{ song.name }}</h3>
              <p class="item-artist">{{ song.author }}</p>
            </div>
                <button class="favorite-btn" @click.stop="handleAddToFavorite(song)" title="收藏">
                  ♡
                </button>
              </div>
            </div>
          </div>
          <div class="recommend-column">
            <div 
              class="recommend-item" 
              v-for="song in dailyRecommend.slice(3, 6)" 
              :key="song.id"
            >
              <div class="item-content" @click="handlePlaySong(song, dailyRecommend)">
                <div class="image-container">
                  <img :src="song.image" :alt="song.name" class="item-image">
                  <div class="play-overlay">
                    <div class="play-icon">▶</div>
                  </div>
              </div>
              <div class="item-info">
                <h3 class="item-title">{{ song.name }}</h3>
                <p class="item-artist">{{ song.author }}</p>
              </div>
            <button class="favorite-btn" @click.stop="handleAddToFavorite(song)" title="收藏">
              ♡
            </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第四部分：音乐列表 -->
      <div class="list-section">
        <h2 class="section-title">推荐歌单</h2>
          <div class="music-list">
          <div class="list-header">
            <span class="index-col">#</span>
            <span class="title-col">标题</span>
            <span class="artist-col">歌手</span>
            <span class="type-col">类型</span>
            <span class="duration-col">时长</span>
            <span class="action-col">操作</span>
          </div>
          <div 
            class="list-item" 
            v-for="(song, index) in playlistRecommend" 
            :key="song.id"
          >
            <span class="index-col">{{ index + 1 }}</span>
            <div class="title-col song-info">
              <img :src="song.image" :alt="song.name" class="song-cover">
              <div class="text">
                <h3>{{ song.name }}</h3>
              </div>
            </div>
            <span class="artist-col">{{ song.author }}</span>
            <span class="type-col">{{ song.type }}</span>
            <span class="duration-col">{{ formatDuration(song.duration) }}</span>
            <div class="action-col">
              <button class="play-btn" @click="handlePlaySong(song, playlistRecommend)" title="播放">
                ▶
              </button>
              <button class="favorite-btn" @click="handleAddToFavorite(song)" title="收藏">
                ♡
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- 新增部分：我创建的歌单（用户） -->
      <div class="list-section" v-if="myPlaylists && myPlaylists.length">
        <h2 class="section-title">我创建的歌单</h2>
        <div class="playlists-grid" style="margin-top:12px;">
          <div class="grid-inner" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px;">
            <div v-for="pl in myPlaylists" :key="pl.id">
              <el-card class="playlist-card" shadow="hover">
                <div style="height:140px; overflow:hidden; border-radius:8px;">
                  <img :src="pl.image || pl.cover || '/default-cover.png'" style="width:100%; height:100%; object-fit:cover;" />
                </div>
                <div style="padding:12px;">
                  <div style="font-weight:600;">{{ pl.name || pl.title }}</div>
                  <div style="color:#888; font-size:12px; margin-top:6px;">{{ pl.musicCount ?? pl.trackCount ?? 0 }} 首</div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 音频播放器组件 -->
    <AudioPlayer ref="audioPlayerRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getMusicList, getUserPlaylists } from '../services/api'
import { useAuthStore } from '../store/auth'
import type { MusicDetail } from '../types/api'
import { ElMessage } from 'element-plus'

// 工具函数
const shuffle = <T,>(arr: T[]) => {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

function splitIntoGroups<T>(records: T[], sizes: number[]) {
  const total = sizes.reduce((s, v) => s + v, 0)
  if (!records || records.length === 0) return sizes.map(() => [])
  if (records.length >= total) {
    const s = shuffle(records)
    let offset = 0
    return sizes.map(sz => {
      const group = s.slice(offset, offset + sz)
      offset += sz
      return group
    })
  }
  const pool: T[] = []
  while (pool.length < total) pool.push(...records)
  const uniqPool = shuffle(pool)
  const out: T[][] = []
  let baseOffset = 0
  for (const sz of sizes) {
    const start = baseOffset % uniqPool.length
    const group: T[] = []
    for (let i = 0; i < sz; i++) {
      group.push(uniqPool[(start + i) % uniqPool.length])
    }
    out.push(group)
    baseOffset += Math.max(1, Math.floor((records.length || 1) / Math.max(1, sz)))
  }
  return out
}

// 音乐数据
const musicList = ref<MusicDetail[]>([])
const featured = ref<MusicDetail[]>([]) // 精选推荐（4条）
const dailyRecommend = ref<MusicDetail[]>([]) // 每日推荐（6条）
const playlistRecommend = ref<MusicDetail[]>([]) // 推荐歌单（6条）
const loading = ref(false)
const refreshing = ref(false)
// 用户创建的歌单
const myPlaylists = ref<any[]>([])

// 轮播图当前索引
const carouselIndex = ref(0)

// 音频播放器引用
const audioPlayerRef = ref()

// 已移除 fetchRandomRecords：使用 fetchEnoughRecords 保证数量与去重逻辑

/**
 * 确保获取到至少 `count` 条后端返回的记录。
 * 会按页抓取并去重累积，最多尝试 `maxPages` 次请求；若仍不足，使用已有记录重复填充（仍来自后端）。
 */
async function fetchEnoughRecords(count = 6, maxPages = 8) {
  try {
    if (count <= 0) return []
    const seen = new Map()
    const addRecords = (arr: any[]) => {
      for (const r of arr || []) {
        if (!r) continue
        const id = r.id ?? r._id ?? JSON.stringify(r)
        if (!seen.has(id)) seen.set(id, r)
      }
    }

    // 首次请求获取总数与第一页数据
    const firstResp = await getMusicList({ pageNum: 1, pageSize: count })
    const normFirst = (resp: any) => {
      const top = resp?.data ?? {}
      const inner = top.data ?? top
      const records = Array.isArray(inner.records) ? inner.records : (Array.isArray(inner.list) ? inner.list : (Array.isArray(inner) ? inner : []))
      const total = Number(inner.total) || records.length || 0
      return { total, records }
    }
    const first = normFirst(firstResp)
    addRecords(first.records)

    const total = Math.max(0, Number(first.total || 0))
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, count)))

    // 如果已经足够，直接返回
    if (seen.size >= count) {
      return Array.from(seen.values()).slice(0, count)
    }

    // 按随机页或顺序页继续拉取，直到达到需求或用尽最大尝试次数
    const attempts = Math.min(maxPages, totalPages)
    const tried = new Set()
    tried.add(1)
    for (let i = 0; i < attempts && seen.size < count; i++) {
      // 随机选择页码，避免始终命中同一页
      let page = Math.floor(Math.random() * totalPages) + 1
      // 保证不重复尝试同一页
      let tries = 0
      while (tried.has(page) && tries < 5) {
        page = Math.floor(Math.random() * totalPages) + 1
        tries++
      }
      tried.add(page)
      const resp = await getMusicList({ pageNum: page, pageSize: count })
      const n = normFirst(resp)
      addRecords(n.records)
    }

    // 如果仍然不足，用已有记录重复填充
    const collected: any[] = Array.from(seen.values())
    if (collected.length >= count) return collected.slice(0, count)
    const out: any[] = []
    if (collected.length === 0) return []
    while (out.length < count) {
      const remaining: number = count - out.length
      out.push(...collected.slice(0, Math.min(collected.length, remaining)))
    }
    return out
  } catch (e) {
    console.error('fetchEnoughRecords error', e)
    return []
  }
}

/**
 * 获取推荐（首页初始化）
 * 保证精选4条、每日6条、推荐歌单6条，且三组之间尽量不重叠
 */
const fetchRandomMusic = async () => {
  loading.value = true
  try {
    const sizes = [4, 6, 6]
    const totalNeeded = sizes.reduce((s, v) => s + v, 0)
    // 尝试获取更大的池以提高非重复性
    const records = await fetchEnoughRecords(Math.max(12, totalNeeded), 10)
    if (Array.isArray(records) && records.length) {
      const groups = splitIntoGroups(records, sizes)
      featured.value = groups[0] || []
      dailyRecommend.value = groups[1] || []
      playlistRecommend.value = groups[2] || []
      musicList.value = (groups[0] || []).concat(groups[1] || []).slice(0, 10)
      console.log('✅ 获取推荐音乐成功，精选:', featured.value.length, '每日:', dailyRecommend.value.length, '歌单:', playlistRecommend.value.length)
    } else {
      featured.value = []
      dailyRecommend.value = []
      playlistRecommend.value = []
      musicList.value = []
      ElMessage.warning('暂无推荐音乐')
    }
  } catch (error) {
    console.error('❌ 获取推荐音乐失败:', error)
    ElMessage.error('获取推荐音乐失败')
    featured.value = []
    dailyRecommend.value = []
    playlistRecommend.value = []
    musicList.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 刷新每日推荐（从后端拉取6条）
 */
const refreshDailyRecommend = async () => {
  refreshing.value = true
  try {
    // 获取更大的候选池，优先选出与当前不重复的 6 条
    const pool = await fetchEnoughRecords(20, 10)
    console.debug('[Home] refresh pool size:', Array.isArray(pool) ? pool.length : 0)
    if (!Array.isArray(pool) || pool.length === 0) {
      ElMessage.warning('刷新失败：未能从后端获取到候选')
      return
    }
    const currentIds = new Set(dailyRecommend.value.map(d => d.id))
    const candidates = shuffle(pool).filter((r: any) => !currentIds.has(r.id))
    const newList: any[] = []
    if (candidates.length >= 6) {
      newList.push(...candidates.slice(0, 6))
    } else {
      newList.push(...candidates)
      const filler = shuffle(pool)
      for (let i = 0; i < filler.length && newList.length < 6; i++) {
        const item = filler[i]
        if (!newList.find(n => n.id === item.id)) newList.push(item)
      }
      while (newList.length < 6 && pool.length > 0) {
        newList.push(pool[newList.length % pool.length])
      }
    }
    dailyRecommend.value = newList.slice(0, 6)
    ElMessage.success('推荐已更新')
    console.log('✅ 刷新每日推荐成功，条数：', dailyRecommend.value.length, '候选池:', pool.length)
  } catch (error) {
    console.error('❌ 刷新每日推荐失败:', error)
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 已移除本地模拟数据，推荐来源统一由后端提供

/**
 * 播放单首歌曲
 */
const handlePlaySong = (song: MusicDetail, list?: MusicDetail[]) => {
  const playList = Array.isArray(list) && list.length ? list : musicList.value
  const idx = (playList && playList.findIndex) ? playList.findIndex(s => s.id === song.id) : 0
  if (audioPlayerRef.value) {
    audioPlayerRef.value.playSong(song, playList, idx >= 0 ? idx : 0)
    ElMessage.success(`开始播放: ${song.name} - ${song.author}`)
  } else {
    ElMessage.warning('播放器未初始化')
  }
}

/**
 * 添加到收藏
 */
const handleAddToFavorite = (song: MusicDetail) => {
  ElMessage.success(`已添加到收藏: ${song.name}`)
  // 这里可以调用收藏API
  console.log('添加到收藏:', song)
}

/**
 * 轮播图自动播放
 */
const startCarousel = () => {
  setInterval(() => {
    carouselIndex.value = (carouselIndex.value + 1) % 3
  }, 4000)
}

/**
 * 格式化时长
 */
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  fetchRandomMusic()
  startCarousel()
  fetchMyPlaylists()
})

/** 获取当前用户创建的歌单并显示在首页 */
async function fetchMyPlaylists() {
  try {
    const auth = useAuthStore()
    let userId: any = null
    if (auth && auth.user && (auth.user as any).id) {
      userId = (auth.user as any).id
    } else {
      // 优先检查 localStorage 中常见 key
      const raw = localStorage.getItem('user') || localStorage.getItem('userInfo')
      if (raw) {
        try { userId = JSON.parse(raw)?.id } catch {}
      }
    }
    // 若没有，再尝试从 token 解码
    if (!userId) {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const parts = token.split('.')
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
            userId = payload?.id ?? payload?.userId ?? payload?.sub ?? payload?.uid ?? null
          }
        } catch (e) {
          console.warn('decode token failed', e)
        }
      }
    }
    if (!userId) return
    // 调试：打印候选 id 源
    console.log('[debug] Home fetch candidate ids -> auth.user.id=', auth?.user?.id, 'localStorage user id=', JSON.parse(localStorage.getItem('user') || localStorage.getItem('userInfo') || 'null')?.id)
    const resp = await getUserPlaylists(userId)
    if (resp?.data && (resp.data.code === 200 || resp.data.code === 0)) {
      const list = resp.data.data?.records || resp.data.data || []
      myPlaylists.value = Array.isArray(list) ? list : []
    }
  } catch (e) {
    console.error('fetchMyPlaylists failed', e)
  }
}
</script>

<style scoped>
.recommend-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #18b3de;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
  border-left: 4px solid #18b3de;
  padding-left: 12px;
}

/* 轮播图样式 */
.carousel-section {
  margin-bottom: 40px;
}

.carousel {
  position: relative;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.carousel-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease;
  cursor: pointer;
}

.carousel-item.active {
  opacity: 1;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.song-title {
  font-size: 24px;
  margin: 0 0 8px 0;
  opacity: 0.9;
}

.song-artist {
  font-size: 16px;
  margin: 0;
  opacity: 0.8;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  margin-top: 15px;
  gap: 8px;
}

.carousel-indicators span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ccc;
  cursor: pointer;
  transition: background-color 0.3s;
}

.carousel-indicators span.active {
  background-color: #18b3de;
}

/* 横向色块样式 */
.horizontal-grid-section {
  margin-bottom: 40px;
}

.horizontal-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  height: 200px;
}

.horizontal-grid-item {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.horizontal-grid-item:hover {
  transform: translateY(-4px);
}

.horizontal-grid-content {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.horizontal-grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.horizontal-grid-item:hover .horizontal-grid-image {
  filter: blur(4px);
}

.horizontal-grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  text-align: center;
  padding: 20px;
}

.horizontal-grid-item:hover .horizontal-grid-overlay {
  opacity: 1;
}

.horizontal-grid-overlay h4 {
  font-size: 16px;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.horizontal-grid-overlay p {
  font-size: 12px;
  margin: 0 0 15px 0;
  opacity: 0.9;
}

.play-icon {
  font-size: 20px;
  background: rgba(255, 255, 255, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.horizontal-grid-overlay:hover .play-icon {
  background: rgba(255, 255, 255, 0.3);
}

/* 可刷新区域样式 */
.refresh-section {
  margin-bottom: 40px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.refresh-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  background: #18b3de;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #0f8ab1;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.daily-recommend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.recommend-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.recommend-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  transition: background-color 0.3s;
}

.recommend-item:hover {
  background: #e9ecef;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
}

.image-container {
  position: relative;
  width: 60px;
  height: 60px;
}

.item-image {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-icon {
  color: white;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recommend-item:hover .item-image {
  filter: blur(2px);
}

.recommend-item:hover .play-overlay {
  opacity: 1;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
}

.item-artist {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.favorite-btn {
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #495057;
}

.favorite-btn:hover {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}
/* 音乐列表样式 */
.list-section {
  margin-bottom: 40px;
}

.music-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 50px 2fr 1fr 1fr 80px 100px;
  gap: 15px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.list-item {
  display: grid;
  grid-template-columns: 50px 2fr 1fr 1fr 80px 100px;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s;
  align-items: center;
}

.list-item:hover {
  background-color: #f8f9fa;
}

.list-item:last-child {
  border-bottom: none;
}

.index-col {
  text-align: center;
  color: #6c757d;
  font-weight: 500;
}

.title-col {
  display: flex;
  align-items: center;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.text h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #212529;
}

.artist-col, .type-col, .duration-col {
  color: #6c757d;
  font-size: 14px;
}

.action-col {
  display: flex;
  gap: 8px;
}

.play-btn, .favorite-btn {
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #495057;
}

.play-btn:hover {
  background: #18b3de;
  color: white;
  border-color: #18b3de;
}

.favorite-btn:hover {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recommend-container {
    padding: 10px;
  }
  
  .horizontal-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 150px);
    height: auto;
  }
  
  .daily-recommend {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .list-header, .list-item {
    grid-template-columns: 30px 1fr 80px;
    gap: 10px;
  }
  
  .type-col, .duration-col {
    display: none;
  }
  
  .action-col {
    flex-direction: column;
    gap: 4px;
  }
}
</style>