<script setup>
import { ref, onMounted, computed } from 'vue'
import { getMusicList, getUserList } from '../../services/api'

const userCount = ref(0)
const songCount = ref(0)

const stats = computed(() => ({ userCount: userCount.value, songCount: songCount.value }))

async function fetchCounts() {
  try {
    const musicResp = await getMusicList({ pageNum: 1, pageSize: 1 })
    // 支持多种后端返回格式的兼容读取
    // 后端有时候会把 total 设为 0，但同时返回 records 数组。优先使用大于 0 的 total，否则回退到 records.length
    const mdata = musicResp?.data?.data
    let musicTotal = 0
    if (mdata) {
      if (typeof mdata.total === 'number' && mdata.total > 0) musicTotal = mdata.total
      else if (typeof mdata.totalCount === 'number' && mdata.totalCount > 0) musicTotal = mdata.totalCount
      else if (Array.isArray(mdata.records)) musicTotal = mdata.records.length
    }
    // 有些接口把 total 放在 resp.data.total
    if (!musicTotal && typeof musicResp?.data?.total === 'number' && musicResp.data.total > 0) musicTotal = musicResp.data.total
    songCount.value = Number(musicTotal) || 0
    if (!songCount.value) console.debug('musicResp', musicResp)
  } catch (e) {
    console.error('fetch music count failed', e)
  }
  try {
    const userResp = await getUserList({ pageNum: 1, pageSize: 1 })
    const udata = userResp?.data?.data
    let userTotal = 0
    if (udata) {
      if (typeof udata.total === 'number' && udata.total > 0) userTotal = udata.total
      else if (typeof udata.totalCount === 'number' && udata.totalCount > 0) userTotal = udata.totalCount
      else if (Array.isArray(udata.records)) userTotal = udata.records.length
    }
    if (!userTotal && typeof userResp?.data?.total === 'number' && userResp.data.total > 0) userTotal = userResp.data.total
    userCount.value = Number(userTotal) || 0
    if (!userCount.value) console.debug('userResp', userResp)
  } catch (e) {
    console.error('fetch user count failed', e)
  }
}

onMounted(() => {
  // 管理端使用后端统计数据
  fetchCounts()
})
</script>

<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <div style="font-size:18px">用户总数</div>
          <div style="font-size:28px;margin-top:8px">{{ stats.userCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div style="font-size:18px">歌曲总数</div>
          <div style="font-size:28px;margin-top:8px">{{ stats.songCount }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped></style>
