<template>
    <div>
        <div style="display:flex;align-items:center;gap:12px;">
            <h2 style="margin:0">我的收藏</h2>
            <el-button type="primary" size="small" @click="openCreateDialog">新建歌单</el-button>
        </div>
        <div id="box">
            <div class="collect-item" v-for="collect in collectList" :key="collect.id">
                <div class="collect-item-inner">
                    <div class="thumb" @click="handleCollect(collect.id)">
                        <img id="image" :src="collect.image || DEFAULT_PLAYLIST_COVER" alt="收藏图片" />
                        <div class="mask">
                            <img class="play-icon" src="/play.png" alt="播放" />
                        </div>
                        <div class="upload-action" @click.stop="handleUploadCover(collect)">
                            <el-button size="mini">上传封面</el-button>
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
                    <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
                        <div class="mu-num">{{ collect.musicCount }}首</div>
                        <el-button type="danger" size="mini" @click.stop="removePlaylist(collect.id)">删除</el-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- 新建歌单对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建歌单" width="720px">
        <div style="display:flex; flex-direction:column; gap:10px;">
            <el-input v-model="newPlaylistName" placeholder="请输入歌单名称"></el-input>
            <div style="display:flex; gap:8px; align-items:center">
                <el-input v-model="searchQuery" placeholder="搜索歌曲（按名）" style="flex:1;" @keyup.enter.native="() => searchSongs()"></el-input>
                <el-button @click="() => searchSongs()">搜索</el-button>
            </div>

            <div style="max-height:300px; overflow:auto; border:1px solid #eee; padding:8px; border-radius:4px;">
                <el-checkbox-group v-model="selectedSongIds">
                    <div v-for="song in candidateSongs" :key="song.id" style="display:flex; gap:12px; align-items:center; padding:6px 4px; border-bottom:1px dashed #f5f5f5;">
                        <el-checkbox :label="song.id"></el-checkbox>
                        <div style="flex:1">
                            <div style="font-weight:600">{{ song.name }}</div>
                            <div style="color:#888; font-size:12px">{{ song.author }} · {{ song.duration ? (song.duration + 's') : '' }}</div>
                        </div>
                    </div>
                </el-checkbox-group>
            </div>
        </div>
        <template #footer>
            <el-button @click="createDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="creating" @click="createPlaylistHandler">创建并添加</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { useGlobalStore } from '../store';
import { useAuthStore } from '../store/auth';
import { type UserCollectList } from '../types/api';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserPlaylists, deletePlaylist, updatePlaylistList, getMusicList, createPlaylist, uploadFile } from '../services/api';

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
const DEFAULT_PLAYLIST_COVER = '/logo.png'
// 新建歌单对话框状态
const createDialogVisible = ref(false)
const newPlaylistName = ref('')
const searchQuery = ref('')
const candidateSongs = ref<any[]>([])
const selectedSongIds = ref<number[]>([])
const creating = ref(false)

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
        // 优先使用 auth store 中的 user（如果登录状态由 auth 管理）
        const auth = useAuthStore()
        let userId: number | string | null = null
        if (auth && auth.user && (auth.user as any).id) {
            userId = (auth.user as any).id
        } else if (globalStore.userInfo && (globalStore.userInfo as any).id) {
            userId = (globalStore.userInfo as any).id
        } else {
            try {
                // 兼容不同实现的本地存储 key
                const rawUser = localStorage.getItem('user') || localStorage.getItem('userInfo')
                if (rawUser) {
                    const parsed = JSON.parse(rawUser)
                    userId = parsed?.id ?? null
                }
            } catch (e) {
                console.warn('读取 localStorage.userInfo 失败', e)
            }

            // 如果 localStorage 中也没有 userInfo，则尝试从 token (JWT) 中解析 user id
            if (!userId) {
                try {
                    const token = localStorage.getItem('token')
                    if (token) {
                        const parts = token.split('.')
                        if (parts.length >= 2) {
                            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
                            userId = payload?.id ?? payload?.userId ?? payload?.sub ?? payload?.uid ?? null
                            console.log('从 token 解码得到 userId=', userId)
                        }
                    }
                } catch (e) {
                    console.warn('从 token 解码 userId 失败', e)
                }
            }
        }

        if (!userId) {
            console.warn('未找到用户 id，无法获取歌单列表')
            collectList.value = []
            return
        }

        // 打印候选 id 源，便于诊断（auth store / globalStore / localStorage / token）
        try {
            const auth = (await import('../store/auth')).useAuthStore()
            console.log('[debug] fetch candidate ids -> auth.user.id=', auth?.user?.id, 'globalStore.userInfo.id=', globalStore?.userInfo?.id)
        } catch (e) {
            console.log('[debug] fetch candidate ids -> globalStore.userInfo.id=', globalStore?.userInfo?.id)
        }
        console.log('调用 /musicList 获取用户歌单，最终使用 userId=', userId)
        const resp = await getUserPlaylists(userId)
        // resp 是 axios Response
        if (resp && resp.data && (resp.data.code === 200 || resp.data.code === 0)) {
            const list = resp.data.data?.records || resp.data.data || []
            collectList.value = list.map((item: any) => ({ ...item, isEditing: false, editingName: item.name || '' }))
            globalStore.setUserPlaylists(list)
        } else {
            ElMessage.error(resp?.data?.msg || '获取歌单失败')
            collectList.value = []
        }
    } catch (error) {
        console.error('获取收藏列表失败:', error);
        ElMessage.error('获取收藏列表失败');
        collectList.value = []
    }
};

