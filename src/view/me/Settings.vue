<template>
  <div class="settings-page">
    <div class="settings-container">
      <div class="card-header">
        <h3>个人设置</h3>
      </div>
      <div class="card-body">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-display">
            <div class="avatar-frame">
              <el-avatar :src="form.avatar" class="avatar-big" />
            </div>
          </div>
          <div class="avatar-actions">
            <el-upload
              :http-request="handleUpload"
              :show-file-list="false"
              accept="image/*"
              :before-upload="beforeUpload"
            >
              <el-button type="primary" size="small">上传头像</el-button>
            </el-upload>
            <div class="avatar-info">
              <div class="name">{{ form.username }}</div>
              <div class="meta">性别：{{ form.sex }} &nbsp;|&nbsp; 邮箱：{{ form.email }}</div>
            </div>
          </div>
        </div>

        <!-- 表单区域 -->
        <div class="form-section">
          <el-form :model="form" label-width="100px">
            <el-form-item label="姓名">
              <el-input v-model="form.username" />
            </el-form-item>

            <el-form-item label="性别">
              <el-radio-group v-model="form.sex">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
                <el-radio label="其他">其他</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="邮箱">
              <el-input v-model="form.email" disabled />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="onSave">保存</el-button>
              <el-button @click="onCancel">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { uploadAvatar, updateUserProfile, getUserProfile } from '../../services/api'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const user = auth.user

const form = ref<any>({
  username: (user as any)?.username || '',
  sex: (user as any)?.sex || '男',
  email: (user as any)?.email || '',
  avatar: (user as any)?.avatar || ''
})

onMounted(async () => {
  if (user && (user as any).id) {
    try {
      const resp = await getUserProfile((user as any).id)
      if (resp.data?.code === 200) {
        const d = resp.data.data
        form.value.username = d.username || ''
        form.value.sex = d.sex || '男'
        form.value.email = d.email || ''
        form.value.avatar = d.avatar || ''
      }
    } catch (e) {
      // ignore
    }
  }
})

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('上传头像只能是图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

async function handleUpload(option: any) {
  const { file } = option
  const fd = new FormData()
  // 按后端文档需要的字段名：file
  fd.append('file', file)
  // 明确传递 type=Picture 表示图片上传（后端期望的类型：OnlineMusic, LocalMusic, Picture）
  fd.append('type', 'Picture')
  // 可选：传 userId（有助于后台关联）
  if (user && (user as any).id) {
    fd.append('userId', String((user as any).id))
  }
  try {
    const resp = await uploadAvatar(fd)
    // 兼容后端返回 code 可能为 0（成功）或 200（成功）
    if (resp.data && (resp.data.code === 200 || resp.data.code === 0)) {
      const url = resp.data.data?.url
      if (url) {
        form.value.avatar = url
        ElMessage.success('头像上传成功')
      } else {
        ElMessage.error('上传成功但未返回文件 URL')
      }
    } else {
      ElMessage.error(resp.data?.msg || '上传失败')
    }
  } catch (e) {
    ElMessage.error('上传请求失败')
  }
}

async function onSave() {
  if (!(user && (user as any).id)) return
  try {
    const resp = await updateUserProfile((user as any).id, {
      username: form.value.username,
      sex: form.value.sex,
      avatar: form.value.avatar
    })
    if (resp.data && (resp.data.code === 200 || resp.data.code === 0)) {
      ElMessage.success('保存成功')
      // 更新本地 auth store 显示，并持久化到 localStorage，避免刷新后丢失
      const updated = { ...(auth.user as any), username: form.value.username, sex: form.value.sex, avatar: form.value.avatar }
      auth.user = updated
      try {
        localStorage.setItem('user', JSON.stringify(updated))
      } catch (err) {
        console.warn('无法写入 localStorage.user', err)
      }
    } else {
      ElMessage.error(resp.data?.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存请求失败')
  }
}

function onCancel() {
  // 简单回到个人页
  window.history.back()
}
</script>

<style scoped>
.settings-page {
  padding: 12px 14px;
  background: transparent;
  min-height: 100vh;
}

.settings-container{
  max-width: 980px;
  margin: 6px auto;
  border-radius: 8px;
}

.card-header {
  padding: 14px 8px 8px;
  border-bottom: none;
  background: transparent;
}

.card-header h3 {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.card-body {
  padding: 12px 8px 18px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 26px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(81, 170, 255, 0.05) 0%, rgba(170, 81, 255, 0.04) 100%);
  border-radius: 12px;
  box-shadow: none;
}

.avatar-display {
  position: relative;
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}

.avatar-frame {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.avatar-frame::before {
  content: '';
  position: absolute;
  width: 150%;
  height: 150%;
  background: conic-gradient(transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.avatar-big {
  width: 140px !important;
  height: 140px !important;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.avatar-info {
  color: var(--el-text-color-secondary, #6b6b6b);
}

.avatar-info .name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.avatar-info .meta {
  font-size: 0.95rem;
  margin-bottom: 16px;
}

.form-section {
  background: transparent;
  padding: 12px 0 0 0;
  border-radius: 8px;
  box-shadow: none;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-form-item__label {
  font-weight: 500;
  color: #374151;
}

.el-input, .el-radio-group {
  width: 100%;
  max-width: 400px;
}

.el-button {
  border-radius: 8px;
  padding: 10px 20px;
}

.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

@media (max-width: 768px) {
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar-display {
    width: 150px;
    height: 150px;
  }
  
  .avatar-big {
    width: 120px !important;
    height: 120px !important;
  }
}
</style>