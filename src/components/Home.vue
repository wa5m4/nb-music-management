<template>
  <div class="recommend-container">
    <!-- 搜索由 Header 组件触发（监听全局 app-search 事件），此处不再显示输入控件 -->

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>正在加载推荐音乐...</span>
    </div>

    <!-- 推荐内容 -->
    <div v-else class="recommend-content">
      <!-- 搜索结果 -->
      <div class="search-results" v-if="searchResults && searchResults.length">
        <h2 class="section-title">搜索结果</h2>
        <div class="music-list">
          <div class="list-header">
            <span class="index-col">#</span>
            <span class="title-col">标题</span>
            <span class="artist-col">歌手</span>
            <span class="type-col">类型</span>
            <span class="duration-col">时长</span>
            <span class="action-col">操作</span>
          </div>
          <div class="list-item" v-for="(song, index) in searchResults" :key="song.id">
            <span class="index-col">{{ index + 1 }}</span>
            <div class="title-col song-info">
              <img :src="song.image || '/default-cover.png'" :alt="displayTitle(song)" class="song-cover" />
              <div class="text"><h3>{{ displayTitle(song) }}</h3></div>
            </div>
            <span class="artist-col">{{ displayAuthor(song) }}</span>
            <span class="type-col">{{ song.type }}</span>
            <span class="duration-col">{{ formatDuration(song.duration) }}</span>
            <div class="action-col">
              <button class="play-btn" @click="handlePlaySong(song, searchResults)" title="播放">▶</button>
              <button :class="['favorite-btn', { favorited: isFavorited(song) }]" @click.stop.prevent="openAddToPlaylist(song)" title="加入歌单">♡</button>
            </div>
          </div>
        </div>
      </div>
      <!-- 非搜索时显示的推荐内容（searchResults 非空时隐藏） -->
      <div v-if="!searchResults || !searchResults.length">
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
                  <h3 class="song-title">{{ displayTitle(song) }}</h3>
                  <p class="song-artist">{{ displayAuthor(song) }}</p>
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
                <h4>{{ displayTitle(song) }}</h4>
                <p>{{ displayAuthor(song) }}</p>
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
              <h3 class="item-title">{{ displayTitle(song) }}</h3>
              <p class="item-artist">{{ displayAuthor(song) }}</p>
            </div>
                <button :class="['favorite-btn', { favorited: isFavorited(song) }]" @click.stop.prevent="openAddToPlaylist(song)" title="加入歌单">
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
                <h3 class="item-title">{{ displayTitle(song) }}</h3>
                <p class="item-artist">{{ displayAuthor(song) }}</p>
              </div>
            <button :class="['favorite-btn', { favorited: isFavorited(song) }]" @click.stop.prevent="openAddToPlaylist(song)" title="加入歌单">
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
                <h3>{{ displayTitle(song) }}</h3>
              </div>
            </div>
            <span class="artist-col">{{ displayAuthor(song) }}</span>
            <span class="type-col">{{ song.type }}</span>
            <span class="duration-col">{{ formatDuration(song.duration) }}</span>
            <div class="action-col">
              <button class="play-btn" @click="handlePlaySong(song, playlistRecommend)" title="播放">
                ▶
              </button>
              <button :class="['favorite-btn', { favorited: isFavorited(song) }]" @click.stop.prevent="openAddToPlaylist(song)" title="加入歌单">
                ♡
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- 我创建的歌单：已移至 Profile 页面 -->
      </div>
    </div>

    <!-- 音频播放器组件 -->
    <AudioPlayer ref="audioPlayerRef" />
    
      <!-- 加入歌单对话框 -->
      <el-dialog v-model="showAddDialog" title="选择要加入的歌单" width="520px">
        <div style="max-height:320px; overflow:auto;">
          <div v-if="userPlaylists && userPlaylists.length">
            <div v-for="pl in userPlaylists" :key="pl.id" style="display:flex;align-items:center;justify-content:space-between;padding:8px 6px;border-bottom:1px solid #f5f5f5;">
              <div style="display:flex;align-items:center;gap:12px;cursor:pointer" @click="() => addSongToPlaylist(pl)">
                <img :src="pl.image || pl.cover || '/default-cover.png'" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" />
                <div>
                  <div style="font-weight:600">{{ pl.name }}</div>
                  <div style="color:#888;font-size:12px">{{ pl.musicCount || (pl.musics && pl.musics.length) || 0 }}首</div>
                </div>
              </div>
              <div>
                <el-button size="small" type="primary" :loading="adding" @click="() => addSongToPlaylist(pl)">加入</el-button>
              </div>
            </div>
          </div>
          <div v-else style="padding:12px;color:#666">未找到歌单，您可以到“我的歌单”新建歌单后再添加。</div>
        </div>
        <template #footer>
          <el-button @click="showAddDialog = false">关闭</el-button>
        </template>
      </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../store/auth'
