<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getMusicList, getUserList, getUserStatistic, getRequestStatistic } from '../../services/api'
import type { UserStatisticData, RequestStatisticData } from '../../types/api'

const userCount = ref(0)
const songCount = ref(0)

const userStat = ref<UserStatisticData | null>(null)
const statLoading = ref(false)
const statError = ref('')

const requestStat = ref<RequestStatisticData | null>(null)
const requestLoading = ref(false)
const requestError = ref('')

const barPalette = ['#5B8FF9', '#61DDAA', '#F6BD16', '#F6903D', '#6E8BFF', '#7C89A1', '#A3AED0']

const pieData = computed(() => {
  const stat = userStat.value
  const admin = Number(stat?.adminCount ?? 0)
  const user = Number(stat?.userCount ?? 0)
  const tourist = Number(stat?.touristCount ?? 0)
  const total = Number(stat?.totalCount ?? 0)
  const knownSum = admin + user + tourist
  const remainder = Math.max(0, total - knownSum)
  const list = [
    { label: '管理员', value: admin, color: '#5B8FF9' },
    { label: '普通用户', value: user, color: '#61DDAA' },
    { label: '游客', value: tourist, color: '#F6BD16' }
  ]
  if (remainder > 0) list.push({ label: '其他', value: remainder, color: '#F6903D' })
  return list
})

const pieTotal = computed(() => {
  // 优先使用后端 totalCount，使饼图中心与后端统计一致
  const totalFromStat = Number(userStat.value?.totalCount ?? 0)
  if (totalFromStat > 0) return totalFromStat
  return pieData.value.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0), 0)
})

const pieSegments = computed(() => {
  const total = pieTotal.value
  if (!total) return []
  let cursor = 0
  return pieData.value.map(item => {
    const angle = total ? (item.value / total) * 360 : 0
    const start = cursor
    const end = start + angle
    cursor = end
    return `${item.color} ${start}deg ${end}deg`
  })
})

const pieStyle = computed(() => {
  if (!pieSegments.value.length) return { background: '#f5f7fa' }
  // conic-gradient 需要补齐 360deg，否则会留下空白
  let maxDeg = 0
  pieSegments.value.forEach(seg => {
    const parts = seg.split(' ')
    const end = parseFloat(parts[2]) || 0
    if (end > maxDeg) maxDeg = end
  })
  const gap = maxDeg < 360 ? `, #f5f7fa ${maxDeg}deg 360deg` : ''
  return { background: `conic-gradient(${pieSegments.value.join(', ')}${gap})` }
})

const statNumbers = computed(() => {
  const s = userStat.value
  return {
    totalCount: Number(s?.totalCount ?? 0),
    adminCount: Number(s?.adminCount ?? 0),
    userCount: Number(s?.userCount ?? 0),
    touristCount: Number(s?.touristCount ?? 0),
    activeWeekUserCount: Number(s?.activeWeekUserCount ?? 0),
    activeDayUserCount: Number(s?.activeDayUserCount ?? 0)
  }
})

const requestNumbers = computed(() => {
  const r = requestStat.value
  return {
    categoryCount: Number(r?.categoryCount ?? 0),
    differentIpCount: Number(r?.differentIpCount ?? 0),
    categoryMap: Array.isArray(r?.categoryMap) ? r?.categoryMap : [],
    methodMap: Array.isArray(r?.methodMap) ? r?.methodMap : []
  }
})

const requestPieData = computed(() => {
  const list = requestNumbers.value.categoryMap
  return list.map((item, idx) => {
    const label = item.category || item.name || `分类${idx + 1}`
    const value = Number(item.count ?? item.value ?? 0)
    return { label, value, color: barPalette[idx % barPalette.length] }
  })
})

const requestPieTotal = computed(() => {
  const total = Number(requestNumbers.value.categoryCount)
  if (total > 0) return total
  return requestPieData.value.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0), 0)
})

