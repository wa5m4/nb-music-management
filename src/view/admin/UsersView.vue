<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, getUserFigureStatistic } from '../../services/api'

const users = ref<any[]>([])
// 管理端始终使用后端数据
const useApi = true

async function fetchUsers(page = 1, pageSize = 50) {
  try {
    const resp = await getUserList({ pageNum: page, pageSize })
    const records = resp?.data?.data?.records || []
    // 仅当用户名为 'admin' 时显示管理员，其余一律视为普通用户
    users.value = (records as any[]).map((r: any) => ({ id: r.id, username: r.username ?? r.name, email: r.email, sex: r.sex ?? null, role: (r.username === 'admin') ? '管理员' : '用户' }))
  } catch (err) {
    ElMessage.error('获取用户列表失败')
    console.error(err)
  }
}

const dialogVisible = ref(false)
const editing = ref(null)
const form = reactive({ id: null, username: '', email: '', sex: '' })

function openAdd() {
  editing.value = null
  form.id = null
  form.username = ''
  form.email = ''
  form.sex = ''
  dialogVisible.value = true
}

function openEdit(row: any) {
  editing.value = row.id
  form.id = row.id
  form.username = row.username
  form.email = row.email
  form.sex = row.sex ?? ''
  dialogVisible.value = true
}

async function saveUser() {
  // 根据后端文档，username 为必需项，email 可选
  if (!form.username) { ElMessage.warning('请填写用户名'); return }
  try {
    if (editing.value) {
      // 更新时提交性别（username/email 保留以兼容后端要求）
      await updateUser((form.id as any), { username: form.username, email: form.email, sex: form.sex })
      ElMessage.success('用户更新成功')
    } else {
      // 新建时提交 username/email/sex（年龄字段已移除）
      await createUser({ username: form.username, email: form.email, sex: form.sex })
      ElMessage.success('用户添加成功')
    }
    dialogVisible.value = false
    if (useApi) await fetchUsers()
  } catch (err) {
    console.error(err)
    ElMessage.error('操作失败，请稍后重试')
  }
}

function remove(row: any) {
  ElMessageBox.confirm(`确认删除 ${row.username}？`, '删除', { type: 'warning' })
    .then(async () => {
      try {
        const resp = await deleteUser(row.id)
        const code = resp?.data?.code
        if (code === 0 || code === 200 || resp.status === 200) {
          ElMessage.success(resp?.data?.msg || '删除成功')
          if (useApi) await fetchUsers()
        } else {
          ElMessage.error(resp?.data?.msg || '删除失败')
        }
      } catch (err) {
        console.error(err)
        ElMessage.error('删除失败')
      }
    })
    .catch(()=>{})
}

onMounted(() => {
  if (useApi) fetchUsers()
})

// ========== 用户画像（饼图） ==========
const figureDialogVisible = ref(false)
const figureLoading = ref(false)
const figureUser = ref<any>(null)
const figureData = ref<any>(null)

const palette = ['#5B8FF9', '#61DDAA', '#F6BD16', '#F6903D', '#6E8BFF', '#7C89A1', '#A3AED0']

const musicLoveData = computed(() => {
  const data = (figureData.value?.musiclove ?? figureData.value?.musicLove ?? []) as any[]
  return data.map((item: any, idx: number) => ({
    label: item?.name ?? item?.musicName ?? item?.title ?? '未知',
    value: Number(item?.love_count ?? item?.count ?? item?.value ?? 0),
    color: palette[idx % palette.length]
  }))
})

const typeLoveData = computed(() => {
  const data = (figureData.value?.typeLove ?? figureData.value?.typelove ?? []) as any[]
  return data.map((item: any, idx: number) => ({
    label: item?.type ?? item?.name ?? '未知',
    value: Number(item?.love_count ?? item?.count ?? item?.value ?? 0),
    color: palette[idx % palette.length]
  }))
})

const musicLoveTotal = computed(() => musicLoveData.value.reduce((sum: number, i: any) => sum + Number(i.value || 0), 0))
const typeLoveTotal = computed(() => typeLoveData.value.reduce((sum: number, i: any) => sum + Number(i.value || 0), 0))

const musicPieSegments = computed(() => {
  const total = musicLoveTotal.value; if (!total) return [] as string[]
  let cursor = 0
  return musicLoveData.value.map((it: any) => {
    const angle = (it.value / total) * 360
    const start = cursor
    const end = start + angle
    cursor = end
    return `${it.color} ${start}deg ${end}deg`
  })
})

const musicPieStyle = computed(() => {
  if (!musicPieSegments.value.length) return { background: '#f5f7fa' }
  let maxDeg = 0
  musicPieSegments.value.forEach((seg: string) => { const end = parseFloat(seg.split(' ')[2]) || 0; if (end > maxDeg) maxDeg = end })
  const gap = maxDeg < 360 ? `, #f5f7fa ${maxDeg}deg 360deg` : ''
  return { background: `conic-gradient(${musicPieSegments.value.join(', ')}${gap})` }
})

const typePieSegments = computed(() => {
  const total = typeLoveTotal.value; if (!total) return [] as string[]
  let cursor = 0
  return typeLoveData.value.map((it: any) => {
    const angle = (it.value / total) * 360
    const start = cursor
    const end = start + angle
    cursor = end
    return `${it.color} ${start}deg ${end}deg`
  })
})

