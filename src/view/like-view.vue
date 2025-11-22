<template>
  <div class="like-music-page">

    <!-- 头部区域 -->
    <div class="header">
      <!-- 可上传的封面图 -->
      <div class="cover-container" @click="handleCoverUpload" @mouseenter="handleCoverMouseEnter"
        @mouseleave="handleCoverMouseLeave">
        <img :src="currentPlaylist.image || defaultCover" alt="歌单封面" class="cover">
        <div class="upload-mask" v-if="isHovering">
          <span>点击更换封面</span>
        </div>
      </div>
      <div class="info">
        <h2>{{ currentPlaylist.name || '歌单' }}</h2>
        <div class="user-info">
          <img :src="userAvatar" alt="用户头像" class="user-avatar">
          <span class="username">{{ username }}</span>
          <span class="song-count">歌曲 {{ currentPlaylist.musicCount || 0 }}</span>
          <span class="create-time">创建时间 {{ formatDate(currentPlaylist.create_time) }}</span>
        </div>
        <div class="actions">
          <!-- 播放全部按钮：Element组件 + 浅蓝色样式 -->
          <el-button type="primary" class="play-all" @click="playAllSongs" :icon="CaretRight">
            播放全部
          </el-button>
          <!-- 下载按钮：Element组件 + 白色样式 -->
          <el-button type="default" class="download" @click="downloadAllSongs" :icon="Download">
            下载
          </el-button>
        </div>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div class="song-list">
      <div class="list-header">
        <span class="index-col">#</span>
        <span class="title-col">标题</span>
        <span class="artist-col">歌手</span>
        <span class="type-col">种类</span>
        <span class="duration-col">时长</span>
        <span class="time-col">发布时间</span>
      </div>
      <div class="list-item" v-for="(song, index) in currentPlaylist.musics || []" :key="song.id" @click="handlePlaySong(song)">
        <span class="index-col">{{ index + 1 }}</span>
        <div class="title-col song-info">
          <img :src="song.image || 'https://picsum.photos/50/50?random=3'" alt="歌曲封面" class="song-cover">
          <div class="text">
            <h3>{{ song.name }}</h3>
          </div>
        </div>
        <span class="artist-col">{{ song.author }}</span>
        <span class="type-col">{{ song.type }}</span>
        <span class="duration-col">{{ formatDuration(song.duration) }}</span>
        <span class="time-col">{{ formatDate(song.createTime) }}</span>
      </div>
    </div>
    <!-- 音频播放器组件 -->
    <AudioPlayer ref="audioPlayerRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { CaretRight, Download, MoreFilled } from '@element-plus/icons-vue';
import { onMounted, watch } from 'vue';
import { get, upload, post, put } from '../utils/index';
import { useGlobalStore } from '../store/index';
import { useRoute } from 'vue-router';
import { ElMessage, ElLoading } from 'element-plus';
import type { 
  MusicListDetail,
  MusicDetail,
  UploadResponse
} from '../types/api';
// 导入AudioPlayer组件
import AudioPlayer from '../components/AudioPlayer.vue';


const route = useRoute();
const globalStore = useGlobalStore();

// ========== 响应式数据 ==========
const isHovering = ref(false);
const userAvatar = ref('https://picsum.photos/30/30?random=2');
const username = ref('wa5m4');
const currentPlaylist = ref<MusicListDetail>({} as MusicListDetail);
const defaultCover = 'https://picsum.photos/200/200?random=1';
// ========== 音频播放相关状态 ==========
const audioPlayerRef = ref<InstanceType<typeof AudioPlayer> | null>(null);

// ========== 工具函数 ==========

/**
 * 格式化时长（秒 => MM:SS）
 * @param seconds 时长（秒）
 * @returns 格式化后的时间字符串
 */
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '00:00';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

/**
 * 格式化日期（简化显示）
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '未知时间';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

// ========== 数据加载函数 ==========

/**
 * 获取歌单详细信息
 * 调用 /musicList/{id} 接口获取指定歌单的完整信息
 * @param id 歌单ID
 * @returns 歌单详细信息
 */
