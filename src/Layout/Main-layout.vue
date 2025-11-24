<!-- App.vue -->
<script setup lang="ts">
import Navigation from '../components/Navigation.vue'
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import AdBanner from '../components/AdBanner.vue'
import { useAuthStore } from '../store/auth';
import { useRoute } from 'vue-router';
import { computed, ref, reactive, onMounted } from 'vue';

const store = useAuthStore();
const route = useRoute();

const showLoginModal = computed(() => {
  return route.path.startsWith('/login') && !store.isLogin;
});

// 信封弹窗状态与数据（支持多条通知）
const adInboxVisible = ref(false)
const adList = ref<Array<any>>([])
const adUnread = ref(false)
// 选中项映射（用于批量删除，使用 timestamp 作为标识）
const selectedMap = reactive<Record<string, boolean>>({})
const selectedCount = computed(() => Object.keys(selectedMap).filter(k => selectedMap[k]).length)
// 开屏团队介绍弹窗（内容由后续填写）
const teamIntroVisible = ref(false)
const teamIntroDontShow = ref(false)

function closeTeamIntro() {
  try {
    if (teamIntroDontShow.value) {
      try { localStorage.setItem('teamIntroSeen', '1') } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
  teamIntroVisible.value = false
}

onMounted(() => {
  try {
    const seen = localStorage.getItem('teamIntroSeen')
    if (!seen) {
      teamIntroVisible.value = true
    }
  } catch (e) { /* ignore */ }
})

function markAdRead(timestamp?: number) {
  try {
    if (timestamp) localStorage.setItem('lastAdRead', String(timestamp))
    else {
      // 如果存在 lastAd，则把其 timestamp 作为已读标记
      // 把当前 ads 中最新一条的 timestamp 作为已读标记
      const raw = localStorage.getItem('ads')
      if (raw) {
        try {
          const arr = JSON.parse(raw)
          if (Array.isArray(arr) && arr.length > 0) {
            const latest = arr[arr.length - 1]
            if (latest && latest.timestamp) localStorage.setItem('lastAdRead', String(latest.timestamp))
          }
        } catch (e) { /* ignore */ }
      }
    }
  } catch (e) { /* ignore */ }
  adUnread.value = false
}

function openAdInbox() {
  try {
    const raw = localStorage.getItem('ads')
    if (raw) {
      try {
        const arr = JSON.parse(raw)
        // 展示最近的若干条（按时间顺序，最新在顶部）
        adList.value = Array.isArray(arr) ? arr.slice().reverse() : []
        // 初始化选中映射
        try {
          for (const k in selectedMap) { try { delete selectedMap[k] } catch(e){} }
          if (Array.isArray(adList.value)) {
            adList.value.forEach((it: any) => { try { selectedMap[String(it.timestamp)] = false } catch(e){} })
          }
        } catch(e) {}
      } catch (e) { adList.value = [] }
    } else adList.value = []
  } catch (e) {
    console.warn('read lastAd failed', e)
    adList.value = []
  }
  adInboxVisible.value = true
  // 打开时标记为已读
  try {
    // 标记所有已读（把 lastAdRead 设置为最新条 timestamp）
    markAdRead()
  } catch (e) { /* ignore */ }
}

function deleteItem(item: any) {
  try {
    const raw = localStorage.getItem('ads')
    const arr = raw ? JSON.parse(raw) : []
    const filtered = Array.isArray(arr) ? arr.filter((it: any) => it.timestamp !== item.timestamp) : []
    localStorage.setItem('ads', JSON.stringify(filtered))
    adList.value = adList.value.filter((it: any) => it.timestamp !== item.timestamp)
    // 如果删除的项在 selectedMap 中，移除
    try { delete selectedMap[String(item.timestamp)] } catch (e) { /* ignore */ }
    // 更新未读标记
    try { const raw2 = localStorage.getItem('ads'); const arr2 = raw2 ? JSON.parse(raw2) : []; const latestTs = arr2 && arr2.length ? arr2[arr2.length-1]?.timestamp : null; const read = localStorage.getItem('lastAdRead'); adUnread.value = !!(latestTs && (!read || Number(read) < Number(latestTs))) } catch(e){}
  } catch (e) { /* ignore */ }
}

function deleteSelected() {
  try {
    const toDelete = Object.keys(selectedMap).filter(k => selectedMap[k]).map(k => Number(k))
    if (!toDelete || toDelete.length === 0) return
    const raw = localStorage.getItem('ads')
    const arr = raw ? JSON.parse(raw) : []
    const filtered = Array.isArray(arr) ? arr.filter((it: any) => !toDelete.includes(it.timestamp)) : []
    localStorage.setItem('ads', JSON.stringify(filtered))
    adList.value = adList.value.filter((it: any) => !toDelete.includes(it.timestamp))
    // 清空选中 map
    for (const k of toDelete.map(String)) { try { delete selectedMap[k] } catch(e){} }
    // 更新未读标记
    try { const read = localStorage.getItem('lastAdRead'); const latestTs = filtered && filtered.length ? filtered[filtered.length-1]?.timestamp : null; adUnread.value = !!(latestTs && (!read || Number(read) < Number(latestTs))) } catch(e){}
  } catch (e) { /* ignore */ }
}

function clearAll() {
  try {
    localStorage.removeItem('ads')
    adList.value = []
    // 清空选中映射
    for (const k in selectedMap) { try { delete selectedMap[k] } catch(e){} }
    adUnread.value = false
  } catch (e) { /* ignore */ }
}

// 初始化未读状态并监听 storage 事件（跨 tab 更新）以及同页的自定义事件
if (typeof window !== 'undefined') {
  try {
    const computeUnread = () => {
      try {
        const raw = localStorage.getItem('ads')
        const read = localStorage.getItem('lastAdRead')
        if (!raw) { adUnread.value = false; return }
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr) || arr.length === 0) { adUnread.value = false; return }
        const latestTs = arr[arr.length - 1]?.timestamp || null
        adUnread.value = !!(latestTs && (!read || Number(read) < Number(latestTs)))
      } catch (e) { adUnread.value = false }
    }
    computeUnread()
    window.addEventListener('storage', computeUnread)
    // 监听同页的通知事件（AdBanner 会 dispatch 'ads:received'）
    const onAdReceived = (ev: any) => {
      try {
        const detail = ev?.detail
        if (detail) {
          // AdBanner 已负责写入 localStorage；这里仅更新 UI 状态与未读标记
          adUnread.value = true
          // 如果弹窗已打开，刷新列表以显示最新消息
          if (adInboxVisible.value) {
            try { openAdInbox() } catch (e) { /* ignore */ }
          }
        } else {
          computeUnread()
        }
      } catch (e) { /* ignore */ }
    }
    // 仅监听新增的 'ads:received' 事件，避免重复处理（AdBanner 只派发该事件）
    window.addEventListener('ads:received', onAdReceived)
  } catch (e) { /* ignore */ }
}

