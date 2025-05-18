<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <h2 class="profile-title">个人信息管理</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入新用户名" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="修改密码" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="头像">
          <input type="file" @change="handleAvatarChange" accept="image/*" />
        </el-form-item>
        <el-form-item v-if="form.avatar">
          <img :src="getFullAvatarUrl(form.avatar)" alt="头像预览" class="avatar-preview" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">保存修改</el-button>
          <el-button type="text" @click="goBack">返回主页</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => {
  router.push('/forum')
}

const formRef = ref()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
  email: '',
  avatar: ''
})

// ✅ 表单校验规则
const rules = {
  password: [
    { min: 3, message: '密码至少3位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ]
}

// ✅ 获取用户信息（自动填充）
onMounted(async () => {
  try {
    const res = await axios.get('/api/user/info', {
      headers: { Authorization: userStore.token }
    })
    Object.assign(form, res.data)
  } catch (e) {
    ElMessage.error('加载用户信息失败')
  }
})

// ✅ 上传头像
const handleAvatarChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await axios.post('/api/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    form.avatar = res.data
    ElMessage.success('头像上传成功')
  } catch (err) {
    ElMessage.error('头像上传失败')
  }
}

// ✅ 提交更新信息
const submit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await axios.put('/api/user/update', form, {
        headers: { Authorization: userStore.token }
      })
      if (res.data === '更新成功') {
        ElMessage.success('信息已更新')
        router.push('/forum')
      } else {
        ElMessage.error(res.data || '更新失败')
      }
    } catch (e) {
      ElMessage.error('请求失败')
    }
  })
}

const getFullAvatarUrl = (path) => {
  if (!path) return ''
  // 如果已经是完整路径就返回，否则拼接后端地址
  return path.startsWith('http') ? path : `http://localhost:8080${path}`
}

</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  padding: 40px;
}
.profile-card {
  width: 500px;
  padding: 20px;
}
.profile-title {
  text-align: center;
  margin-bottom: 20px;
}
.avatar-preview {
  width: 100px;
  border-radius: 50%;
}
</style>
