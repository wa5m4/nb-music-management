<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser } from '../../services/api'

const users = ref([])
// 管理端始终使用后端数据
const useApi = true

async function fetchUsers(page = 1, pageSize = 50) {
  try {
    const resp = await getUserList({ pageNum: page, pageSize })
    const records = resp?.data?.data?.records || []
    // 仅当用户名为 'admin' 时显示管理员，其余一律视为普通用户
    users.value = records.map(r => ({ id: r.id, username: r.username ?? r.name, email: r.email, sex: r.sex ?? null, role: (r.username === 'admin') ? '管理员' : '用户' }))
  } catch (err) {
    ElMessage.error('获取用户列表失败')
    console.error(err)
  }
}

const dialogVisible = ref(false)
const editing = ref(null)
const form = reactive({ id: null, username: '', email: '', sex: '' })
const auth = useAuthStore()

function openAdd() {
  editing.value = null
  form.id = null
  form.username = ''
  form.email = ''
  form.sex = ''
  dialogVisible.value = true
}

function openEdit(row) {
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
      await updateUser(form.id, { username: form.username, email: form.email, sex: form.sex })
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

function remove(row) {
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
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="() => openEdit(row)">编辑</el-button>
          <el-button type="text" size="small" @click="() => remove(row)">删除</el-button>
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
</template>

<style scoped></style>
