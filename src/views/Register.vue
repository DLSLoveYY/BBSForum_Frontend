<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2 style="text-align: center">用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="form.password" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="上传头像">
          <input type="file" @change="handleAvatarChange" accept="image/*" />
        </el-form-item>
        <el-form-item v-if="avatarPreview">
          <img :src="avatarPreview" alt="头像预览" style="max-width: 100px; border-radius: 50%" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="register">注册</el-button>
          <el-button @click="router.push('/login')">返回登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const formRef = ref(null)

const form = reactive({
  username: '',
  password: '',
  email: '',
  avatar: ''
})

// ✅ 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 16, message: '长度应在3~16字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 3, message: '密码长度至少为3位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ]
}

const avatarFile = ref(null)
const avatarPreview = ref(null)

const handleAvatarChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await axios.post('/api/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    form.avatar = res.data // ✅ 修正：后端返回的是字符串路径
    ElMessage.success('头像上传成功')
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
}

const register = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      const res = await axios.post('/api/user/register', form)
      if (res.data === '注册成功') {
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } else {
        ElMessage.error(res.data || '注册失败')
      }
    } catch (error) {
      ElMessage.error('请求失败：' + (error.response?.data?.message || error.message))
    }
  })
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.register-card {
  width: 450px;
  padding: 20px;
}
</style>
