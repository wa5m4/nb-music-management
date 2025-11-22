<template>
  <div class="audio-player" v-if="currentSong">
    <!-- 播放器控制区域 -->
    <div class="player-controls">
      <!-- 上一首按钮 -->
      <button class="control-btn" @click="playPrevious" :disabled="!hasPrevious">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l11 6V6z"/>
        </svg>
      </button>
      
      <!-- 播放/暂停按钮 -->
      <button class="play-pause-btn" @click="togglePlay">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path v-if="!isPlaying" d="M8 5v14l11-7z"/>
          <path v-else d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>
      
      <!-- 下一首按钮 -->
      <button class="control-btn" @click="playNext" :disabled="!hasNext">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
    </div>
    
    <!-- 歌曲信息 -->
    <div class="song-info">
      <img :src="currentSong.image" alt="歌曲封面" class="song-cover">
      <div class="song-details">
        <div class="song-title">{{ currentSong.name }}</div>
        <div class="song-artist">{{ currentSong.author }}</div>
      </div>
    </div>
    
    <!-- 进度条 -->
    <div class="progress-area">
      <span class="current-time">{{ formatTime(currentTime) }}</span>
      <div class="progress-bar" @click="seekTo">
        <div class="progress" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <span class="duration">{{ formatTime(duration) }}</span>
    </div>
    
    <!-- 音量控制 -->
    <div class="volume-control">
      <button class="volume-btn" @click="toggleMute">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path v-if="isMuted || volume === 0" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          <path v-else-if="volume <= 0.3" d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM3 9v6h4l5 5V4L7 9H3z"/>
          <path v-else d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </button>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01" 
        v-model="volume" 
        class="volume-slider"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { MusicDetail } from '../types/api'

// ========== 播放器状态 ==========
const audioElement = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const isMuted = ref(false)

// ========== 播放列表相关 ==========
const currentSong = ref<MusicDetail | null>(null)
const currentPlaylist = ref<MusicDetail[]>([])
const currentIndex = ref(0)

// ========== 计算属性 ==========
const progressPercentage = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

const hasPrevious = computed(() => {
  return currentIndex.value > 0 && currentPlaylist.value.length > 0
})

const hasNext = computed(() => {
  return currentIndex.value < currentPlaylist.value.length - 1 && currentPlaylist.value.length > 0
})

// ========== 播放器控制方法 ==========

/**
 * 初始化播放器
 */
const initPlayer = () => {
  if (!audioElement.value) {
    audioElement.value = new Audio()
    
    // 监听音频事件
    audioElement.value.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.value!.duration
    })
    
    audioElement.value.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.value!.currentTime
    })
    
    audioElement.value.addEventListener('ended', () => {
      playNext()
    })
    
    audioElement.value.addEventListener('canplay', () => {
      isPlaying.value = true
    })
  }
}



/**
 * 播放指定歌曲
 * 增强错误处理，支持模拟数据中的音频URL
 * @param song 歌曲信息
 * @param playlist 播放列表
 * @param index 歌曲索引
 */
const playSong = (song: MusicDetail, playlist: MusicDetail[] = [], index: number = 0) => {
  currentSong.value = song
  currentPlaylist.value = playlist
  currentIndex.value = index
  
  if (audioElement.value) {
    // 检查音频URL是否有效
    if (!song.url || song.url === 'https://example.com/music1.mp3') {
      console.warn('⚠️ 音频URL无效或为示例URL，使用模拟音频资源');
      // 使用模拟音频资源
      const mockAudioUrls = [
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
      ];
      const audioIndex = index % mockAudioUrls.length;
      audioElement.value.src = mockAudioUrls[audioIndex];
    } else {
      audioElement.value.src = song.url;
    }
    
    audioElement.value.load();
    audioElement.value.play().catch(error => {
      console.error('❌ 播放失败:', error);
      console.log('🎯 尝试使用备用音频资源...');
      
      // 备用音频资源
      const fallbackUrls = [
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
      ];
      const fallbackIndex = Math.floor(Math.random() * fallbackUrls.length);
      audioElement.value!.src = fallbackUrls[fallbackIndex];
      audioElement.value!.play().catch(fallbackError => {
        console.error('❌ 备用音频也播放失败:', fallbackError);
      });
    });
  }
}

/**
 * 播放全部歌曲
 * @param playlist 播放列表
 */
const playAll = (playlist: MusicDetail[]) => {
  if (playlist.length === 0) return
  
  currentPlaylist.value = playlist
  currentIndex.value = 0
  playSong(playlist[0], playlist, 0)
}

/**
 * 切换播放/暂停状态
 */
const togglePlay = () => {
  if (!audioElement.value || !currentSong.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play().catch(error => {
      console.error('播放失败:', error)
    })
  }
  isPlaying.value = !isPlaying.value
}

/**
 * 播放下一首
 */
const playNext = () => {
  if (hasNext.value) {
    currentIndex.value++
    playSong(currentPlaylist.value[currentIndex.value], currentPlaylist.value, currentIndex.value)
  }
}

/**
 * 播放上一首
 */
const playPrevious = () => {
  if (hasPrevious.value) {
    currentIndex.value--
    playSong(currentPlaylist.value[currentIndex.value], currentPlaylist.value, currentIndex.value)
  }
}

/**
 * 跳转到指定时间
 * @param event 点击事件
 */
const seekTo = (event: MouseEvent) => {
  if (!audioElement.value) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickPosition = (event.clientX - rect.left) / rect.width
  const newTime = clickPosition * duration.value
  
  audioElement.value.currentTime = newTime
  currentTime.value = newTime
}

/**
 * 切换静音
 */
const toggleMute = () => {
  if (!audioElement.value) return
  
  isMuted.value = !isMuted.value
  audioElement.value.muted = isMuted.value
}

/**
 * 格式化时间显示
 * @param seconds 秒数
 */
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ========== 监听音量变化 ==========
watch(volume, (newVolume) => {
  if (audioElement.value) {
    audioElement.value.volume = newVolume
    isMuted.value = newVolume === 0
  }
})

// ========== 生命周期 ==========
onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
})

// ========== 暴露方法供外部调用 ==========
defineExpose({
  playSong,
  playAll,
  togglePlay,
  playNext,
  playPrevious,
  currentSong,
  isPlaying
})
</script>

<style scoped>
.audio-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-btn, .play-pause-btn, .volume-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  color: #666;
}

.control-btn:hover, .play-pause-btn:hover, .volume-btn:hover {
  background-color: #f0f0f0;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-pause-btn {
  background-color: #18b3de;
  color: white;
}

.play-pause-btn:hover {
  background-color: #0f8ab1;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  margin: 0 20px;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.song-details {
  flex: 1;
}

.song-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.song-artist {
  font-size: 12px;
  color: #666;
}

.progress-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 2;
}

.current-time, .duration {
  font-size: 12px;
  color: #666;
  min-width: 40px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.progress {
  height: 100%;
  background-color: #18b3de;
  border-radius: 2px;
  transition: width 0.1s;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #18b3de;
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #18b3de;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>