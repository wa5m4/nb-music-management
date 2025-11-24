<template>
  <div v-if="visible" class="ad-banner" :class="{ 'has-image': ad.picture }">
    <img v-if="ad.picture" :src="ad.picture" alt="ad" class="ad-img"/>
    <div class="ad-body">
      <div class="ad-content" v-html="ad.content"></div>
      <button class="ad-close" @click="close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'

const visible = ref(false)
const ad = reactive({ content: '', picture: '', duration: 5 })
let ws: WebSocket | null = null
let hideTimer: any = null
let reconnectTimer: any = null
let reconnectAttempts = 0
let pollingTimer: any = null
const wsConnected = ref(false)

let authStore: any = null
try {
  authStore = useAuthStore()
} catch (e) {
  authStore = null
}

let currentTarget = ''
let stopAuthWatch: any = null

// 持久化广告数组（localStorage key: 'ads'）
function persistAds(arr: Array<any>) {
  try {
    localStorage.setItem('ads', JSON.stringify(arr))
  } catch (e) { console.warn('[AdBanner] persistAds failed', e) }
}

// 入队一条广告并持久化、派发事件
const queue: Array<any> = []
let showing = false

function enqueueAd(payload: any) {
  const item = {
    content: payload.content || '',
    picture: payload.picture || '',
    duration: Number(payload.duration) || 5,
    timestamp: payload.timestamp || Date.now()
  }

  queue.push(item)

  // 保存到本地历史列表（追加）
  try {
    const raw = localStorage.getItem('ads')
    const arr = raw ? JSON.parse(raw) : []
    arr.push(item)
    persistAds(arr)
  } catch (e) { console.warn('[AdBanner] append ads failed', e) }

  // 派发事件，通知 layout 更新（使用 'ads:received' 事件）
  try {
    if (typeof window !== 'undefined') {
      // 仅使用 'ads:received' 作为统一事件，避免重复触发处理逻辑
      window.dispatchEvent(new CustomEvent('ads:received', { detail: item }))
    }
  } catch (e) { console.warn('[AdBanner] dispatch ads:received failed', e) }

  if (!showing) processQueue()
}

function processQueue() {
  if (queue.length === 0) {
    showing = false
    return
  }
  showing = true
  const next = queue.shift()
  ad.content = next.content || ''
  ad.picture = next.picture || ''
  ad.duration = Number(next.duration) || 5

  // 展示并在结束后继续处理队列
  clearTimeout(hideTimer)
  visible.value = true
  hideTimer = setTimeout(() => {
    visible.value = false
    setTimeout(() => { processQueue() }, 300)
  }, ad.duration * 1000)
}

function close() {
  visible.value = false
  clearTimeout(hideTimer)
}