import { getUserPlaylists, getPlaylistDetail, updatePlaylistList } from '../services/api'
import { useRoute } from 'vue-router'
import { getMusicList } from '../services/api'
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
// 用户创建的歌单（已移除，移动到 Profile 页面）

// 搜索相关
const searchQuery = ref('')
const searchResults = ref<MusicDetail[]>([])

// 加入歌单对话框相关
const showAddDialog = ref(false)
const currentSongToAdd = ref<any>(null)
const userPlaylists = ref<any[]>([])
const adding = ref(false)

// 收藏状态（已加入歌单视为已收藏）
const favoriteIds = ref<Set<any>>(new Set())

function loadFavorites() {
  try {
    const raw = localStorage.getItem('favorites')
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) favoriteIds.value = new Set(arr)
    }
  } catch (e) { favoriteIds.value = new Set() }
}

function saveFavorites() {
  try {
    const arr = Array.from(favoriteIds.value)
    localStorage.setItem('favorites', JSON.stringify(arr))
  } catch (e) { /* ignore */ }
}

function isFavorited(song: any) {
  if (!song) return false
  const id = song.id ?? song._id ?? song
  return favoriteIds.value.has(id)
}

const auth = useAuthStore()

const openAddToPlaylist = async (song: any) => {
  if (!auth.isLogin && !auth.user) {
    ElMessage.warning('请先登录')
    return
  }
  currentSongToAdd.value = song
  try {
    // 尝试用 auth.user.id，回退到 localStorage
    let userId: any = auth.user?.id
    if (!userId) {
      try {
        const raw = localStorage.getItem('user') || localStorage.getItem('userInfo')
        if (raw) userId = JSON.parse(raw)?.id
      } catch (e) {
        // ignore
      }
    }
    if (!userId) {
      ElMessage.warning('无法获取用户 ID，无法加载歌单')
      return
    }
    const resp = await getUserPlaylists(userId)
    const list = resp?.data?.data?.records ?? resp?.data?.data ?? resp?.data ?? []
    userPlaylists.value = Array.isArray(list) ? list : []
    showAddDialog.value = true
  } catch (err) {
    console.error('加载用户歌单失败', err)
    ElMessage.error('加载歌单失败')
  }
}

const addSongToPlaylist = async (playlist: any) => {
  if (!currentSongToAdd.value) return
  if (!playlist || !playlist.id) {
    ElMessage.error('无效的歌单')
    return
  }
  adding.value = true
  try {
    const songId = currentSongToAdd.value.id
    // helper: fetch existing ids
    const fetchIds = async () => {
      const r = await getPlaylistDetail(playlist.id)
      const d = r?.data?.data ?? r?.data ?? {}
      const musics = Array.isArray(d.musics) ? d.musics : (Array.isArray(d.records) ? d.records : (Array.isArray(d.list) ? d.list : (Array.isArray(d.musicIds) ? d.musicIds : [])))
      return Array.isArray(musics) ? musics.map((m: any) => (m && (m.id ?? m)) ).filter(Boolean) : []
    }

    let existingIds = await fetchIds()
    if (existingIds.includes(songId)) {
      ElMessage.info('该歌曲已在歌单中')
      showAddDialog.value = false
      return
    }

    const newIds = Array.from(new Set(existingIds.concat([songId])))

    // 尝试多种可能的后端期望格式
    // 根据接口文档，优先使用 { id, musics: [integer] }
    // 有些后端实现可能要求同时提供歌单的其它字段（name/image），此处一并携带以提高兼容性
    const tryPayloads: any[] = [
      // 首选：符合文档的整数数组 + 同时传入 musicCount
      { id: playlist.id, name: playlist.name, image: playlist.image, musics: newIds, musicCount: newIds.length },
      { id: playlist.id, name: playlist.name, image: playlist.image, musicCount: newIds.length, musicIds: newIds },
      { id: playlist.id, name: playlist.name, image: playlist.image, musicCount: newIds.length, musicIds: JSON.stringify(newIds) },
      { id: playlist.id, name: playlist.name, image: playlist.image, musicCount: newIds.length, musicIds: newIds.join(',') },
      { id: playlist.id, name: playlist.name, image: playlist.image, musicCount: newIds.length, musics: newIds.map((id: any) => ({ id })) }
    ]

    let success = false
    for (const payload of tryPayloads) {
      try {
        console.debug('[Home] 尝试用 payload 更新歌单：', payload)
        const upd = await updatePlaylistList(payload)
        console.debug('[Home] updatePlaylistList 返回：', upd?.data)
        // 如果接口返回明确的错误 msg，则跳过后续验证
        if (upd?.data && (upd.data.code === 500 || upd.data.code === 400)) {
          console.warn('[Home] 后端返回错误 code:', upd.data.code, upd.data.msg)
          continue
        }
        // 重新拉取歌单并验证是否包含 songId
        const latestIds = await fetchIds()
        if (latestIds.includes(songId)) {
          success = true
          break
        }
      } catch (e) {
        console.warn('[Home] update attempt failed', e)
        // try next payload
      }
    }

    if (success) {
      ElMessage.success('已添加到歌单')
      // 标记为已收藏（视觉反馈）
      try {
        const sid = currentSongToAdd.value?.id
        if (sid) {
          favoriteIds.value.add(sid)
          saveFavorites()
        }
      } catch (e) { /* ignore */ }
      showAddDialog.value = false
    } else {
      ElMessage.error('添加失败（后端未保存变更）')
    }
  } catch (err) {
    console.error('添加歌曲到歌单失败', err)
    ElMessage.error('添加失败')
  } finally {
    adding.value = false
  }
}

