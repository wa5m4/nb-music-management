<template>
    <div>
        <h2>我的收藏</h2>
        <div id="box">
            <div class="collect-item" v-for="collect in temp_data_for_collect_list" :key="collect.id">
                <div class="collect-item-inner" @click="handleCollect(collect.id)">
                    <div class="thumb">
                        <img id="image" :src="collect.image" alt="收藏图片" />
                        <div class="mask">
                            <img class="play-icon" src="/play.png" alt="播放" />
                        </div>
                    </div>
                    <div class="collect-name">{{ collect.name }}</div>
                    <div class="mu-num">{{ collect.musicCount }}首</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGlobalStore } from '../store';
import { type ApiResponse, type UserCollectList } from '../types/api';
import { get } from '../utils/index';
import { useRouter } from 'vue-router';

const router = useRouter();

const temp_data_for_collect_list: UserCollectList[] = [
    {
        id: 1,
        name: '收藏列表1',
        image: 'logo.png',
        create_time: '2023-01-01T12:00:00Z',
        update_time: '2023-01-02T12:00:00Z',
        musicCount: 10
    },
    {
        id: 2,
        name: '收藏列表2',
        image: 'logo.png',
        create_time: '2023-02-01T12:00:00Z',
        update_time: '2023-02-02T12:00:00Z',
        musicCount: 20
    },
    {
        id: 3,
        name: '收藏列表3',
        image: 'logo.png',
        create_time: '2023-03-01T12:00:00Z',
        update_time: '2023-03-02T12:00:00Z',
        musicCount: 15
    },
    {
        id: 4,
        name: '收藏列表4',
        image: 'logo.png',
        create_time: '2023-04-01T12:00:00Z',
        update_time: '2023-04-02T12:00:00Z',
        musicCount: 8
    },
    {
        id: 5,
        name: '收藏列表5',
        image: 'logo.png',
        create_time: '2023-05-01T12:00:00Z',
        update_time: '2023-05-02T12:00:00Z',
        musicCount: 12
    },
    {
        id: 6,
        name: '收藏列表6',
        image: 'logo.png',
        create_time: '2023-05-01T12:00:00Z',
        update_time: '2023-05-02T12:00:00Z',
        musicCount: 12
    },
    {
        id: 7,
        name: '收藏列表7',
        image: 'logo.png',
        create_time: '2023-05-01T12:00:00Z',
        update_time: '2023-05-02T12:00:00Z',
        musicCount: 12
    },
    {
        id: 8,
        name: '收藏列表8',
        image: 'logo.png',
        create_time: '2023-05-01T12:00:00Z',
        update_time: '2023-05-02T12:00:00Z',
        musicCount: 12
    },
    {
        id: 9,
        name: '收藏列表9',
        image: 'logo.png',
        create_time: '2023-05-01T12:00:00Z',
        update_time: '2023-05-02T12:00:00Z',
        musicCount: 12
    }
];

onMounted(async () => {
    // 获取全局信息
    const globalStore = useGlobalStore();

    if (!globalStore.isLogin) {
        // 如果未登录，跳转到登录页面
        window.location.href = '/login';
        return;
    } else {
        // 已登录，加载收藏列表数据
        // 这里可以添加获取收藏列表的逻辑
        const token = globalStore.token;
        const params = {
            userId: globalStore.userInfo?.id
        };
        const response = await get<ApiResponse<UserCollectList>>(
            '/musicList',
            { params, token })
            .catch((error) => {
                console.error('获取收藏列表失败:', error);
            });

        if (response && response.data.code === 200) {
            const collectList = response.data.data;
            console.log('收藏列表数据:', collectList);
            // 在这里可以将收藏列表数据存储到组件的状态中，以便在模板中使用
        } else {
            console.error('获取收藏列表失败，响应码:', response?.data.code);
        }
    }

});

const handleCollect = (collectId: number) => {
    console.log('点击了收藏列表，ID为:', collectId);
    router.push({ name: `like`, params: { id: collectId } });
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

.collect-item-inner .collect-name {
    text-align: left;
    margin-top: 5px;
    padding-left: 0.5em;
}

.collect-item-inner .mu-num {
    padding-left: 0.5em;
}
</style>