const typePieStyle = computed(() => {
  if (!typePieSegments.value.length) return { background: '#f5f7fa' }
  let maxDeg = 0
  typePieSegments.value.forEach((seg: string) => { const end = parseFloat(seg.split(' ')[2]) || 0; if (end > maxDeg) maxDeg = end })
  const gap = maxDeg < 360 ? `, #f5f7fa ${maxDeg}deg 360deg` : ''
  return { background: `conic-gradient(${typePieSegments.value.join(', ')}${gap})` }
})

function formatPercent(value: number, total: number) {
  if (!total) return '0%'
  const p = (value / total) * 100
  return `${p.toFixed(1)}%`
}

async function openFigure(row: any) {
  figureUser.value = row
  figureDialogVisible.value = true
  figureLoading.value = true
  try {
    const resp = await getUserFigureStatistic({ userId: row.id })
    if (resp && (resp.code === 0 || resp.code === 200)) {
      figureData.value = resp.data || null
    } else {
      figureData.value = null
      ElMessage.error(resp?.msg || '获取用户画像失败')
    }
  } catch (e) {
    figureData.value = null
    ElMessage.error('获取用户画像失败')
  } finally {
    figureLoading.value = false
  }
}
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
      <h3>用户管理</h3>
      <el-button type="primary" @click="openAdd">添加用户</el-button>
    </div>

    <el-table :data="users" stripe style="width:100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      
      <el-table-column label="性别" width="80">
        <template #default="{ row }">
          {{ row.sex === 1 || row.sex === '1' ? '男' : (row.sex === 0 || row.sex === '0' ? '女' : '') }}
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色" width="120" />
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="() => openEdit(row)">编辑</el-button>
          <el-button type="text" size="small" @click="() => remove(row)">删除</el-button>
          <el-button type="text" size="small" @click="() => openFigure(row)">画像</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="用户信息">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" :disabled="editing" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" :disabled="editing" />
        </el-form-item>
        
        <el-form-item label="性别">
          <el-select v-model="form.sex" placeholder="请选择">
            <el-option label="男" value="1" />
            <el-option label="女" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <div>{{ form.username === 'admin' ? '管理员' : '用户' }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>

  <el-dialog v-model="figureDialogVisible" :title="figureUser ? `用户画像 - ${figureUser.username}` : '用户画像'" width="800px">
    <div v-if="figureLoading" style="text-align:center;padding:20px;color:#909399">加载中...</div>
    <div v-else>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="stat-card">
            <div class="card-title">喜爱歌曲</div>
            <div class="pie-wrap">
              <div class="pie-circle" :style="musicPieStyle">
                <div class="pie-center">
                  <div class="center-number">{{ musicLoveTotal }}</div>
                  <div class="center-label">次</div>
                </div>
              </div>
              <div class="legend">
                <div v-if="!musicLoveData.length" class="muted-text">暂无数据</div>
                <div v-for="item in musicLoveData" :key="item.label" class="legend-row">
                  <span class="legend-dot" :style="{ background: item.color }"></span>
                  <span class="legend-text">{{ item.label }}</span>
                  <span class="legend-num">{{ item.value }}</span>
                  <span class="legend-percent">{{ formatPercent(item.value, musicLoveTotal) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="stat-card">
            <div class="card-title">喜爱类型</div>
            <div class="pie-wrap">
              <div class="pie-circle" :style="typePieStyle">
                <div class="pie-center">
                  <div class="center-number">{{ typeLoveTotal }}</div>
                  <div class="center-label">次</div>
                </div>
              </div>
              <div class="legend">
                <div v-if="!typeLoveData.length" class="muted-text">暂无数据</div>
                <div v-for="item in typeLoveData" :key="item.label" class="legend-row">
                  <span class="legend-dot" :style="{ background: item.color }"></span>
                  <span class="legend-text">{{ item.label }}</span>
                  <span class="legend-num">{{ item.value }}</span>
                  <span class="legend-percent">{{ formatPercent(item.value, typeLoveTotal) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    <template #footer>
      <el-button @click="figureDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.stat-card { border: 1px solid #ebeef5; }
.card-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
.pie-wrap { display: flex; gap: 16px; align-items: center; }
.pie-circle { width: 130px; height: 130px; border-radius: 50%; box-shadow: inset 0 0 0 10px #fff; position: relative; display:flex;align-items:center;justify-content:center; }
.pie-center { position:absolute; width:84px; height:84px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.center-number { font-size: 20px; font-weight: 700; }
.center-label { font-size: 12px; color: #909399; }
.legend { flex:1; display:flex; flex-direction:column; gap:8px; max-height:140px; overflow:auto; }
.legend-row { display:flex; align-items:center; gap:8px; font-size:12px; color:#606266; }
.legend-dot { width:10px; height:10px; border-radius:3px; display:inline-block; }
.legend-text { min-width: 48px; }
.legend-num { margin-left:auto; font-weight:600; }
.legend-percent { min-width:44px; text-align:right; color:#909399; }
.muted-text { color:#909399; text-align:center; padding:16px 0; }
</style>
