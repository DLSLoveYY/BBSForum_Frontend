<template>
  <div class="profile-layout">
    <!-- 左侧菜单 -->
    <el-menu
      class="profile-menu"
      :default-active="activeTab"
      @select="handleSelect"
    >
      <el-menu-item index="info">个人信息</el-menu-item>
      <el-menu-item index="edit">修改信息</el-menu-item>
      <el-menu-item index="follow">我的关注</el-menu-item>
    </el-menu>

    <!-- 右侧内容 -->
    <div class="profile-content">
      <!-- 返回主页按钮 -->
    <div style="text-align: right; margin-bottom: 10px;">
      <el-button type="primary" size="small" plain @click="goBack">返回论坛主页</el-button>
    </div>
      <div v-if="activeTab === 'info'">
        <h2>个人信息</h2>
        <el-descriptions border column="1">
          <el-descriptions-item label="用户名">{{ form.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ form.email }}</el-descriptions-item>
          <el-descriptions-item label="头像">
            <img :src="getFullAvatarUrl(form.avatar)" alt="头像" class="avatar-preview" />
          </el-descriptions-item>
          <el-descriptions-item label="性别">
            <span :style="!form.gender ? 'color: gray;' : ''">
              {{ form.gender || '保密' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="年龄">
            <span :style="form.age == null ? 'color: gray;' : ''">
              {{ form.age != null ? form.age : '保密' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="个性签名">
            <span :style="!form.signature ? 'color: gray;' : ''">
              {{ form.signature || '无' }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </div>


      <div v-if="activeTab === 'edit'">
        <h2 class="profile-title">修改信息</h2>
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
          <el-form-item label="签名">
            <el-input v-model="form.signature" placeholder="写一句个性签名吧" style="width: 300px;" />
          </el-form-item>

          <el-form-item label="性别">
            <el-select v-model="form.gender" placeholder="选择性别" style="width: 300px;">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>

          <el-form-item label="年龄">
            <el-input-number v-model="form.age" :min="0" :max="120" placeholder="请输入年龄" style="width: 300px;" />
          </el-form-item>

          <el-form-item v-if="form.avatar">
            <img :src="getFullAvatarUrl(form.avatar)" alt="头像预览" class="avatar-preview" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submit">保存修改</el-button>
            <el-button type="text" @click="goBack">返回主页</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="activeTab === 'follow'">
        <h2>我的关注</h2>
        <p>（此处将来可展示用户关注的帖子或用户）</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const form = reactive({
  username: '',
  password: '',
  email: '',
  avatar: '',
  signature: '',
  gender: '',
  age: null
})

const activeTab = ref('info')
const handleSelect = (key) => {
  activeTab.value = key
}

const goBack = () => {
  router.push('/forum')
}

const formRef = ref()

const rules = {
  password: [
    { min: 3, message: '密码至少3位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ]
}

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
  return path.startsWith('http') ? path : `http://localhost:8080${path}`
}
</script>

<style scoped>
.profile-layout {
  display: flex;
  min-height: 600px;
  padding: 40px;
  background: #f9f9f9;
}

.profile-menu {
  width: 200px;
  margin-right: 20px;
  background: #fff;
  border-radius: 8px;
}

.profile-content {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.profile-title {
  margin-bottom: 20px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}
</style>
