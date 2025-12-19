<template>
  <div style="padding:16px;">
    <h3>我的上传</h3>

    <div style="margin-top:12px; max-width:800px;">
      <el-form label-width="90px">
        <el-form-item label="音频文件">
          <input type="file" accept="audio/*" @change="onSelectAudio" />
          <div v-if="selectedAudioName" style="margin-top:6px;color:#666">已选：{{ selectedAudioName }}</div>
        </el-form-item>

        <el-form-item label="歌曲名"><el-input v-model="form.title"></el-input></el-form-item>
          <el-form-item label="歌手"><el-input v-model="form.artist"></el-input></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="选择类型">
            <el-option label="流行音乐" value="FashionMusic" />
            <el-option label="轻音乐" value="SoftMusic" />
            <el-option label="说唱" value="RapMusic" />
            <el-option label="其他音乐" value="OtherMusic" />
          </el-select>
        </el-form-item>

        <el-form-item label="封面">
          <el-upload
            :http-request="handleCoverUpload"
            :show-file-list="false"
            accept="image/*"
            :before-upload="beforeImageUpload"
            :auto-upload="true"
          >
            <el-button size="small" :loading="uploadingCover" :disabled="uploadingCover">上传封面</el-button>
          </el-upload>
          <div v-if="form.image" style="margin-top:8px">
            <img :src="form.image" alt="cover" style="max-width:160px;max-height:160px;border-radius:6px;border:1px solid #e6e6e6" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitUpload" :loading="submitting" :disabled="submitting">上传并创建</el-button>
        </el-form-item>
        <div v-if="submitting" style="margin-top:8px;color:#666">上传中，请稍候...</div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile, createMusic } from '../services/api'

const uploadDialogVisible = ref(false)
const dialogVisible = ref(false)

// loading 状态
const uploadingFile = ref(false)
const uploadingCover = ref(false)

const form = reactive({ id: null as any, title: '', artist: '', url: '', type: 'OnlineMusic', duration: null as any, image: '' })

// 本地选择的音频文件（在提交时上传）
const selectedAudioFile = ref<File | null>(null)
const selectedAudioName = ref('')
// 提交全流程 loading
const submitting = ref(false)

function openUpload() {
  form.id = null
  form.title = ''
  form.artist = ''
  form.url = ''
  form.image = ''
  uploadDialogVisible.value = true
}

function beforeFileUpload(file: File) {
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

async function handleFileUpload(option: any) {
  const { file, onSuccess, onError } = option
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', 'LocalMusic')
  try {
    uploadingFile.value = true
    const resp = await uploadFile(fd)
    if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
      const url = resp.data.data?.url
      const duration = resp.data.data?.duration
      if (url) {
        form.url = url
        if (duration) form.duration = duration
        if (!form.title) form.title = file.name.replace(/\.[^.]+$/, '')
        ElMessage.success('歌曲上传成功')
        uploadDialogVisible.value = false
        dialogVisible.value = true
        onSuccess && onSuccess(resp.data)
        return
      }
      ElMessage.error('上传成功但后端未返回 URL')
      onError && onError(new Error('no url'))
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

function beforeImageUpload(file: File) {
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

async function handleCoverUpload(option: any) {
  const { file, onSuccess, onError } = option
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', 'Picture')
  try {
    uploadingCover.value = true
    const resp = await uploadFile(fd)
    if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
      const url = resp.data.data?.url
      if (url) {
        form.image = url
        ElMessage.success('封面上传成功')
        onSuccess && onSuccess(resp.data)
        return
      }
      ElMessage.error('上传成功但后端未返回 URL')
      onError && onError(new Error('no url'))
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

function onSelectAudio(e: Event) {
  const el = e.target as HTMLInputElement
  const f = el.files?.[0] ?? null
  if (f) {
    // basic validation
    const isAudio = f.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a)$/i.test(f.name)
    const isLt20M = f.size / 1024 / 1024 < 20
    if (!isAudio) {
      ElMessage.error('只支持音频文件（mp3/wav/flac 等）')
      el.value = ''
      return
    }
    if (!isLt20M) {
      ElMessage.error('文件大小不能超过 20MB')
      el.value = ''
      return
    }
    selectedAudioFile.value = f
    selectedAudioName.value = f.name
  } else {
    selectedAudioFile.value = null
    selectedAudioName.value = ''
  }
}

async function submitUpload() {
  if (!selectedAudioFile.value && !form.url) {
    ElMessage.warning('请先选择音频文件或填写音频 URL')
    return
  }
  if (!form.title && !form.url) {
    ElMessage.warning('请填写歌曲名称或提供 URL')
    return
  }

  submitting.value = true
  try {
    // 如果用户选择了本地文件，先上传文件
    if (selectedAudioFile.value) {
      const fd = new FormData()
      fd.append('file', selectedAudioFile.value)
      fd.append('type', 'LocalMusic')
      const resp = await uploadFile(fd)
      if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
        const url = resp.data.data?.url
        const duration = resp.data.data?.duration
        if (!url) {
          ElMessage.error('上传成功但后端未返回 URL')
          return
        }
        form.url = url
        if (duration) form.duration = duration
      } else {
        ElMessage.error(resp?.data?.msg || '音频上传失败')
        return
      }
    }

    // 创建歌曲记录
    const payload: any = {
      name: form.title || undefined,
      author: form.artist || undefined,
      url: form.url || undefined,
      type: form.type || undefined,
      duration: form.duration || undefined,
      image: form.image || undefined
    }
    const createResp = await createMusic(payload)
    if (createResp?.data && (createResp.data.code === 0 || createResp.data.code === 200 || createResp.status === 200)) {
      ElMessage.success('上传并创建成功')
      // reset form
      selectedAudioFile.value = null
      selectedAudioName.value = ''
      form.title = ''
      form.artist = ''
      form.url = ''
      form.duration = null
      form.image = ''
    } else {
      ElMessage.error(createResp?.data?.msg || '创建失败')
    }
  } catch (e) {
    console.error('提交上传失败', e)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

async function saveSong() {
  if (!form.url && !form.title) { ElMessage.warning('请填写歌曲名称或 URL'); return }
  try {
    const payload: any = {
      name: form.title || undefined,
      author: form.artist || undefined,
      url: form.url || undefined,
      type: form.type || undefined,
      duration: form.duration || undefined,
      image: form.image || undefined
    }
    const resp = await createMusic(payload)
    if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
      ElMessage.success('已发送创建请求')
      dialogVisible.value = false
      // 可选：刷新用户上传列表（若有）
    } else {
      ElMessage.error(resp?.data?.msg || '创建失败')
    }
  } catch (e) {
    console.error('创建歌曲失败', e)
    ElMessage.error('创建歌曲失败')
  }
}
</script>

<style scoped>
</style>
