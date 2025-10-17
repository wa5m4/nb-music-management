<template>
  <div class="like-music-page">
    <!-- 头部区域 -->
    <div class="header">
      <!-- 可上传的封面图 -->
      <div 
        class="cover-container" 
        @click="handleCoverUpload"
        @mouseenter="handleCoverMouseEnter"
        @mouseleave="handleCoverMouseLeave"
      >
        <img 
          :src="coverUrl" 
          alt="我喜欢的音乐封面" 
          class="cover"
        >
        <div class="upload-mask" v-if="isHovering">
          <span>点击更换封面</span>
        </div>
      </div>
      <div class="info">
        <h2>我喜欢的音乐</h2>
        <div class="user-info">
          <img :src="userAvatar" alt="用户头像" class="user-avatar">
          <span class="username">{{ username }}</span>
          <span class="song-count">歌曲 {{ songCount }}</span>
          <span class="create-time">创建时间 {{ createTime }}</span>
        </div>
        <div class="actions">
          <!-- 播放全部按钮：Element组件 + 浅蓝色样式 -->
          <el-button 
            type="primary" 
            class="play-all" 
            @click="playAllSongs" 
            :icon="CaretRight"
          >
            播放全部
          </el-button>
          <!-- 下载按钮：Element组件 + 白色样式 -->
          <el-button 
            type="default" 
            class="download" 
            @click="downloadAllSongs" 
            :icon="Download"
          >
            下载
          </el-button>
        </div>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div class="song-list">
      <div class="list-header">
        <span>#</span>
        <span>标题</span>
        <span>种类</span>
        <span>歌手</span>
        <span>时长</span>
        <span>发布时间</span>
      </div>
      <div 
        class="list-item" 
        v-for="(song, index) in songList" 
        :key="song.id"
        @click="handlePlaySong(song)"
      >
        <span class="index">{{ index + 1 }}</span>
        <div class="song-info">
          <img :src="song.cover" alt="歌曲封面" class="song-cover">
          <div class="text">
            <h3>{{ song.title }}</h3>
          </div>
        </div>
        <span class="artist">{{ song.artist }}</span>
        <span class="type">{{ song.type }}</span>
        <span class="duration">{{ song.duration }}</span>
        <span class="song-create-time">{{ song.createTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// 导入Element Plus图标
import { CaretRight, Download } from '@element-plus/icons-vue';
// ========== 示例数据） ==========
const coverUrl = ref('https://picsum.photos/200/200?random=1'); // 封面图示例
const isHovering = ref(false); // 封面 hover 状态
const userAvatar = ref('https://picsum.photos/30/30?random=2'); // 用户头像示例
const username = ref('wa5m4'); // 用户名示例
const songCount = ref(5); // 歌曲数量示例

const createTime = ref('2023-10-01');

// 歌曲列表示例（结构与后端返回一致）
const songList = ref([
  {
    id: 1,
    title: '背对背拥抱 (Back to Back)',
    artist: '林俊杰',
    duration: '03:56',
    cover: 'https://picsum.photos/50/50?random=3', // 歌曲封面示例
    type: '',
    createTime: ''
  },
  {
    id: 2,
    title: '水星记',
    artist: '郭顶',
    duration: '05:25',
    cover: 'https://picsum.photos/50/50?random=4',
    type: '',
    createTime: ''
  }
]);
// =====================================================
// 页面加载时调用后端接口获取数据
import { onMounted } from 'vue';
import { get, upload, post } from '../utils/index';
import { useGlobalStore } from '../store/index';
// 引入声明的类型
import type { ApiResponse, GetLikeMusicListAPI, LikeMusicListParams } from '../types/api';

// 格式化时长（秒 -> mm:ss）
const formatDuration = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

onMounted(async () => {
  const globalStore = useGlobalStore();
  
  // 统一判断登录状态
  if (!globalStore.isLogin) {
    console.error('用户未登录，请先登录');
    // 可选：跳转到登录页
    window.location.href = '/login';
    return;
  }

  try {

    const userInfo = globalStore.userInfo;
    if (!userInfo) {
    throw new Error('用户信息为空');
    }
    // 1. 渲染用户信息
    userAvatar.value = userInfo.avatar;
    username.value = userInfo.username;
    createTime.value = userInfo.createTime || '未知时间';


    // 2. 调用接口获取音乐列表
    const token = globalStore.token;
    const params: LikeMusicListParams = {
      userId: userInfo.id,
    };
    const response = await get<ApiResponse<LikeMusicListData>>(
      '/api/like-music-list',
      {params, token})

    if (response.code === 200) {
      songList.value = response.data.music.map(song => ({
        id: song.id,
        title: song.name,
        artist: song.artist,
        duration: formatDuration(song.duration), // 格式化时长
        cover: song.image,
        type: song.type,
        createTime: song.createTime || '未知时间'
      }));
      // 更新歌曲数量
      songCount.value = response.data.musics.length;
      // 更新封面图（使用接口返回的列表封面）
      coverUrl.value = response.data.image || coverUrl.value;

    } else {
      console.error('获取喜欢的音乐列表失败：', response.message);
    }
  } catch (error) {
    console.error('加载页面数据出错：', error);
  }
    
  // 3. 渲染封面图
  coverUrl.value = globalStore.coverUrl || 'https://picsum.photos/200/200?random=1';
});

// 2. 封面上传逻辑（POST接口）
const handleCoverUpload = async () => {
  try {
    // 添加文件选择逻辑（补充完整）
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('coverFile', file);
        // 关键：指定返回类型为 ApiResponse<CoverUploadData>
        const uploadResponse = await upload<ApiResponse<CoverUploadData>>('/api/like-music/cover/upload', formData);
        if (uploadResponse.code === 200) {
          const coverUrl = uploadResponse.data.coverUrl;
          const globalStore = useGlobalStore();
          globalStore.setCoverUrl(coverUrl); // 保存到 GlobalStore 及本地
        } else {
          console.error('封面上传失败：', uploadResponse.message);
        }
      }
    };
    input.click(); // 触发文件选择
  } catch (error) {
    console.error('封面上传出现异常：', error);
  }
};