// 将 safeLogout 放到 <script setup> 中，让模板可以访问到它
function safeLogout() {
  try {
    // 关闭全局 websocket（如存在）
    try { if ((window as any).__adWs && (window as any).__adWs.close) { (window as any).__adWs.close(); } } catch (e) { /* ignore */ }
    // 保留本地广告历史与已读标记，登出后不清除，以便重新登录后仍能查看历史
    // 调用登录状态管理登出
    try { store.logout() } catch (e) { console.warn('logout failed', e) }
  } catch (e) { console.warn('safeLogout error', e) }
}
</script>

<template>
  <div class="common-layout" :class="{'blur-content': showLoginModal}">
    <el-container>
      <el-header>
        <Header></Header>
      </el-header>
      <el-container>
        <el-aside width="200px" class="fixed-aside">
          <Navigation />
        </el-aside>
        <el-container class="main-content">
          <el-main>
            <RouterView/>
          </el-main>
          <el-footer>
            <Footer></Footer>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
      <teleport to="body">
        <AdBanner />
        <!-- 通知信封入口（固定右上角） -->
        <div class="ad-envelope" @click="openAdInbox" title="查看通知"
             style="position:fixed; right:18px; top:14px; z-index:30000; width:44px; height:44px; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg,#fff,#f3f4f6); border-radius:50%; box-shadow:0 6px 22px rgba(0,0,0,0.18); cursor:pointer; font-size:18px;">
          📩
          <span v-if="adUnread" class="ad-badge" style="position:absolute; right:6px; top:6px; width:10px; height:10px; background:#ff4d4f; border-radius:50%; box-shadow:0 0 0 2px rgba(255,77,79,0.12);"></span>
        </div>
        <!-- 安全退出按钮（右下角） -->
        <div v-if="store.isLogin" class="safe-logout-btn" @click="safeLogout" title="安全退出">
          🔒
        </div>
        <el-dialog v-model="adInboxVisible" title="通知" width="520px">
        <!-- 操作按钮放在消息列表上方 -->
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
          <el-button type="danger" @click="deleteSelected" :disabled="selectedCount===0">删除选中</el-button>
          <el-button type="warning" @click="clearAll" :disabled="!adList || adList.length===0">清空所有</el-button>
          <el-button type="text" @click="openAdInbox">刷新列表</el-button>
        </div>
        <div v-if="adList && adList.length">
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div v-for="(item, idx) in adList" :key="item.timestamp + '_' + idx" style="display:flex;gap:12px;align-items:flex-start;padding:8px;border-bottom:1px solid #f0f0f0;">
              <div style="display:flex;align-items:flex-start;margin-top:6px;">
                <el-checkbox v-model="selectedMap[item.timestamp]" />
              </div>
              <img v-if="item.picture" :src="item.picture" alt="ad" style="width:120px;height:120px;object-fit:cover;border-radius:6px;border:1px solid #e6e6e6" />
              <div style="flex:1;word-break:break-word;">
                <div v-html="item.content" style="color:#111;line-height:1.6"></div>
                <div style="margin-top:8px;color:#666">时长：{{ item.duration }} 秒</div>
                <div style="margin-top:6px;color:#999;font-size:12px" v-if="item.timestamp">发送时间：{{ new Date(item.timestamp).toLocaleString() }}</div>
                <div style="margin-top:8px;text-align:right;">
                  <el-button type="text" @click="deleteItem(item)" style="color:#ff4d4f">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else style="color:#666">暂未收到通知</div>
        <template #footer>
          <el-button @click="adInboxVisible = false">关闭</el-button>
        </template>
        </el-dialog>
        <!-- 开屏团队介绍弹窗（首次打开显示，可选择不再显示） -->
        <el-dialog v-model="teamIntroVisible" title="关于我们" width="640px">
          <div style="min-height:120px;">
            <!-- 占位：团队介绍内容由用户后续填写 -->
            <div style="color:#333">
              项目名称：NB Music Management
              <div style="margin-top:8px;">
                这是一个基于 Vue 3 的音乐管理系统，提供用户注册、登录、音乐播放、上传、管理等功能。
              </div>
              我们致力于为用户打造一个简洁高效的音乐管理平台，欢迎大家使用和反馈意见！
              以下是团队构成：
                <div style="margin-top:8px;">
                  项目负责人：战神政政
                </div>
                <div style="margin-top:8px;">
                  项目成员：
                  <ul style="margin-top:4px;">
                    <li>战神政政（项目负责人）</li>
                    <li>key 佐助（前端开发）</li>
                    <li>战神政政（后端开发）</li>
                    <li>战神政政（数据库管理员）</li>
                  </ul>
                </div>
              感谢大家的支持与关注！投资合作请联系战神政政。QQ：114514
            </div>
          </div>
          <template #footer>
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
              <div style="display:flex;align-items:center;gap:8px">
                <el-checkbox v-model="teamIntroDontShow">下次不再显示</el-checkbox>
              </div>
              <div>
                <el-button @click="teamIntroVisible = false">关闭</el-button>
                <el-button type="primary" @click="closeTeamIntro" style="margin-left:8px">确定</el-button>
              </div>
            </div>
          </template>
        </el-dialog>
      </teleport>
  </div>

  <div v-if="showLoginModal" class="login-modal-overlay">
    <RouterView />
  </div>
