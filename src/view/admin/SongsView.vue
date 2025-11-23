<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMusicList, createMusic, updateMusic, deleteMusic } from '../../services/api'

const songs = ref([])
// 管理端始终使用后端数据（不再依赖本地 mock）
const useApi = true

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

/**
 * 解析后端返回的歌曲名格式，例如：
 * "Noble Music Project - 贝多芬 《月光奏鸣曲》第一乐章, 作品27-2"
 * 若匹配 "artist - title" 模式，则返回拆分后的 artist 和 title；否则返回原始 title，artist 不变。
 */
function parseSongDisplay(name, fallbackArtist) {
  const raw = (name || '').toString().trim()
  // 先去除控制字符和多余空白
  const cleaned = raw.replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim()
  const m = cleaned.match(/^(.*?)\s*-\s*(.+)$/)
  if (m) {
    const artist = m[1].trim()
    const title = m[2].trim()
    return { title, artist }
  }
  return { title: cleaned, artist: fallbackArtist || '' }
}

async function fetchMusicList(page = currentPage.value, size = pageSize.value) {
  try {
    const resp = await getMusicList({ pageNum: page, pageSize: size })
    const data = resp?.data?.data || {}
    const records = Array.isArray(data.records) ? data.records : (Array.isArray(data.list) ? data.list : [])
    // 支持后端返回 total 或 totalPage
    total.value = Number(data.total) || (Number(data.totalPage) ? Number(data.totalPage) * size : records.length)
    // 将后端字段映射到视图所用字段（兼容本地 mock）
    songs.value = records.map(r => {
      const raw = r.name ?? r.title ?? ''
      const fallbackArtist = r.author ?? r.artist ?? ''
      const parsed = parseSongDisplay(raw, fallbackArtist)
      return { id: r.id, title: parsed.title, artist: parsed.artist || fallbackArtist, url: r.url, image: r.image, duration: r.duration }
    })
    // 更新分页状态
    currentPage.value = page
    pageSize.value = size
  } catch (err) {
    ElMessage.error('获取歌曲列表失败')
    console.error(err)
  }
}

const dialogVisible = ref(false)
const uploadDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const editing = ref(null)
const form = reactive({ id: null, title: '', artist: '', url: '', type: 'OnlineMusic', duration: null, image: '' })
const batchInput = ref('')
const batchProgress = ref({ total: 0, success: 0, failed: 0 })
const batchFiles = ref([])
const batchUploading = ref(false)
// 记录每个失败项的文件名与原因，供 UI 展示与重试
const failedFiles = ref([])
const uploadingFile = ref(false)
const uploadingCover = ref(false)

function openAdd() {
  // 先打开上传对话框，仅包含 MP3 上传控件
  editing.value = null
  form.id = null
  form.title = ''
  form.artist = ''
  form.url = ''
  form.type = 'OnlineMusic'
  form.duration = null
  form.image = ''
  uploadDialogVisible.value = true
}

function openEdit(row) {
  editing.value = row.id
  form.id = row.id
  form.title = row.title
  form.artist = row.artist
  form.url = row.url || ''
  form.type = 'OnlineMusic'
  form.duration = null
  form.image = ''
  // 编辑已有歌曲直接打开新建/编辑对话框
  dialogVisible.value = true
}

async function saveSong() {
  if (!form.url && !form.title) { ElMessage.warning('请填写歌曲名称或 URL'); return }
  try {
    const payload = {
      name: form.title || undefined,
      author: form.artist || undefined,
      url: form.url || undefined,
      type: form.type || undefined,
      duration: form.duration || undefined,
      image: form.image || undefined
    }

    if (editing.value) {
      await updateMusic(form.id, payload)
      ElMessage.success('歌曲更新成功')
    } else {
      // 创建歌曲：后端在接收到 url 时可能会抓取并返回更多信息（id/duration），createMusic 返回该信息
      const resp = await createMusic(payload)
      // 显示后端返回信息（若有），便于确认
      if (resp?.data) {
        ElMessage.success('歌曲添加成功')
      } else {
        ElMessage.success('已发送创建请求')
      }
    }
    dialogVisible.value = false
    if (useApi) await fetchMusicList(currentPage.value, pageSize.value)
  } catch (err) {
    console.error(err)
    ElMessage.error('操作失败，请稍后重试')
  }
}

function beforeFileUpload(file) {
  const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a)$/i.test(file.name)
  const isLt20M = file.size / 1024 / 1024 < 20
  if (!isAudio) {
    ElMessage.error('只支持音频文件（mp3/wav/flac 等）')
    return false
  }
  if (!isLt20M) {
    ElMessage.error('文件大小不能超过 20MB')
    return false
  }
  return true
}