/**
 * 使用静态数据作为回退方案
 */
// 已移除本地静态回退数据，统一使用后端返回结果

/** 新建歌单（弹窗输入名称） */
const openCreateDialog = async () => {
    newPlaylistName.value = ''
    searchQuery.value = ''
    candidateSongs.value = []
    selectedSongIds.value = []
    createDialogVisible.value = true
}

const searchSongs = async (page = 1, size = 50) => {
    try {
        const params: Record<string, any> = { pageNum: page, pageSize: size }
        if (searchQuery.value && searchQuery.value.trim()) params.name = searchQuery.value.trim()
        const resp = await getMusicList(params)
        const records = resp?.data?.data?.records ?? resp?.data?.data ?? resp?.data ?? []
        candidateSongs.value = Array.isArray(records) ? records : []
    } catch (err) {
        console.error('搜索歌曲失败', err)
        candidateSongs.value = []
    }
}

const createPlaylistHandler = async () => {
    if (!newPlaylistName.value || !newPlaylistName.value.trim()) {
        ElMessage.warning('歌单名称不能为空')
        return
    }
    if (!selectedSongIds.value || selectedSongIds.value.length === 0) {
        ElMessage.warning('请至少选择一首歌曲')
        return
    }
    try {
        creating.value = true
        // 调试：打印所有候选 userId 来源，便于确认使用哪个 id
        try {
            const auth = (await import('../store/auth')).useAuthStore()
            console.log('[debug] candidate userIds -> auth.user.id=', auth?.user?.id, 'globalStore.userInfo.id=', globalStore?.userInfo?.id)
        } catch (e) {
            console.log('[debug] candidate userIds -> globalStore.userInfo.id=', globalStore?.userInfo?.id)
        }
        const payload: any = { name: newPlaylistName.value.trim(), musicIds: selectedSongIds.value }
        const resp = await createPlaylist(payload)
        if (resp?.data && (resp.data.code === 200 || resp.data.code === 0)) {
            ElMessage.success('创建成功')
            createDialogVisible.value = false
            // 立即刷新列表以显示新建的歌单
            await loadCollectList()
        } else {
            ElMessage.error(resp?.data?.msg || '创建失败')
        }
    } catch (err) {
        console.error('创建歌单失败', err)
        ElMessage.error('创建歌单失败')
    } finally {
        creating.value = false
    }
}

/** 删除歌单（确认） */
const removePlaylist = async (id: number) => {
    try {
        await ElMessageBox.confirm('确认删除该歌单吗？此操作不可恢复', '删除歌单', { confirmButtonText: '删除', cancelButtonText: '取消' })
        const resp = await deletePlaylist(id)
        if (resp.data && (resp.data.code === 200 || resp.data.code === 0)) {
            ElMessage.success('删除成功')
            await loadCollectList()
        } else {
            ElMessage.error(resp?.data?.msg || '删除失败')
        }
    } catch (err) {
        // 取消或错误
    }
}

/**
 * 处理歌单点击
 */
const handleCollect = (collectId: number) => {
    console.log('点击了收藏列表，ID为:', collectId);
    router.push({ name: 'like', params: { id: collectId } });
};

/** 上传歌单封面（每个歌单右上角的上传入口） */
const handleUploadCover = async (collect: EditableCollectList) => {
    try {
        if (!collect.id) {
            ElMessage.warning('歌单尚未同步到后端，无法上传封面');
            return;
        }
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/png,image/jpeg,image/jpg'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            if (file.size > 5 * 1024 * 1024) {
                ElMessage.warning('图片不能超过 5MB')
                return
            }
            const form = new FormData()
            form.append('file', file)
            form.append('type', 'Picture')
            ElMessage.info('封面上传中...')
            const up = await uploadFile(form)
            const url = up?.data?.data?.url ?? up?.data?.url ?? up?.data
            if (!url) {
                ElMessage.error('上传失败，未返回 URL')
                return
            }
            // 调用更新歌单接口
            const resp = await updatePlaylistList({ id: collect.id, image: url })
            if (resp?.data && (resp.data.code === 200 || resp.data.code === 0)) {
                ElMessage.success('封面更新成功')
                await loadCollectList()
            } else {
                ElMessage.error(resp?.data?.msg || '更新封面失败')
            }
        }
        input.click()
    } catch (err) {
        console.error('上传歌单封面失败', err)
        ElMessage.error('上传歌单封面失败')
    }
}

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
        const resp = await updatePlaylistList({ id: collect.id, name: newName })
        if (resp.data && !(resp.data.code !== 200 && resp.data.code !== 0)) {
            // success path
        }
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

.collect-item-inner .thumb .upload-action {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    pointer-events: auto;
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