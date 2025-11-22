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
            v-for="(song, index) in musicList.slice(0, 3)" 
            :key="song.id"
            :class="{ active: carouselIndex === index }"
            @click="handlePlaySong(song)"
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
            v-for="(song, index) in musicList.slice(3, 7)" 
            :key="song.id"
            :style="{ backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][index] }"
          >
            <div class="horizontal-grid-content" @click="handlePlaySong(song)">
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
              <div class="item-content" @click="handlePlaySong(song)">
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
              <div class="item-content" @click="handlePlaySong(song)">
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
            v-for="(song, index) in musicList.slice(7)" 
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
              <button class="play-btn" @click="handlePlaySong(song)" title="播放">
                ▶
              </button>
              <button class="favorite-btn" @click="handleAddToFavorite(song)" title="收藏">
                ♡
              </button>
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
import { get } from '../utils/index'
import type { MusicDetail } from '../types/api'
import { ElMessage } from 'element-plus'

// 音乐数据
const musicList = ref<MusicDetail[]>([])
const dailyRecommend = ref<MusicDetail[]>([])
const loading = ref(false)
const refreshing = ref(false)

// 轮播图当前索引
const carouselIndex = ref(0)

// 音频播放器引用
const audioPlayerRef = ref()

/**
 * 获取随机音乐列表
 */
const fetchRandomMusic = async () => {
  loading.value = true
  try {
    // 调用后端接口获取随机音乐列表，请求16首歌曲（10首主列表+6首每日推荐）
    const response = await get<MusicDetail[]>('/music/random', {
      params: { length: 16 }
    })
    
    if (response && Array.isArray(response)) {
      musicList.value = response.slice(0, 10)
      dailyRecommend.value = response.slice(10, 16)
      console.log('✅ 获取随机音乐列表成功:', response)
    } else {
      console.warn('API返回数据格式不符合预期')
      // 使用模拟数据作为回退
      useMockData()
    }
  } catch (error) {
    console.error('❌ 获取随机音乐列表失败:', error)
    ElMessage.error('获取推荐音乐失败')
    // 使用模拟数据作为回退
    useMockData()
  } finally {
    loading.value = false
  }
}

/**
 * 刷新每日推荐
 */
const refreshDailyRecommend = async () => {
  refreshing.value = true
  try {
    // 调用后端接口获取6首新的推荐歌曲
    const response = await get<MusicDetail[]>('/music/random', {
      params: { length: 6 }
    })
    
    if (response && Array.isArray(response)) {
      dailyRecommend.value = response
      ElMessage.success('推荐已更新')
      console.log('✅ 刷新每日推荐成功:', response)
    } else {
      console.warn('API返回数据格式不符合预期')
      ElMessage.warning('刷新失败，请重试')
    }
  } catch (error) {
    console.error('❌ 刷新每日推荐失败:', error)
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/**
 * 使用模拟数据作为回退方案
 */
const useMockData = () => {
  const mockData: MusicDetail[] = [
    {
      id: 1, name: '夜曲', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      image: 'https://picsum.photos/300/300?random=1', createTime: '2023-01-01',
      updateTime: '2023-01-01', duration: 240, status: 1
    },
    {
      id: 2, name: '七里香', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      image: 'https://picsum.photos/300/300?random=2', createTime: '2023-01-02',
      updateTime: '2023-01-02', duration: 260, status: 1
    },
    {
      id: 3, name: '青花瓷', author: '周杰伦', type: '中国风',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      image: 'https://picsum.photos/300/300?random=3', createTime: '2023-01-03',
      updateTime: '2023-01-03', duration: 280, status: 1
    },
    {
      id: 4, name: '简单爱', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      image: 'https://picsum.photos/300/300?random=4', createTime: '2023-01-04',
      updateTime: '2023-01-04', duration: 220, status: 1
    },
    {
      id: 5, name: '稻香', author: '周杰伦', type: '民谣',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      image: 'https://picsum.photos/300/300?random=5', createTime: '2023-01-05',
      updateTime: '2023-01-05', duration: 300, status: 1
    },
    {
      id: 6, name: '告白气球', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      image: 'https://picsum.photos/300/300?random=6', createTime: '2023-01-06',
      updateTime: '2023-01-06', duration: 250, status: 1
    },
    {
      id: 7, name: '晴天', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
      image: 'https://picsum.photos/300/300?random=7', createTime: '2023-01-07',
      updateTime: '2023-01-07', duration: 270, status: 1
    },
    {
      id: 8, name: '双截棍', author: '周杰伦', type: '摇滚',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      image: 'https://picsum.photos/300/300?random=8', createTime: '2023-01-08',
      updateTime: '2023-01-08', duration: 230, status: 1
    },
    {
      id: 9, name: '东风破', author: '周杰伦', type: '中国风',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
      image: 'https://picsum.photos/300/300?random=9', createTime: '2023-01-09',
      updateTime: '2023-01-09', duration: 290, status: 1
    },
    {
      id: 10, name: '听妈妈的话', author: '周杰伦', type: '说唱',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      image: 'https://picsum.photos/300/300?random=10', createTime: '2023-01-10',
      updateTime: '2023-01-10', duration: 260, status: 1
    },
    // 每日推荐数据
    {
      id: 11, name: '以父之名', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
      image: 'https://picsum.photos/300/300?random=11', createTime: '2023-01-11',
      updateTime: '2023-01-11', duration: 240, status: 1
    },
    {
      id: 12, name: '发如雪', author: '周杰伦', type: '中国风',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
      image: 'https://picsum.photos/300/300?random=12', createTime: '2023-01-12',
      updateTime: '2023-01-12', duration: 280, status: 1
    },
    {
      id: 13, name: '珊瑚海', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
      image: 'https://picsum.photos/300/300?random=13', createTime: '2023-01-13',
      updateTime: '2023-01-13', duration: 260, status: 1
    },
    {
      id: 14, name: '不能说的秘密', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
      image: 'https://picsum.photos/300/300?random=14', createTime: '2023-01-14',
      updateTime: '2023-01-14', duration: 250, status: 1
    },
    {
      id: 15, name: '彩虹', author: '周杰伦', type: '流行',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
      image: 'https://picsum.photos/300/300?random=15', createTime: '2023-01-15',
      updateTime: '2023-01-15', duration: 270, status: 1
    },
    {
      id: 16, name: '千里之外', author: '周杰伦', type: '中国风',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
      image: 'https://picsum.photos/300/300?random=16', createTime: '2023-01-16',
      updateTime: '2023-01-16', duration: 290, status: 1
    }
  ]
  musicList.value = mockData.slice(0, 10)
  dailyRecommend.value = mockData.slice(10, 16)
}

/**
 * 播放单首歌曲
 */
const handlePlaySong = (song: MusicDetail) => {
  if (audioPlayerRef.value) {
    audioPlayerRef.value.playSong(song, musicList.value, musicList.value.findIndex(s => s.id === song.id))
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
})
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