function connect() {
  // 使用 services/api.ts 中配置的 baseURL（优先），回退到 window.location
  // 优先使用用户 id 作为订阅目标（若存在），否则回退到 'all'
  let userId = ''
  try {
    if (authStore && authStore.user) {
      // authStore.user 在 Pinia 中可能是 ref 或 proxy，兼容读取方式
      userId = (authStore.user as any)?.id || (authStore.user as any) || ''
    }
  } catch (e) { userId = '' }
  // 优先使用手动设置的 currentTarget（例如发生回退时），否则使用当前 userId；
  // 若两者都不存在，回退到固定频道 '1'
  const target = currentTarget || (userId ? String(userId) : '1')
  // 如果目标没有变化，保持现有连接（但仍允许重建以修复断线）
  // 在建立新连接前，如果已有 ws 存在且目标不同，先关闭旧连接
  if (ws && currentTarget && currentTarget !== target) {
    try { ws.close() } catch (_) {}
    ws = null
  }
  currentTarget = target
  let baseHost = window.location.hostname || 'localhost'
  let basePort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
  let baseProto = window.location.protocol.replace(':', '')
  try {
    if (api.defaults.baseURL) {
      const base = new URL(api.defaults.baseURL)
      baseHost = base.hostname
      basePort = base.port || (base.protocol === 'https:' ? '443' : '80')
      baseProto = base.protocol.replace(':', '')
    }
  } catch (e) {
    // ignore, use window.location
  }
  // 如果后端协议为 http/https，则 websocket 使用 ws/wss
  const proto = baseProto === 'https' ? 'wss' : 'ws'
  const url = `${proto}://${baseHost}:${basePort}/ad/${target}`

  console.info('[AdBanner] connect() building ws url', { url, target, baseURL: api?.defaults?.baseURL })

    try {
    // 如果已有未关闭的 socket，先关闭它，避免重复连接
    try { if (ws) { ws.close(); ws = null } } catch (_) {}
    ws = new WebSocket(url)
    ws.onopen = () => {
      reconnectAttempts = 0
      wsConnected.value = true
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      // 如果轮询在进行，停止轮询
      if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
    }
    // 直接把收到的消息转换为文本或 JSON 后直接入队显示（移除所有格式检查与 fetch 回退）
    ws.onmessage = async (evt) => {
      try {
        let raw = evt.data
        let text: string | null = null
        if (typeof raw === 'string') {
          text = raw
        } else if (raw instanceof Blob) {
          try { text = await raw.text() } catch (e) { text = null }
        } else if (raw instanceof ArrayBuffer) {
          try { text = new TextDecoder().decode(new Uint8Array(raw)) } catch (e) { text = null }
        } else {
          try { text = JSON.stringify(raw) } catch (e) { text = String(raw) }
        }

        if (!text) return

        // 尝试解析成对象，如果失败就把文本作为 content
        let obj: any = null
        try { obj = JSON.parse(text) } catch (_) { obj = null }

        const item = {
          content: (obj && obj.content) ? obj.content : (obj ? JSON.stringify(obj) : text),
          picture: (obj && obj.picture) ? obj.picture : '',
          duration: Number((obj && obj.duration) || 5),
          timestamp: (obj && obj.timestamp) ? obj.timestamp : Date.now()
        }

        enqueueAd(item)
      } catch (e) {
        // 保持容错：解析错误不影响主流程
      }
    }
    ws.onclose = () => {
      wsConnected.value = false
      // 如果当前不是退回到 channel '1'，优先尝试退回到 '1' 进行重连一次
      if (currentTarget !== '1') {
        // 尝试回退到 channel '1' 并重连
        try { if (ws) { ws.close(); ws = null } } catch (_) {}
        currentTarget = '1'
        // 立即尝试连接到 channel '1'
        setTimeout(() => { try { connect() } catch (e) { scheduleReconnect() } }, 200)
        return
      }
      // 否则使用指数退避重连
      scheduleReconnect()
      startPollingFallback()
    }
    ws.onerror = () => {
      wsConnected.value = false
      try { ws?.close() } catch (_) {}
      // 遇到错误时，若尚未回退到 '1'，先回退并尝试一次连接
      if (currentTarget !== '1') {
        currentTarget = '1'
        setTimeout(() => { try { connect() } catch (err) { scheduleReconnect() } }, 200)
        return
      }
      // 否则按照正常策略重试
      scheduleReconnect()
    }
  } catch (e) {
    // 连接失败：按既有策略重试
    // 如果第一次连接失败且当前目标不是 '1'，先尝试回退到 '1' 并重新连一次
    if (currentTarget !== '1') {
      console.info('[AdBanner] connect failed, fallback to channel 1 and reconnect')
      currentTarget = '1'
      try { if (ws) { ws.close(); ws = null } } catch (_) {}
      try { connect(); return } catch (_) { /* fallthrough */ }
    }
    scheduleReconnect()
    // 仅当 api.defaults.baseURL 与页面同源时启用轮询回退，避免触发 CORS
    try {
      if (api.defaults.baseURL) {
        const base = new URL(api.defaults.baseURL)
        if (base.origin === window.location.origin) {
          startPollingFallback()
        } else {
          console.warn('[AdBanner] backend origin differs from page origin; polling disabled to avoid CORS. Configure Vite proxy or enable CORS on backend.')
        }
      } else {
        console.warn('[AdBanner] api.defaults.baseURL not set; polling disabled')
      }
    } catch (err) {
      // 若解析失败，不启用轮询
      console.warn('[AdBanner] cannot parse api.baseURL; polling disabled')
    }
  }
}

