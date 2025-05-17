<template>
  <div class="login-container">
    <div class="logo-area">
        <img src="/logo.jpg" alt="Logo" class="logo-img" />
            <div class="school-title">
            <div class="school-cn">学生个人论坛</div>
            <div class="school-en">Personal Forum</div>
        </div>
    </div>


    <el-card class="login-card">
      <h2 class="login-title">用户登录</h2>
      <el-form :model="form" label-width="80px" class="login-form">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <div class="button-group">
            <el-button type="primary" @click="login">登录</el-button>
            <el-button @click="router.push('/register')">去注册</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { loginApi } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

const login = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  try {
    const res = await loginApi(form)
    if (res.code === 200) {
      userStore.setToken(res.token)
      userStore.setUsername(form.username)  // ✅ 新增这一行
      ElMessage.success('登录成功')
      router.push('/forum') // 登录成功后跳转首页
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (err) {
    ElMessage.error('请求失败')
  }
}

</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f0f2f5;
  min-height: 100vh;
  padding-top: 40px;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.logo-img {
  width: 230px;
  height: 120px;
  margin-right: 15px;
}

.school-title {
  text-align: left;
  line-height: 1.5;
}

.school-cn {
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
}

.school-en {
  font-size: 24px;
  letter-spacing: 3px;
  color: #666;
}

.login-card {
  width: 400px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

</style>