const fetchMusicListDetail = async (id: number): Promise<MusicListDetail | null> => {
  console.log(`🎯 开始获取歌单 ${id} 的详细信息...`);
  
  try {
    // 直接调用API获取歌单详情，包含名称、封面、歌曲列表等信息
    const musicListData = await get<MusicListDetail>(`/musicList/${id}`);
    console.log('✅ 获取歌单详情成功:', musicListData);
    return musicListData;
  } catch (error) {
    console.error('❌ 获取歌单详情失败:', error);
    ElMessage.error('获取歌单信息失败');
    return null;
  }
};

/**
 * 加载页面数据
 * 1. 从路由参数获取歌单ID
 * 2. 调用后端API获取歌单详细信息
 * 3. 更新页面显示数据
 */
const loadPageData = async () => {
  console.log('🚀 开始加载页面数据...');
  
  // 检查登录状态
  if (!globalStore.isLogin) {
    console.warn('⚠️ 用户未登录');
    ElMessage.warning('请先登录');
    return;
  }

  try {
    // 从路由参数获取歌单ID
    const routeId = parseInt(route.params.id as string);
    if (!routeId) {
      console.error('❌ 路由参数中没有有效的歌单ID');
      ElMessage.error('无效的歌单ID');
      return;
    }

    console.log('🎯 从路由获取歌单ID:', routeId);
    
    // 获取歌单详细信息
    const musicListData = await fetchMusicListDetail(routeId);
    
    if (musicListData) {
      // 更新当前歌单数据
      currentPlaylist.value = musicListData;
      
      // 更新用户信息显示
      if (globalStore.userInfo) {
        userAvatar.value = globalStore.userInfo.avatar || userAvatar.value;
        username.value = globalStore.userInfo.username || username.value;
      }
      
      console.log('✅ 页面数据加载完成', {
        歌单名称: musicListData.name,
        歌曲数量: musicListData.musicCount,
        封面: musicListData.image
      });
    } else {
      console.warn('⚠️ 获取歌单详情失败，显示空状态');
      currentPlaylist.value = {} as MusicListDetail;
    }
  } catch (error) {
    console.error('❌ 加载页面数据出错:', error);
    ElMessage.error('加载页面数据失败');
    currentPlaylist.value = {} as MusicListDetail;
  }
};

// ========== 交互函数 ==========

/**
 * 封面上传处理
 * 1. 打开文件选择器选择图片
 * 2. 上传文件到 /api/common/upload
 * 3. 获取返回的URL后更新歌单封面
 */
const handleCoverUpload = async () => {
  if (!currentPlaylist.value.id) {
    console.error('❌ 当前歌单ID为空，无法上传封面');
    ElMessage.warning('请先选择歌单');
    return;
  }

  try {
    console.log('📸 打开文件选择器...');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png, image/gif';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('📁 选择文件:', file.name);
        
        // 检查文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
          ElMessage.warning('图片大小不能超过5MB');
          return;
        }

        await uploadAndUpdateCover(file);
      }
    };
    input.click();
  } catch (error) {
    console.error('❌ 封面上传出现异常:', error);
    ElMessage.error('封面上传失败');
  }
};

/**
 * 上传文件并更新封面
 * @param file 图片文件
 */
const uploadAndUpdateCover = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // 显示上传中提示
    ElMessage.info('封面上传中...');

    // 上传文件到 /api/common/upload
    const uploadResponse = await upload<UploadResponse>('/api/common/upload', 'Picture');
    
    if (uploadResponse.url) {
      const newCoverUrl = uploadResponse.url;
      console.log('🖼️ 文件上传成功，新封面URL:', newCoverUrl);
      
      // 更新歌单封面
      await updatePlaylistCover(newCoverUrl);
    } else {
      throw new Error('上传响应中没有URL');
    }
  } catch (error) {
    console.error('❌ 文件上传失败:', error);
    ElMessage.error('文件上传失败');
  }
};