function scheduleReconnect() {
  reconnectAttempts += 1
  const delay = Math.min(30000, 1000 * Math.pow(1.5, reconnectAttempts))
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    connect()
  }, delay)
}

function startPollingFallback() {
  // 如果已经在轮询，就不要重复启动
  if (pollingTimer) return
  // 立即尝试一次，再每 30s 一次
  (async () => { await tryFetchCurrentAd() })()
  pollingTimer = setInterval(async () => { await tryFetchCurrentAd() }, 30000)
}

async function tryFetchCurrentAd() {
  try {
    // 通过 api 实例发起请求（会使用 api.defaults.baseURL）
    const resp = await api.get('/ad/current')
    if (resp?.data && (resp.data.code === 0 || resp.data.code === 200) && resp.data.data) {
      const payload = resp.data.data
      enqueueAd(payload)
    }
  } catch (e) {
    // 没有 /ad/current 接口或请求失败时，打印必要调试信息以定位问题（404/CORS 等）
    try {
      const err: any = e
      const status = err?.response?.status
      const reqUrl = err?.response?.config?.url || (api?.defaults?.baseURL ? new URL(api.defaults.baseURL + '/ad/current').toString() : '/ad/current')
      console.warn('[AdBanner] polling failed', { status, url: reqUrl, message: err?.message || err })
    } catch (err2) {
      // 如果上面的调试打印也失败，回退到简单打印
      console.warn('[AdBanner] polling failed (unknown)', e)
    }
  }
}

onMounted(() => {
  // 仅建立连接；不在 mount 时自动展示已缓存的通知/广告
  // mounted: 建立连接
  connect()

  // 如果 authStore 可用，监听 user 变化以便在登录/切换用户时重新订阅到 /ad/{userId}
  try {
    if (authStore && typeof watch === 'function') {
      stopAuthWatch = watch(() => (authStore as any).user, (newVal, oldVal) => {
        try {
          const newId = newVal ? ((newVal as any).id || newVal) : ''
          const oldId = oldVal ? ((oldVal as any).id || oldVal) : ''
          if (String(newId) !== String(oldId)) {
            // 立即重建连接以订阅新的 userId
            try { if (ws) { ws.close(); ws = null } } catch (_) {}
            currentTarget = ''
            connect()
          }
        } catch (e) { /* ignore */ }
      })
    }
  } catch (e) { /* ignore */ }
})

onBeforeUnmount(() => {
  if (ws) {
    try { ws.close() } catch (_) {}
    ws = null
  }
  if (hideTimer) clearTimeout(hideTimer)
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
  if (stopAuthWatch) {
    try { stopAuthWatch(); stopAuthWatch = null } catch (e) { /* ignore */ }
  }
  try {
    if (typeof window !== 'undefined') {
      // 清理调试接口（若存在）
    }
  } catch (e) { /* ignore */ }
  // nothing special to cleanup for simulation
})
</script>

<style scoped>
.ad-banner {
  position: fixed;
  right: 16px;
  top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  z-index: 9999;
  max-width: min(80vw, 640px);
  overflow: hidden;
}
.ad-banner.has-image { padding: 12px; }
.ad-img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}
.ad-body {
  display:flex;
  align-items:flex-start;
  gap:8px;
  min-width: 0;
}
.ad-content {
  color: #111;
  line-height: 1.4;
  max-width: 44ch;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ad-close {
  margin-left: 8px;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
}
</style>