/** 搜索歌曲并展示结果
 *  逻辑：先以多字段一次性请求（提升命中率），若无结果则按单字段顺序重试（name->author->singer->keyword->title）
 */
const searchSongs = async () => {
  try {
    if (!searchQuery.value || !searchQuery.value.trim()) {
      searchResults.value = []
      return
    }
    const q = searchQuery.value.trim()

    const normalize = (resp: any) => {
      const top = resp?.data ?? {}
      const inner = top.data ?? top
      const records = Array.isArray(inner.records) ? inner.records : (Array.isArray(inner.list) ? inner.list : (Array.isArray(inner) ? inner : []))
      return Array.isArray(records) ? records : []
    }

    // 首次尝试：一次性传多个可能的字段，某些后端会 OR/模糊匹配
    const paramsAll: Record<string, any> = { pageNum: 1, pageSize: 50, name: q, author: q, singer: q, keyword: q }
    let resp = await getMusicList(paramsAll)
    let records = normalize(resp)

    // 如果没有结果，按单字段顺序重试以兼容只支持单个查询字段的后端
    const fallbackKeys = ['name', 'author', 'singer', 'keyword', 'title']
    for (const key of fallbackKeys) {
      if (records && records.length) break
      const p: Record<string, any> = { pageNum: 1, pageSize: 50 }
      p[key] = q
      try {
        resp = await getMusicList(p)
        records = normalize(resp)
      } catch (err) {
        console.warn('fallback search failed for', key, err)
        records = []
      }
    }

    searchResults.value = records || []
    if (!searchResults.value.length) {
      ElMessage.info('未找到匹配歌曲')
    }
  } catch (e) {
    console.error('searchSongs failed', e)
    ElMessage.error('搜索失败')
    searchResults.value = []
  }
}

// clearSearch 已移除，搜索清理通过接收空查询或由页面交互触发

// 轮播图当前索引
const carouselIndex = ref(0)

// 音频播放器引用
const audioPlayerRef = ref()

// 路由已移除

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
  // 统一使用加入歌单的对话框流程以保持行为一致
  openAddToPlaylist(song)
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

/**
 * 解析歌曲名称格式：如果 name 包含 " - "，则视为 "歌手 - 歌名"
 * 返回 { title, author }
 */
const parseSongLabel = (song: any) => {
  const raw = (song && (song.name ?? '')) || ''
  if (typeof raw === 'string' && raw.includes(' - ')) {
    const parts = raw.split(' - ')
    const author = parts[0].trim()
    const title = parts.slice(1).join(' - ').trim()
    return { title: title || raw, author: author }
  }
  return { title: raw || (song && song.title) || '', author: (song && song.author) || '' }
}

const displayTitle = (song: any) => parseSongLabel(song).title
const displayAuthor = (song: any) => parseSongLabel(song).author

// 生命周期
onMounted(() => {
  fetchRandomMusic()
  startCarousel()
  loadFavorites()
  // 监听来自 Header 的全局搜索事件
  const handler = (e: any) => {
    try {
      const q = String(e?.detail || '')
      if (q) {
        searchQuery.value = q
        searchSongs()
      }
    } catch (err) {
      console.error('handle app-search failed', err)
    }
  }
  window.addEventListener('app-search', handler)
  // 组件卸载时移除监听
  onUnmounted(() => window.removeEventListener('app-search', handler))

  // 如果路由中带有查询参数 q，则以 q 执行一次搜索（支持从 Header 跳转过来）
  const route = useRoute()
  try {
    const initialQ = String(route.query.q || '')
    if (initialQ && initialQ.trim()) {
      searchQuery.value = initialQ
      searchSongs()
    }
  } catch (err) {
    console.warn('init route query search failed', err)
  }

  // 监听路由 query.q 的变化，切换搜索/清空结果
  watch(() => route.query.q, (newQ) => {
    try {
      const q = String(newQ || '')
      if (q && q.trim()) {
        searchQuery.value = q
        searchSongs()
      } else {
        searchQuery.value = ''
        searchResults.value = []
      }
    } catch (err) {
      console.error('route q watch handler failed', err)
    }
  })
})

// 已将“我创建的歌单”交给 Profile 页面处理

// openPlaylist 已移除（歌单跳转由 Profile 页面处理）
</script>

<style scoped>
.recommend-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header 中已有搜索控件；Home 不再显示单独的搜索输入 */

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
/* 已收藏样式 */
.favorite-btn.favorited {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
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