async function handleFileUpload(option) {
  const { file, onSuccess, onError } = option
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', 'LocalMusic')
  try {
    uploadingFile.value = true
    const { uploadFile } = await import('../../services/api')
    const resp = await uploadFile(fd)
    if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
      const url = resp.data.data?.url
      const duration = resp.data.data?.duration
      if (url) {
        form.url = url
        if (duration) form.duration = duration
        // 如果用户未填写 title，则尝试用文件名（去扩展名）作为标题
        if (!form.title) form.title = file.name.replace(/\.[^.]+$/, '')
        ElMessage.success('歌曲上传成功')
        // 关闭上传对话框，打开新建对话框以输入其余字段
        uploadDialogVisible.value = false
        dialogVisible.value = true
        onSuccess && onSuccess(resp.data)
      } else {
        ElMessage.error('上传成功但后端未返回 URL')
        onError && onError(new Error('no url'))
      }
    } else {
      ElMessage.error(resp?.data?.msg || '上传失败')
      onError && onError(new Error('upload failed'))
    }
  } catch (e) {
    console.error('上传文件失败', e)
    ElMessage.error('上传请求失败')
    onError && onError(e)
  } finally {
    uploadingFile.value = false
  }
}

function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|bmp)$/i.test(file.name)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只支持图片文件（png/jpg/gif 等）')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('封面图片不能超过 5MB')
    return false
  }
  return true
}

async function handleCoverUpload(option) {
  const { file, onSuccess, onError } = option
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', 'Picture')
  try {
    uploadingCover.value = true
    const { uploadFile } = await import('../../services/api')
    const resp = await uploadFile(fd)
    if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
      const url = resp.data.data?.url
      if (url) {
        form.image = url
        ElMessage.success('封面上传成功')
        onSuccess && onSuccess(resp.data)
      } else {
        ElMessage.error('上传成功但后端未返回 URL')
        onError && onError(new Error('no url'))
      }
    } else {
      ElMessage.error(resp?.data?.msg || '封面上传失败')
      onError && onError(new Error('upload failed'))
    }
  } catch (e) {
    console.error('封面上传失败', e)
    ElMessage.error('封面上传请求失败')
    onError && onError(e)
  } finally {
    uploadingCover.value = false
  }
}


// 批量添加：上传 ncm 文件并为每个文件创建歌曲记录
async function batchAdd() {
  if (!batchFiles.value || !batchFiles.value.length) {
    ElMessage.warning('请先选择要上传的 ncm 文件')
    return
  }
  batchProgress.value = { total: batchFiles.value.length, success: 0, failed: 0 }
  failedFiles.value = []
  batchDialogVisible.value = true
  batchUploading.value = true

  for (const file of batchFiles.value) {
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'LocalMusic')
      const { uploadFile } = await import('../../services/api')
      const resp = await uploadFile(fd)
      if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
        const url = resp.data.data?.url
        const duration = resp.data.data?.duration
        if (url) {
          const title = file.name.replace(/\.[^.]+$/, '')
          try {
            const createResp = await createMusic({ url, name: title || undefined, type: 'LocalMusic', duration: duration || undefined })
            if (createResp?.data && (createResp.data.code === 0 || createResp.data.code === 200 || createResp.status === 200)) {
              batchProgress.value.success += 1
            } else {
              const reason = createResp?.data?.msg || `create failed status ${createResp?.status}`
              failedFiles.value.push({ name: file.name, reason })
              batchProgress.value.failed += 1
            }
          } catch (e) {
            console.error('createMusic error', e)
            failedFiles.value.push({ name: file.name, reason: e?.message || String(e) })
            batchProgress.value.failed += 1
          }
        } else {
          console.error('upload returned no url for', file.name)
          failedFiles.value.push({ name: file.name, reason: '上传成功但后端未返回 URL' })
          batchProgress.value.failed += 1
        }
      } else {
        console.error('upload failed for', file.name, resp)
        const reason = resp?.data?.msg || `upload failed status ${resp?.status}`
        failedFiles.value.push({ name: file.name, reason })
        batchProgress.value.failed += 1
      }
    } catch (e) {
      console.error('batch upload error', e)
      failedFiles.value.push({ name: file.name, reason: e?.message || String(e) })
      batchProgress.value.failed += 1
    }
  }
  const summaryMsg = `批量上传完成：成功 ${batchProgress.value.success}，失败 ${batchProgress.value.failed}`
  if (batchProgress.value.failed) {
    ElMessage.warning(summaryMsg)
  } else {
    ElMessage.success(summaryMsg)
  }
  batchUploading.value = false
  // 保持对话框打开以便用户查看失败项，若全部成功则关闭
  if (batchProgress.value.failed === 0) {
    batchDialogVisible.value = false
  }
  // 清空已处理的文件选择（保留失败项供重试）
  batchFiles.value = []
  if (useApi) await fetchMusicList(currentPage.value, pageSize.value)
}

// 重试失败项：将失败项文件名恢复为可上传的 File 对象集合
async function retryFailed() {
  if (!failedFiles.value || !failedFiles.value.length) return
  // 这里无法从文件名恢复 File 对象；提示用户重新选择文件会更可靠
  ElMessage.info('请重新选择要重试的文件（浏览器安全限制无法直接从文件名恢复 File）')
}

function onSelectBatchFiles(e) {
  const files = e.target.files ? Array.from(e.target.files) : []
  // 只保留 .ncm 或常见音频文件（以防误选）
  batchFiles.value = files.filter(f => /\.ncm$/i.test(f.name) || f.type.startsWith('audio/'))
}