// 3. 播放全部逻辑（POST接口）
const playAllSongs = async () => {
  try {
    // 关键：指定返回类型为 ApiResponse<EmptyData>
    const playResponse = await post<ApiResponse<EmptyData>>('/api/like-music/play-all');
    if (playResponse.code === 200) {
      console.log('开始播放全部歌曲：', playResponse.message);
    } else {
      console.error('播放全部歌曲失败：', playResponse.message);
    }
  } catch (error) {
    console.error('播放全部歌曲出现异常：', error);
  }
};

// 4. 下载全部逻辑（POST接口）
const downloadAllSongs = async () => {
  try {
    // 关键：指定返回类型为 ApiResponse<EmptyData>
    const downloadResponse = await post<ApiResponse<EmptyData>>('/api/like-music/download-all');
    if (downloadResponse.code === 200) {
      console.log('开始下载全部歌曲：', downloadResponse.message);
    } else {
      console.error('下载全部歌曲失败：', downloadResponse.message);
    }
  } catch (error) {
    console.error('下载全部歌曲出现异常：', error);
  }
};

// 5. 播放单首歌曲逻辑（POST接口）
const handlePlaySong = async (song: any) => {
  try {
    // 调用播放单首歌曲的后端接口（假设接口地址为 /api/like-music/play-song，需根据实际后端接口调整）
    const playResponse = await post<ApiResponse<EmptyData>>('/api/like-music/play-song', { songName: song.name });
    if (playResponse.code === 200) {
      console.log(`开始播放歌曲: ${song.title}`);
    } else {
      console.error(`播放歌曲 ${song.title} 失败:`, playResponse.message);
    }
  } catch (error) {
    console.error('播放歌曲出现异常:', error);
  }
};




// 封面 hover 交互
const handleCoverMouseEnter = () => {
  isHovering.value = true;
};
const handleCoverMouseLeave = () => {
  isHovering.value = false;
};



</script>

<style scoped>
/* 全局样式重置与基础设置 */
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
  transition: filter 0.6s ease; /* 增加过渡时间到0.6秒，使动画更慢 */
}

/* 鼠标悬停时的模糊+浅色半透明效果 */
.cover-container:hover .cover {
  filter: blur(5px); /* 调整模糊程度 */
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3); /* 浅色半透明（白色+30%透明度） */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dfd0d0; /* 文字颜色 */
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.6s ease; /* 同步过渡时间 */
}

.cover-container:hover .upload-mask {
  opacity: 1;
}
/* 信息区布局 */
.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px; /* 信息区内部元素垂直间距 */
}

.info h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px; /* 头像与文字的间距 */
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
  gap: 15px; /* 按钮之间的间距 */
}

/* 播放全部按钮样式：浅蓝色初始 + 悬停深色 */
.play-all {
  background-color: #18b3de !important; /* 浅蓝色初始背景 */
  border-color: #18b3de !important; /* 边框色与背景一致 */
}
.play-all:hover {
  background-color: #0f8ab1 !important; /* 悬停深色背景 */
  border-color: #0f8ab1 !important; /* 悬停深色边框 */
}

/* 下载按钮样式：白色初始 + 悬停深色 */
.download {
  background-color: #fff !important; /* 白色初始背景 */
  border-color: #ddd !important; /* 浅灰色边框 */
  color: #333 !important; /* 文字颜色 */
}
.download:hover {
  background-color: #f0f0f0 !important; /* 悬停深色背景 */
  border-color: #bbb !important; /* 悬停深色边框 */
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
.list-header span {
  flex: 1;
  text-align: left;
}
.list-header span:nth-child(1) {
  width: 60px;
  flex: none;
  text-align: center;
}
.list-header span:nth-child(3) {
  text-align: center;
}
.list-header span:nth-child(4) {
  text-align: center;
  width: 100px;
  flex: none;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f2f2f2;
  transition: background-color 0.2s;
}
.list-item:hover {
  background-color: #fafafa;
}
.list-item:active {
  background-color: #e5f8ff; 
  transition: background-color 0.2s;
}
.index {
  width: 60px;
  text-align: center;
  font-size: 14px;
  color: #666;
}
.song-info {
  display: flex;
  align-items: center;
  flex: 1;
}
.song-cover {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 15px;
}
.text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
.artist {
  text-align: center;
  flex: 1;
  font-size: 14px;
  color: #666;
}
.duration {
  text-align: center;
  width: 100px;
  flex: none;
  font-size: 14px;
  color: #666;
}
</style>