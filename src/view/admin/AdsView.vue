<template>
  <div style="padding:16px;">
    <h3>通知推送</h3>
    <div style="max-width:800px;margin-top:12px;">
      <el-form label-width="100px">
        <el-form-item label="通知内容">
          <el-input type="textarea" v-model="form.content" :rows="4" placeholder="请输入通知文字内容（必填）"></el-input>
        </el-form-item>
        <el-form-item label="时长(秒)">
          <el-input-number v-model="form.duration" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="图片(可选)">
          <el-upload
            :http-request="handleCoverUpload"
            :show-file-list="false"
            accept="image/*"
            :before-upload="beforeImageUpload"
            :auto-upload="true"
          >
            <el-button size="small" :loading="uploading">上传图片</el-button>
          </el-upload>
          <div v-if="form.picture" style="margin-top:8px">
            <img :src="form.picture" alt="ad picture" style="max-width:320px;border-radius:6px;border:1px solid #e6e6e6" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitAd" :loading="submitting">推送广告</el-button>
        </el-form-item>
        <div v-if="resultKey" style="margin-top:8px;color:#333">已创建广告 Key：<strong>{{ resultKey }}</strong></div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile, createAd } from '../../services/api'

const form = reactive({ content: '', picture: '', duration: 10 })
const uploading = ref(false)
const submitting = ref(false)
const resultKey = ref('')

function beforeImageUpload(file: File) {
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|bmp)$/i.test(file.name)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只支持图片文件（png/jpg/gif 等）')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片不能超过 5MB')
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
    uploading.value = true
    const resp = await uploadFile(fd)
    if (resp?.data && (resp.data.code === 0 || resp.data.code === 200 || resp.status === 200)) {
      const url = resp.data.data?.url || resp.data?.data || resp.data?.url || resp.data
      if (url) {
        form.picture = url
        ElMessage.success('图片上传成功')
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
    console.error('上传失败', e)
    ElMessage.error('图片上传失败')
    onError && onError(e)
  } finally {
    uploading.value = false
  }
}

async function submitAd() {
  if (!form.content || !form.content.trim()) {
    ElMessage.warning('广告内容不能为空')
    return
  }
  if (!form.duration || form.duration <= 0) {
    ElMessage.warning('请输入合法的时长（秒）')
    return
  }
  submitting.value = true
  try {
    const payload: any = { content: form.content.trim(), duration: Number(form.duration) }
    if (form.picture) payload.picture = form.picture
    const resp = await createAd(payload)
    // 打印完整响应，便于诊断后端返回格式
    console.debug('[AdsView] createAd resp', resp)
    // 后端在不同实现中可能返回 { code:0, data: { key } }，也可能仅返回简单字符串或其他结构。
    // 我们以 HTTP 200 视为创建成功，并尽量从 resp.data.data 中提取 key。
    const httpOk = resp && resp.status === 200
    const body = resp?.data
      if (httpOk) {
      // 尝试从规范响应中读取 key
      let key = ''
      if (body?.data && typeof body.data === 'object') {
        key = body.data.key || ''
      } else if (body?.data && typeof body.data === 'string') {
        // 如果后端直接返回字符串（例如日期），把它当作 key
        key = body.data
      } else if (body && typeof body === 'string') {
        // 某些后端直接把 data 放在根部返回为字符串
        key = body
      }
      if (key) resultKey.value = key
      // 显示提示，优先显示 key 或返回体
      const returned = key || (body?.data ?? body)
      ElMessage.success('广告已创建并推送：' + (typeof returned === 'string' ? returned : (key || '已创建')))
    } else {
      ElMessage.error(body?.msg || '创建广告失败')
    }
  } catch (e) {
    console.error('创建广告失败', e)
    // 显示更详细的错误信息（若后端返回错误体）
    const err: any = e
    const resp = err?.response
    if (resp) {
      console.debug('[AdsView] createAd error response', resp.status, resp.data)
      ElMessage.error(resp.data?.msg || `请求失败：${resp.status}`)
    } else {
      ElMessage.error('请求失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
</style>