function remove(row) {
  ElMessageBox.confirm(`确认删除 ${row.title}？`, '删除', { type: 'warning' })
    .then(async () => {
      try {
        await deleteMusic(row.id)
        ElMessage.success('删除成功')
        if (useApi) await fetchMusicList(currentPage.value, pageSize.value)
      } catch (err) {
        console.error(err)
        ElMessage.error('删除失败')
      }
    })
    .catch(()=>{})
}

onMounted(() => {
  if (useApi) {
    fetchMusicList()
  }
})

function handlePageChange(page) {
  fetchMusicList(page, pageSize.value)
}
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
      <h3>歌曲管理</h3>
      <div style="display:flex;gap:8px;">
        <el-button type="primary" @click="openAdd">添加歌曲</el-button>
        <el-button type="default" @click="batchDialogVisible = true">批量添加</el-button>
      </div>
    </div>

    <el-table :data="songs" stripe style="width:100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="歌曲名" />
      <el-table-column prop="artist" label="歌手" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="() => openEdit(row)">编辑</el-button>
          <el-button type="text" size="small" @click="() => remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 上传对话框：只包含 MP3 上传控件 -->
    <el-dialog v-model="uploadDialogVisible" title="上传歌曲文件" width="480px">
      <div style="padding:12px">
        <el-upload
          :http-request="handleFileUpload"
          :show-file-list="true"
          accept="audio/*"
          :before-upload="beforeFileUpload"
          :auto-upload="true"
        >
          <el-button type="primary">选择并上传 MP3</el-button>
        </el-upload>
        <div style="margin-top:8px;color:#6b7280">请选择 MP3 文件，上传成功后会提示并打开新建歌曲窗口以填写其它信息。</div>
      </div>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑对话框：在上传成功后打开，或用于编辑已有歌曲 -->
    <el-dialog v-model="dialogVisible" title="歌曲信息" width="640px">
      <el-form label-width="100px">
        <el-form-item label="歌曲名"><el-input v-model="form.title" placeholder="可留空，若提供 URL 后端可解析出名称"/></el-form-item>
        <el-form-item label="歌手"><el-input v-model="form.artist" /></el-form-item>
        <el-form-item v-if="!editing" label="隐藏 URL"><el-input v-model="form.url" placeholder="后端返回的文件 URL" readonly /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type" placeholder="选择类型"><el-option label="在线音乐" value="OnlineMusic" /><el-option label="本地音乐" value="LocalMusic" /><el-option label="图片/封面" value="Picture" /></el-select></el-form-item>
        <el-form-item v-if="!editing" label="时长(秒)"><el-input v-model="form.duration" /></el-form-item>
        <el-form-item label="封面">
          <el-upload
            :http-request="handleCoverUpload"
            :show-file-list="false"
            accept="image/*"
            :before-upload="beforeImageUpload"
            :auto-upload="true"
          >
            <el-button size="small">上传封面</el-button>
          </el-upload>
          <div v-if="form.image" style="margin-top:8px">
            <img :src="form.image" alt="cover" style="max-width:160px;max-height:160px;border-radius:6px;border:1px solid #e6e6e6" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSong">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量添加对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量上传 ncm 文件" width="720px">
      <div style="margin-bottom:8px;color:#6b7280">请选择多个 <code>.ncm</code> 或音频文件，系统会逐个上传并用文件名作为歌曲名。</div>
      <div style="margin-bottom:8px">
        <input type="file" multiple accept=".ncm,audio/*" @change="onSelectBatchFiles" />
      </div>
      <div style="margin-bottom:8px;color:#6b7280">已选文件：<span style="color:#111">{{ batchFiles.length }} 个</span></div>
      <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px;align-items:center">
        <div style="flex:1;color:#6b7280">
          已选：<strong>{{ batchFiles.length }}</strong> 个 &nbsp; 
          已处理：<strong>{{ batchProgress.success + batchProgress.failed }}</strong> / <strong>{{ batchProgress.total }}</strong>
        </div>
          <el-button @click="batchDialogVisible = false" :disabled="batchUploading">取消</el-button>
          <el-button type="primary" @click="batchAdd" :loading="batchUploading" :disabled="batchUploading">
            {{ batchUploading ? '上传中...' : '开始上传并创建' }}
          </el-button>
      </div>
        <div v-if="failedFiles.length" style="margin-top:12px;padding:12px;background:#fff7f5;border:1px solid #ffd6cc;border-radius:6px">
          <h4 style="margin:0 0 8px 0">上传失败的文件（{{ failedFiles.length }}）</h4>
          <ul style="margin:0;padding-left:18px;color:#e11d48">
            <li v-for="(f, idx) in failedFiles" :key="idx">{{ f.name }} — {{ f.reason }}</li>
          </ul>
          <div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">
            <el-button type="warning" @click="retryFailed" :disabled="batchUploading">重试失败项</el-button>
          </div>
        </div>
    </el-dialog>
  </div>
</template>

<style scoped></style>