const requestPieSegments = computed(() => {
  const total = requestPieTotal.value
  if (!total) return []
  let cursor = 0
  return requestPieData.value.map(item => {
    const angle = total ? (item.value / total) * 360 : 0
    const start = cursor
    const end = start + angle
    cursor = end
    return `${item.color} ${start}deg ${end}deg`
  })
})

const requestPieStyle = computed(() => {
  if (!requestPieSegments.value.length) return { background: '#f5f7fa' }
  let maxDeg = 0
  requestPieSegments.value.forEach(seg => {
    const parts = seg.split(' ')
    const end = parseFloat(parts[2]) || 0
    if (end > maxDeg) maxDeg = end
  })
  const gap = maxDeg < 360 ? `, #f5f7fa ${maxDeg}deg 360deg` : ''
  return { background: `conic-gradient(${requestPieSegments.value.join(', ')}${gap})` }
})

function buildBars(rawList: Array<Record<string, any>>, fallbackLabel: string) {
  const mapped = rawList.map((item, idx) => {
    const label = item.category || item.method || item.name || `${fallbackLabel}${idx + 1}`
    const count = Number(item.count ?? item.value ?? 0)
    return { label, count }
  })
  const max = mapped.reduce((m, cur) => Math.max(m, cur.count), 0)
  return mapped.map((item, idx) => {
    const pct = max ? (item.count / max) * 100 : 0
    const width = item.count > 0 ? Math.max(4, pct) : 0
    return { ...item, width, color: barPalette[idx % barPalette.length] }
  })
}

const requestCategoryBars = computed(() => buildBars(requestNumbers.value.categoryMap, '分类'))
const requestMethodBars = computed(() => buildBars(requestNumbers.value.methodMap, '方法'))

const roleBars = computed(() => {
  const total = statNumbers.value.totalCount || 0
  const other = Math.max(0, total - statNumbers.value.adminCount - statNumbers.value.userCount - statNumbers.value.touristCount)
  const base = [
    { label: '管理员', count: statNumbers.value.adminCount, color: '#5B8FF9' },
    { label: '普通用户', count: statNumbers.value.userCount, color: '#61DDAA' },
    { label: '游客', count: statNumbers.value.touristCount, color: '#F6BD16' }
  ]
  if (other > 0) base.push({ label: '其他', count: other, color: '#F6903D' })
  return base.map(item => ({ ...item, width: total ? (item.count / total) * 100 : 0 }))
})

const activeBars = computed(() => {
  const total = statNumbers.value.totalCount || 0
  return [
    { label: '周活跃', count: statNumbers.value.activeWeekUserCount, color: '#7C89A1' },
    { label: '日活跃', count: statNumbers.value.activeDayUserCount, color: '#A3AED0' }
  ].map(item => ({ ...item, width: total ? (item.count / total) * 100 : 0 }))
})

