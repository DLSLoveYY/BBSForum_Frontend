<template>
  <div class="forum-container">
    <!-- 顶部深灰条 -->
<div class="top-bar">
  <span class="forum-title">南昌大学个人论坛首页</span>
  <div>
   <span v-if="userStore.username">
  欢迎您，{{ userStore.username }}
  <el-button size="small" type="text" @click="logout">退出</el-button>
</span>

    <el-button v-else type="primary" @click="goLogin">登录</el-button>
  </div>
</div>


    <!-- logo、搜索栏、用户区 -->
    <div class="header">
      <div class="logo-area">
        <img src="/logo.jpg" alt="logo" class="logo-img" />
        <div class="site-title">
          <div class="cn">南昌大学论坛</div>
          <div class="en">NANCHANG UNIVERSITY BBS</div>
        </div>
      </div>
      <el-input placeholder="搜索帖子..." class="search-box" />
      <el-button type="text" @click="goProfile">我的主页</el-button>
    </div>

    <!-- 主体区域（三栏结构） -->
    <div class="main-content">
      <!-- 左侧导航栏 -->
      <div class="left-sidebar">
        <el-menu default-active="1" class="el-menu-vertical-demo">
          <el-menu-item index="1">精华推荐</el-menu-item>
          <el-menu-item index="2">所有帖子</el-menu-item>
          <el-menu-item index="3">热门帖子</el-menu-item>
          <el-menu-item index="4">论坛公告</el-menu-item>
          <el-menu-item index="5">我的关注</el-menu-item>
          <el-menu-item index="6" @click="goProfile">个人信息</el-menu-item> 
        </el-menu>
      </div>

      <!-- 中间帖子区域 -->
      <div class="center-posts">
  <div v-for="post in posts" :key="post.id" class="post-card">
    <div class="post-header">
      <h3 class="post-title clickable" @click="goPost(post.id)">
        {{ post.title }}
        <el-tag v-if="post.featured" type="warning" size="small" style="margin-left: 10px;">精华</el-tag>
      </h3>

      <div class="post-meta">
        发布者：{{ post.author }} ｜ 发布时间：{{ formatTime(post.createTime) }}
      </div>
    </div>
    <div class="post-body">
      {{ post.content.length > 100 ? post.content.slice(0, 100) + '...' : post.content }}
    </div>
    <div class="post-footer">
      <span>浏览 {{ post.views }}</span>
      <span>评论 {{ post.comments }}</span>
      <span>点赞 {{ post.likes }}</span>
    </div>
  </div>
</div>


      <!-- 右侧区域 -->
      <div class="right-bar">
        <el-button type="danger" class="post-btn" @click="goAddPost">我要发帖</el-button>

        <div class="hot-posts">
          <h4>本周热门帖子</h4>
          <ul>
            <li>示例：学习SpringBoot</li>
            <li>示例：Vue3组件通信</li>
          </ul>
        </div>
        <div class="hot-tags">
          <h4>热门标签</h4>
          <el-tag type="success" style="margin: 5px;">Spring</el-tag>
          <el-tag type="info" style="margin: 5px;">前端</el-tag>
          <el-tag type="danger" style="margin: 5px;">算法</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { fetchPostPage } from '@/api/post'  // ✅ 你需要先建好这个接口文件

const router = useRouter()
const userStore = useUserStore()

const logout = () => {
  userStore.logout()
  ElMessage.success('已退出')
  router.push('/login')
}

const goLogin = () => {
  router.push('/login')
}
const goProfile = () => {
  router.push('/profile')
}
const goAddPost = () => {
  if (!userStore.token) {
    ElMessage.warning('请先登录才能发帖')
    router.push('/login')
  } else {
    router.push('/post/add')
  }
}

// ✅ 核心：加载帖子列表
const posts = ref([])

onMounted(async () => {
  try {
    const res = await fetchPostPage(1, 10)
    posts.value = res.posts
  } catch (e) {
    console.error('加载帖子失败', e)
    ElMessage.error('加载帖子失败')
  }
})

// ✅ 时间格式化函数
const formatTime = (timeStr) => {
  return timeStr ? timeStr.replace('T', ' ').slice(0, 19) : ''
}

const goPost = (id) => {
  router.push(`/post/${id}`)
}

</script>


<style scoped>
.forum-container {
  font-family: 'Segoe UI', sans-serif;
}

.top-bar {
  background: #333;
  color: #fff;
  padding: 10px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  border-bottom: 1px solid #ddd;
  background: #fff;
}

.logo-area {
  display: flex;
  align-items: center;
}

.logo-img {
  width: 150px;
  margin-right: 15px;
}

.site-title .cn {
  font-size: 30px;
  font-weight: bold;
}
.site-title .en {
  font-size: 12px;
  color: #666;
}

.search-box {
  width: 300px;
  margin: 0 20px;
}

.main-content {
  display: flex;
  padding: 20px 30px;
  background: #f9f9f9;
}

.left-sidebar {
  width: 180px;
}

.center-posts {
  flex: 1;
  margin: 0 30px;
  min-height: 500px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.right-bar {
  width: 200px;
}

.post-btn {
  width: 100%;
  margin-bottom: 20px;
}

.hot-posts ul {
  padding-left: 16px;
  font-size: 14px;
}

.hot-tags {
  margin-top: 20px;
}
.post-card {
  background: #fff;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.post-meta {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
}

.post-body {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-footer {
  font-size: 13px;
  color: #666;
  display: flex;
  gap: 20px;
}
.clickable {
  cursor: pointer;
  color: #409EFF;
  transition: color 0.2s;
}
.clickable:hover {
  color: #66b1ff;
}

</style>
