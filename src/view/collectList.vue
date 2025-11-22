<template>
    <div>
        <h2>我的收藏</h2>
        <div id="box">
            <div class="collect-item" v-for="collect in collectList" :key="collect.id">
                <div class="collect-item-inner">
                    <div class="thumb" @click="handleCollect(collect.id)">
                        <img id="image" :src="collect.image || 'logo.png'" alt="收藏图片" />
                        <div class="mask">
                            <img class="play-icon" src="/play.png" alt="播放" />
                        </div>
                    </div>
                    <!-- 歌单名称编辑区域 -->
                    <div class="collect-name-container">
                        <!-- 显示模式 -->
                        <div 
                            v-if="!collect.isEditing" 
                            class="collect-name-display"
                            @click="handleEditName(collect)"
                        >
                            <span class="collect-name">{{ collect.name }}</span>
                            <span class="edit-icon">✏️</span>
                        </div>
                        <!-- 编辑模式 -->
                        <div v-else class="collect-name-edit">
                            <el-input
                                ref="nameInputRef"
                                v-model="collect.editingName"
                                size="small"
                                @keyup.enter="savePlaylistName(collect)"
                                @blur="savePlaylistName(collect)"
                                placeholder="请输入歌单名称"
                                maxlength="20"
                                show-word-limit
                            />
                        </div>
                    </div>
                    <div class="mu-num">{{ collect.musicCount }}首</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { useGlobalStore } from '../store';
import { type UserCollectList } from '../types/api';
import { get, put } from '../utils/index';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const globalStore = useGlobalStore();
const nameInputRef = ref();

// 扩展UserCollectList接口，添加编辑相关属性
interface EditableCollectList extends UserCollectList {
  isEditing: boolean;
  editingName: string;
}

// 响应式歌单数据
const collectList = ref<EditableCollectList[]>([]);

onMounted(async () => {
    if (!globalStore.isLogin) {
        window.location.href = '/login';
        return;
    }

    await loadCollectList();
});

/**
 * 加载收藏列表
 */
const loadCollectList = async () => {
    try {
        const token = globalStore.token;
        const params = { id: globalStore.userInfo?.id };
        
        // 直接获取UserCollectList[]数组
        const response = await get<UserCollectList[]>('/musicList', { params, token });
        
        if (response && Array.isArray(response)) {
            // 转换为可编辑格式
            collectList.value = response.map(item => ({
                ...item,
                isEditing: false,
                editingName: item.name || ''
            }));
            
            // 更新store缓存
            globalStore.setUserPlaylists(response);
        } else {
            console.warn('API返回数据格式不符合预期');
            useStaticDataAsFallback();
        }
    } catch (error) {
        console.error('获取收藏列表失败:', error);
        ElMessage.error('获取收藏列表失败');
        useStaticDataAsFallback();
    }
};

/**
 * 使用静态数据作为回退方案
 */
const useStaticDataAsFallback = () => {
    const staticData: UserCollectList[] = [
        { id: 1, name: '我的最爱', image: 'logo.png', create_time: '2023-01-01T12:00:00Z', update_time: '2023-01-02T12:00:00Z', musicCount: 10 },
        { id: 2, name: '学习专注', image: 'logo.png', create_time: '2023-02-01T12:00:00Z', update_time: '2023-02-02T12:00:00Z', musicCount: 20 },
        { id: 3, name: '运动健身', image: 'logo.png', create_time: '2023-03-01T12:00:00Z', update_time: '2023-03-02T12:00:00Z', musicCount: 15 },
        { id: 4, name: '放松心情', image: 'logo.png', create_time: '2023-04-01T12:00:00Z', update_time: '2023-04-02T12:00:00Z', musicCount: 8 },
        { id: 5, name: '开车路上', image: 'logo.png', create_time: '2023-05-01T12:00:00Z', update_time: '2023-05-02T12:00:00Z', musicCount: 12 }
    ];
    
    collectList.value = staticData.map(item => ({
        ...item,
        isEditing: false,
        editingName: item.name || ''
    }));
};