function formatPercent(value: number) {
  const total = pieTotal.value
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function formatPercentBy(total: number, value: number) {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

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

async function fetchUserStat() {
  statLoading.value = true
  statError.value = ''
  try {
    console.log('[Dashboard] fetchUserStat start')
    const resp = await getUserStatistic()
    console.log('[Dashboard] fetchUserStat resp', resp)
    if (resp && (resp.code === 0 || resp.code === 200)) {
      if (resp.data) {
        console.log('[Dashboard] userStatistic data', resp.data)
        userStat.value = resp.data
        if (typeof resp.data.totalCount === 'number') {
          userCount.value = resp.data.totalCount
        }
      } else {
        statError.value = '后端未返回统计数据'
      }
    } else {
      statError.value = resp?.msg || '获取统计失败'
      console.error('[Dashboard] fetchUserStat non-200/0', resp)
    }
  } catch (err) {
    console.error('fetch user statistic failed', err)
    statError.value = '获取统计失败'
  } finally {
    statLoading.value = false
  }
}

async function fetchRequestStat() {
  requestLoading.value = true
  requestError.value = ''
  try {
    console.log('[Dashboard] fetchRequestStat start')
    const resp = await getRequestStatistic()
    console.log('[Dashboard] fetchRequestStat resp', resp)
    if (resp && (resp.code === 0 || resp.code === 200)) {
      if (resp.data) {
        console.log('[Dashboard] requestStatistic data', resp.data)
        requestStat.value = resp.data
      } else {
        requestError.value = '后端未返回请求统计'
      }
    } else {
      requestError.value = resp?.msg || '获取请求统计失败'
      console.error('[Dashboard] fetchRequestStat non-200/0', resp)
    }
  } catch (err) {
    console.error('fetch request statistic failed', err)
    requestError.value = '获取请求统计失败'
  } finally {
    requestLoading.value = false
  }
}

onMounted(() => {
  // 管理端使用后端统计数据
  fetchCounts()
  fetchUserStat()
  fetchRequestStat()
})
</script>

<template>
  <div>
    <el-row :gutter="20" style="margin-top:20px;">
      <el-col :span="12">
        <el-card class="stat-card">
          <div class="card-title">用户统计</div>
          <div class="stat-top">
            <div class="request-pie-circle" :style="pieStyle">
              <div class="request-pie-center">
                <div class="center-number">{{ pieTotal }}</div>
                <div class="center-label">总用户</div>
              </div>
            </div>
            <div class="legend">
              <div v-for="item in pieData" :key="item.label" class="legend-row">
                <span class="legend-dot" :style="{ background: item.color }"></span>
                <span class="legend-text">{{ item.label }}</span>
                <span class="legend-num">{{ item.value }}</span>
                <span class="legend-percent">{{ formatPercent(item.value) }}</span>
              </div>
              <div v-if="statError" class="legend-row error-text">{{ statError }}</div>
            </div>
          </div>

          <div class="pill-row">
            <div class="pill">
              <span class="pill-label">总用户</span>
              <span class="pill-value">{{ statNumbers.totalCount }}</span>
            </div>
            <div class="pill">
              <span class="pill-label">周活跃</span>
              <span class="pill-value">{{ statNumbers.activeWeekUserCount }}</span>
            </div>
            <div class="pill">
              <span class="pill-label">日活跃</span>
              <span class="pill-value">{{ statNumbers.activeDayUserCount }}</span>
            </div>
          </div>

          <div class="stat-subtitle">按角色</div>
          <div class="list-wrap">
            <div v-if="!roleBars.length" class="muted-text">暂无角色数据</div>
            <div v-for="bar in roleBars" :key="bar.label" class="bar-row">
              <div class="bar-label">{{ bar.label }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${bar.width}%`, background: bar.color }"></div>
              </div>
              <div class="bar-count">{{ bar.count }}</div>
            </div>
          </div>

          <div class="stat-subtitle" style="margin-top:12px;">活跃占比</div>
          <div class="list-wrap">
            <div v-for="bar in activeBars" :key="bar.label" class="bar-row">
              <div class="bar-label">{{ bar.label }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${bar.width}%`, background: bar.color }"></div>
              </div>
              <div class="bar-count">{{ bar.count }}</div>
            </div>
          </div>

          <div v-if="statLoading" class="loading-overlay">加载中...</div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="stat-card">
          <div class="card-title">请求统计</div>
          <div class="stat-top">
            <div class="request-pie-circle" :style="requestPieStyle">
              <div class="request-pie-center">
                <div class="center-number">{{ requestPieTotal }}</div>
                <div class="center-label">请求总量</div>
              </div>
            </div>
            <div class="legend">
              <div v-for="item in requestPieData" :key="item.label" class="legend-row">
                <span class="legend-dot" :style="{ background: item.color }"></span>
                <span class="legend-text">{{ item.label }}</span>
                <span class="legend-num">{{ item.value }}</span>
                <span class="legend-percent">{{ formatPercentBy(requestPieTotal, item.value) }}</span>
              </div>
              <div v-if="!requestPieData.length" class="muted-text">暂无分类数据</div>
            </div>
          </div>

          <div class="pill-row">
            <div class="pill">
              <span class="pill-label">请求总量</span>
              <span class="pill-value">{{ requestNumbers.categoryCount }}</span>
            </div>
            <div class="pill">
              <span class="pill-label">不同 IP</span>
              <span class="pill-value">{{ requestNumbers.differentIpCount }}</span>
            </div>
          </div>
          
          <div class="stat-subtitle">按分类</div>
          <div class="list-wrap">
            <div v-if="!requestCategoryBars.length" class="muted-text">暂无分类数据</div>
            <div v-for="bar in requestCategoryBars" :key="bar.label" class="bar-row">
              <div class="bar-label">{{ bar.label }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${bar.width}%`, background: bar.color }"></div>
              </div>
              <div class="bar-count">{{ bar.count }}</div>
            </div>
          </div>

          <div class="stat-subtitle">按方法</div>
          <div class="list-wrap">
            <div v-if="!requestMethodBars.length" class="muted-text">暂无方法数据</div>
            <div v-for="bar in requestMethodBars" :key="bar.label" class="bar-row">
              <div class="bar-label">{{ bar.label }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${bar.width}%`, background: bar.color }"></div>
              </div>
              <div class="bar-count">{{ bar.count }}</div>
            </div>
          </div>

          <div v-if="requestError" class="legend-row error-text" style="margin-top:8px;">{{ requestError }}</div>
          <div v-if="requestLoading" class="loading-overlay">加载中...</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.card-title {
  font-size: 18px;
  color: #2c3e50;
}

.card-number {
  font-size: 28px;
  margin-top: 8px;
}

.dual-card {
  position: relative;
}

.dual-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dual-pane {
  position: relative;
}

.card-subtitle {
  font-size: 15px;
  color: #4a5666;
  margin-bottom: 8px;
}

.pie-card {
  position: relative;
  min-height: 260px;
}

.pie-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.pie-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: #f5f7fa;
}

.pie-center {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px #eef0f3;
}

.center-number {
  font-size: 20px;
  font-weight: 600;
}

.center-label {
  color: #888;
  font-size: 12px;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.legend-row {
  display: grid;
  grid-template-columns: 16px 1fr auto auto;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: #333;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-text {
  color: #555;
}

.legend-num {
  font-weight: 600;
}

.legend-percent {
  color: #888;
}

.legend-row.muted {
  grid-template-columns: 1fr auto;
  color: #666;
}

.legend-row.error-text {
  grid-template-columns: 1fr;
  color: #c45656;
}

.stat-box {
  background: #f6f8fb;
  border-radius: 10px;
  padding: 12px;
  margin-top: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-number {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 600;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.legend-role {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.request-card {
  position: relative;
  min-height: 220px;
}

.stat-card {
  position: relative;
  min-height: 220px;
}

.stat-top {
  display: flex;
  gap: 16px;
  align-items: center;
}

.request-pie-wrap {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 12px;
}

.request-pie-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: #f5f7fa;
}

.request-pie-center {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px #eef0f3;
}

.pill-row {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.pill {
  flex: 1;
  background: #f6f8fb;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #2c3e50;
  box-shadow: inset 0 0 0 1px #edf1f7;
}

.pill-label {
  font-size: 13px;
  color: #6a7a92;
}

.pill-value {
  font-weight: 700;
  font-size: 18px;
}

.stat-subtitle {
  margin-top: 12px;
  font-size: 14px;
  color: #444;
}

.list-wrap {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.muted-text {
  color: #888;
  font-size: 13px;
}

.bar-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.bar-label {
  font-size: 14px;
  color: #344050;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  width: 100%;
  height: 10px;
  background: #eef1f5;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.bar-count {
  font-weight: 600;
  color: #2c3e50;
  min-width: 48px;
  text-align: right;
}
</style>