/**
 * 更新歌单封面
 * 调用PUT /musicList接口更新歌单封面信息
 * @param newCoverUrl 新的封面URL
 */
const updatePlaylistCover = async (newCoverUrl: string) => {
  if (!currentPlaylist.value.id) {
    console.error('❌ 歌单ID为空，无法更新封面');
    return;
  }

  try {
    console.log('🎨 开始更新歌单封面:', newCoverUrl);
    
    // 调用PUT接口更新歌单信息，只传递需要修改的封面字段
    await put('/musicList', {
      id: currentPlaylist.value.id,
      image: newCoverUrl
      // 只传递ID和需要修改的image字段，其他字段保持原样
    });
    
    // 更新本地数据
    currentPlaylist.value.image = newCoverUrl;
    
    console.log('✅ 封面更新成功');
    ElMessage.success('封面更新成功');
  } catch (error) {
    console.error('❌ 更新封面失败:', error);
    ElMessage.error('封面更新失败');
  }
};

/**
 * 播放全部歌曲
 * 使用AudioPlayer组件的playAll方法
 */
const playAllSongs = async () => {
  if (!currentPlaylist.value.musics || currentPlaylist.value.musics.length === 0) {
    ElMessage.warning('当前歌单没有歌曲');
    return;
  }

  try {
    // 过滤出有URL的歌曲
    const playableSongs = currentPlaylist.value.musics.filter(song => song.url);
    
    if (playableSongs.length === 0) {
      ElMessage.warning('当前歌单中没有可播放的歌曲');
      return;
    }

    // 使用AudioPlayer组件播放全部歌曲
    if (audioPlayerRef.value) {
      audioPlayerRef.value.playAll(playableSongs);
      ElMessage.success(`开始播放 ${playableSongs.length} 首歌曲`);
    } else {
      ElMessage.error('播放器未初始化');
    }
  } catch (error) {
    console.error('播放全部歌曲失败:', error);
    ElMessage.error('播放失败，请稍后重试');
  }
};


/**
 * 下载全部歌曲
 */
const downloadAllSongs = async () => {
  console.log('📥 用户尝试下载全部歌曲');
  
  // 检查歌单是否有歌曲
  if (!currentPlaylist.value.musics || currentPlaylist.value.musics.length === 0) {
    ElMessage.warning('当前歌单没有歌曲');
    return;
  }
  
  // 显示版权提示信息
  ElMessage.warning({
    message: '由于版权保护原因，批量下载功能暂不开放',
    duration: 3000, // 3秒后自动关闭
    showClose: true
  });
  
  console.log('⚠️ 下载功能因版权原因被阻止');
};

/**
 * 播放单首歌曲
 * 使用AudioPlayer组件的playSong方法
 * @param song 歌曲信息
 */
const handlePlaySong = async (song: MusicDetail) => {
  if (!song.url) {
    ElMessage.warning('该歌曲暂无播放链接');
    return;
  }

  try {
    // 使用AudioPlayer组件播放单首歌曲
    if (audioPlayerRef.value) {
      const playlist = currentPlaylist.value.musics || [];
      const index = playlist.findIndex(s => s.id === song.id);
      audioPlayerRef.value.playSong(song, playlist, index);
      ElMessage.success(`开始播放: ${song.name}`);
    } else {
      ElMessage.error('播放器未初始化');
    }
  } catch (error) {
    console.error('播放歌曲失败:', error);
    ElMessage.error('播放失败，请稍后重试');
  }
};


// ========== UI交互函数 ==========

/**
 * 封面鼠标移入事件 - 显示上传遮罩
 */
const handleCoverMouseEnter = () => {
  isHovering.value = true;
};

/**
 * 封面鼠标移出事件 - 隐藏上传遮罩
 */
const handleCoverMouseLeave = () => {
  isHovering.value = false;
};




// ========== 生命周期 ==========

/**
 * 页面加载时初始化数据
 */
onMounted(() => {
  console.log('🏠 页面加载完成，开始初始化...');
  loadPageData();
});