/**
 * 处理歌单点击
 */
const handleCollect = (collectId: number) => {
    console.log('点击了收藏列表，ID为:', collectId);
    router.push({ name: 'like', params: { id: collectId } });
};

/**
 * 处理歌单名称编辑
 */
const handleEditName = async (collect: EditableCollectList) => {
    // 先退出其他编辑状态
    collectList.value.forEach(item => {
        if (item.id !== collect.id && item.isEditing) {
            item.isEditing = false;
        }
    });
    
    // 进入编辑模式
    collect.isEditing = true;
    collect.editingName = collect.name || '';
    
    // 等待DOM更新后聚焦输入框
    await nextTick();
    if (nameInputRef.value) {
        nameInputRef.value.focus();
    }
};

/**
 * 保存歌单名称
 */
const savePlaylistName = async (collect: EditableCollectList) => {
    if (!collect.editingName?.trim()) {
        ElMessage.warning('歌单名称不能为空');
        collect.isEditing = false;
        collect.editingName = collect.name || '';
        return;
    }
    
    const newName = collect.editingName.trim();
    
    // 如果名称没有变化，直接退出编辑模式
    if (newName === collect.name) {
        collect.isEditing = false;
        return;
    }
    
    try {
        // 调用PUT接口更新歌单信息
        await put('/musicList', {
            id: collect.id,
            name: newName
            // 只传递需要修改的字段，其他字段保持原样
        });
        // 更新本地数据
        collect.name = newName;
        collect.isEditing = false;
        
        // 更新store缓存
        globalStore.updatePlaylist({
            ...collect,
            name: newName
        });
        
        ElMessage.success('歌单名称修改成功');
    } catch (error) {
        console.error('更新歌单名称失败:', error);
        ElMessage.error('更新歌单名称失败');
        // 恢复原名称
        collect.editingName = collect.name || '';
        collect.isEditing = false;
    }
};
</script>

<style scoped>
#box {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    overflow-y: auto;
}

.collect-item-inner {
    display: flex;
    flex-direction: column;
}

.collect-item-inner .thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
}

.collect-item-inner .thumb #image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.25s ease;
}

.collect-item-inner .thumb .mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
}

/* 右下角播放图标 */
.collect-item-inner .thumb .mask .play-icon {
    position: absolute;
    right: 5%;
    bottom: 5%;
    width: 20%;
    height: 20%;
    aspect-ratio: 1 / 1;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));
}

.collect-item-inner:hover .thumb #image {
    transform: scale(1.02);
}

.collect-item-inner:hover .thumb .mask {
    opacity: 1;
}

.collect-item-inner .mu-num {
    padding-left: 0.5em;
    margin-top: 5px;
}

/* ========== 歌单名称编辑相关样式 ========== */
.collect-name-container {
    margin-top: 5px;
    min-height: 32px;
}

/* 显示模式样式 */
.collect-name-display {  
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.collect-name-display:hover {
    background-color: #f5f5f5;
    border-color: #e0e0e0;
}

.collect-name-display .collect-name {
    flex: 1;
    text-align: left;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.collect-name-display .edit-icon {
    margin-left: 8px;
    font-size: 12px;
    opacity: 0.6;
    transition: opacity 0.2s ease;
}

.collect-name-display:hover .edit-icon {
    opacity: 1;
}

/* 编辑模式样式 */
.collect-name-edit {
    padding: 2px 0;
}

.collect-name-edit .el-input {
    width: 100%;
}

.collect-name-edit .el-input__wrapper {
    box-shadow: 0 0 0 1px #409eff !important;
}

.collect-name-edit .el-input__inner {
    font-size: 14px;
    font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 1200px) {
    #box {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 768px) {
    #box {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .collect-name-display {
        padding: 3px 6px;
    }
    
    .collect-name-display .collect-name {
        font-size: 13px;
    }
}
</style>