</template>

<style scoped>
.common-layout{
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  transition: filter 0.3s ease;
}

.blur-content{
  filter: blur(5px);
  pointer-events: none;
}

/* 固定导航栏样式 */
.fixed-aside {
  position: fixed;
  top: 60px; /* 头部高度 */
  left: 0;
  height: calc(100vh - 60px); /* 视口高度减去头部高度 */
  z-index: 100;
  overflow-y: auto; /* 如果导航栏内容过多，允许滚动 */
}

/* 主内容区域样式调整 */
.main-content {
  margin-left: 200px; /* 为固定导航栏留出空间 */
  width: calc(100% - 200px);
}

/* 登录模态框遮罩层 */
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3); /* 半透明黑色背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 信封按钮样式（放在 scoped 中，确保出现在页面最上层） */
.ad-envelope {
  position: fixed;
  right: 18px;
  top: 14px;
  z-index: 3000;
  width: 44px;
  height: 44px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(180deg,#fff,#f3f4f6);
  border-radius: 50%;
  box-shadow: 0 6px 22px rgba(0,0,0,0.18);
  cursor: pointer;
  font-size: 18px;
}
.ad-envelope:hover { transform: translateY(-2px); }
/* 未读角标 */
.ad-envelope { position: relative; }
.ad-badge {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 10px;
  height: 10px;
  background: #ff4d4f;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255,77,79,0.12);
}

/* 安全退出按钮（右下角） */
.safe-logout-btn {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 30000;
  width: 48px;
  height: 48px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(180deg,#fff,#f7f8fa);
  border-radius: 50%;
  box-shadow: 0 8px 26px rgba(0,0,0,0.18);
  cursor: pointer;
  font-size: 18px;
}
.safe-logout-btn:hover { transform: translateY(-2px); }
</style>
<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
}

a{
  text-decoration: none;      
}
</style>

/* Layout adjustments for Element Plus containers */
.common-layout >>> .el-container {
  height: 100%;
}

.common-layout >>> .el-container > .el-container {
  display: flex;
  flex: 1 1 auto;
}

common-layout >>> .el-main {
  flex: 1 1 auto;
  overflow: auto;
}