/**
 * 监听路由变化，当歌单ID改变时重新加载数据
 */
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      console.log('🔄 路由参数变化，重新加载数据:', newId);
      loadPageData();
    }
  }
);
</script>

<style scoped>
/* 样式保持不变 */
.like-music-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  background-color: #fff;
  font-family: "Microsoft YaHei", sans-serif;
  color: #333;
}

/* 头部样式优化 */
.header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.cover-container {
  width: 180px;
  height: 180px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: pointer;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.6s ease;
  /* 增加过渡时间到0.6秒，使动画更慢 */
}

/* 鼠标悬停时的模糊+浅色半透明效果 */
.cover-container:hover .cover {
  filter: blur(5px);
  /* 调整模糊程度 */
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3);
  /* 浅色半透明（白色+30%透明度） */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dfd0d0;
  /* 文字颜色 */
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.6s ease;
  /* 同步过渡时间 */
}

.cover-container:hover .upload-mask {
  opacity: 1;
}

/* 信息区布局 */
.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  /* 信息区内部元素垂直间距 */
}

.info h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  /* 头像与文字的间距 */
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.song-count {
  color: #666;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 15px;
  /* 按钮之间的间距 */
}

/* 播放全部按钮样式：浅蓝色初始 + 悬停深色 */
.play-all {
  background-color: #18b3de !important;
  /* 浅蓝色初始背景 */
  border-color: #18b3de !important;
  /* 边框色与背景一致 */
}

.play-all:hover {
  background-color: #0f8ab1 !important;
  /* 悬停深色背景 */
  border-color: #0f8ab1 !important;
  /* 悬停深色边框 */
}

/* 下载按钮样式：白色初始 + 悬停深色 */
.download {
  background-color: #fff !important;
  /* 白色初始背景 */
  border-color: #ddd !important;
  /* 浅灰色边框 */
  color: #333 !important;
  /* 文字颜色 */
}

.download:hover {
  background-color: #f0f0f0 !important;
  /* 悬停深色背景 */
  border-color: #bbb !important;
  /* 悬停深色边框 */
}

/* 歌曲列表样式优化 */
.song-list {
  background-color: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.list-header {
  display: flex;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 14px;
}

.list-header .index-col {
  width: 60px;
  text-align: center;
  flex: none;
}

.list-header .title-col {
  flex: 3;
  min-width: 200px;
  text-align: left;
}

.list-header .artist-col {
  flex: 1.5;
  min-width: 120px;
  text-align: left;
}

.list-header .type-col {
  flex: 1;
  min-width: 80px;
  text-align: center;
}

.list-header .duration-col {
  width: 80px;
  flex: none;
  text-align: center;
}

.list-header .time-col {
  width: 120px;
  flex: none;
  text-align: center;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f2f2f2;
  transition: background-color 0.2s;
  cursor: pointer;
}

.list-item:hover {
  background-color: #fafafa;
}

.list-item:active {
  background-color: #e5f8ff;
  transition: background-color 0.2s;
}

.list-item .index-col {
  width: 60px;
  text-align: center;
  font-size: 14px;
  color: #666;
  flex: none;
}

.list-item .title-col {
  flex: 3;
  min-width: 200px;
  display: flex;
  align-items: center;
}

.list-item .artist-col {
  flex: 1.5;
  min-width: 120px;
  font-size: 14px;
  color: #666;
  text-align: left;
}

.list-item .type-col {
  flex: 1;
  min-width: 80px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.list-item .duration-col {
  width: 80px;
  flex: none;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.list-item .time-col {
  width: 120px;
  flex: none;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.song-info {
  display: flex;
  align-items: center;
  width: 100%;
}

.song-cover {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 15px;
}

.text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

@media (max-width: 768px) {
  .like-music-page {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    text-align: center;
  }
  
  .info {
    align-items: center;
    text-align: center;
  }
  
  .user-info {
    justify-content: center;
  }
  
  .list-header .type-col,
  .list-item .type-col,
  .list-header .time-col,
  .list-item .time-col {
    display: none;
  }
}
</style>