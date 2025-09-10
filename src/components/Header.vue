<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Search, ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

interface RestaurantItem {
    value: string
    link: string
}
const state2 = ref('')
const router = useRouter()

const restaurants = ref<RestaurantItem[]>([])
const querySearch = (queryString: string, cb: any) => {
    const results = queryString
        ? restaurants.value.filter(createFilter(queryString))
        : restaurants.value
    // call callback function to return suggestions
    cb(results)
}
const createFilter = (queryString: string) => {
    return (restaurant: RestaurantItem) => {
        return (
            restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
        )
    }
}
const loadAll = () => {
    return [
        { value: 'vue', link: 'https://github.com/vuejs/vue' },
        { value: 'element', link: 'https://github.com/ElemeFE/element' },
        { value: 'cooking', link: 'https://github.com/ElemeFE/cooking' },
        { value: 'mint-ui', link: 'https://github.com/ElemeFE/mint-ui' },
        { value: 'vuex', link: 'https://github.com/vuejs/vuex' },
        { value: 'vue-router', link: 'https://github.com/vuejs/vue-router' },
        { value: 'babel', link: 'https://github.com/babel/babel' },
    ]
}

const handleSelect = (item: Record<string, any>) => {
    console.log(item)
}

onMounted(() => {
    restaurants.value = loadAll()
})

// handle search button click
const search = () => {
    if (state2.value.trim() !== '') {
        router.push(`/search/${state2.value}`)
    }
}

// handle previous button click
const goBack = () => {
    router.go(-1);
}
</script>

<template>
    <el-row :gutter="10">
        <el-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
            <div class="grid-content ep-bg-purple">
                <img src="/logo.png" alt="logo" width="50px" />
            </div>
        </el-col>
        <el-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
            <div class="grid-content ep-bg-purple-light input-box">
                <el-button :icon="ArrowLeft" round @click="goBack"></el-button>
                <el-autocomplete v-model="state2" :fetch-suggestions="querySearch" :trigger-on-focus="false" clearable
                    placeholder="搜你想听" @select="handleSelect" />
                <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
            </div>
        </el-col>
        <el-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
            <div class="grid-content ep-bg-purple">User</div>
        </el-col>
        <el-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
            <div class="grid-content ep-bg-purple-light">Setting</div>
        </el-col>
    </el-row>
</template>

<style scoped>
.el-col {
    border-radius: 4px;
}

.grid-content {
    border-radius: 4px;
    min-height: 36px;
}

.input-box {
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
}
</style>