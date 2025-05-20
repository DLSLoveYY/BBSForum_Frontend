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
        <el-menu :default-active="activeMenu" class="el-menu-vertical-demo">
          <el-menu-item index="1" @click="loadAllPosts">所有帖子</el-menu-item>
          <el-menu-item index="2" @click="loadFeaturedPosts">精华推荐</el-menu-item>
          <el-menu-item index="3" @click="loadHotPosts">热门帖子</el-menu-item>
          <el-menu-item index="4" @click="goNotice">论坛公告</el-menu-item>
          <el-menu-item index="5" @click="goFollowed">我的关注</el-menu-item>
          <el-menu-item index="6" @click="goProfile">个人信息</el-menu-item>
        </el-menu>
      </div>

      <!-- 中间帖子区域 -->
      <div class="center-posts">
        <div v-for="post in posts" :key="post.id" class="post-card">
          <div class="post-header">
            <h3 class="post-title clickable" @click="goPost(post.id)">
              {{ post.title }}
              <el-tag v-if="post.isNotice" type="danger" size="small" style="margin-left: 10px;">公告</el-tag>
              <el-tag v-if="post.featured" type="warning" size="small" style="margin-left: 10px;">精华</el-tag>
            </h3>

            <div class="post-meta">
              发布者：{{ post.author }} ｜ 发布时间：{{ formatTime(post.createTime) }}
            </div>
          </div>
          <div class="post-body">
            <div v-if="extractFirstImage(post.content)">
              <img :src="extractFirstImage(post.content)" alt="封面图" class="preview-image" />
            </div>
            <div>{{ getPreviewText(post.content) }}</div>
          </div>

          <div class="post-footer">
            <span>浏览 {{ post.views }}</span>
            <span>评论 {{ post.comments }}</span>
            <span>点赞 {{ post.likes }}</span>
          </div>
        </div>

        <!-- 分页器 -->
        <el-pagination
          v-if="activeMenu === '1'"
          background
          layout="prev, pager, next"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalPosts"
          @current-change="(val) => currentPage = val"
          style="margin-top: 20px; text-align: center"
        />

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
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { fetchPostPage } from '@/api/post'

const router = useRouter()
const userStore = useUserStore()

const logout = () => {
  userStore.logout()
  ElMessage.success('已退出')
  router.push('/login')
}

const goLogin = () => router.push('/login')
const goProfile = () => router.push('/profile')
const goAddPost = () => {
  if (!userStore.token) {
    ElMessage.warning('请先登录才能发帖')
    router.push('/login')
  } else {
    router.push('/post/add')
  }
}

const posts = ref([])
const currentPage = ref(1)
const pageSize = 8
const totalPosts = ref(0)
const activeMenu = ref('1') // 1：所有帖子，2：精华，3：热门，4：公告，...

// 时间格式化
const formatTime = (timeStr) => {
  return timeStr ? timeStr.replace('T', ' ').slice(0, 19) : ''
}

// 帖子详情跳转
const goPost = async (id) => {
  try {
    await fetch(`/api/post/${id}/view`, { method: 'PUT' })
  } catch (e) {
    console.error('更新浏览量失败', e)
  }
  router.push(`/post/${id}`)
}
const fetchPostPageData = async () => {
  try {
    const res = await fetch(`/api/post/page?page=${currentPage.value}&size=${pageSize}`)
    const json = await res.json()
    if (json.posts && json.total !== undefined) {
      posts.value = json.posts
      totalPosts.value = json.total
    } else {
      ElMessage.error(json.message || '加载失败')
    }
  } catch (e) {
    console.error('加载失败', e)
    ElMessage.error('加载失败')
  }
}

// 所有帖子（分页）
const loadAllPosts = async () => {
  activeMenu.value = '1'
  currentPage.value = 1
  await fetchPostPageData()
}



// 精华帖（不分页）
const loadFeaturedPosts = async () => {
  activeMenu.value = '2'
  totalPosts.value = 0
  currentPage.value = 1
  try {
    const res = await fetch('/api/post/featured')
    const json = await res.json()
    if (json.code === 200) {
      posts.value = json.posts
    } else {
      ElMessage.error(json.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

// 热门帖（不分页）
const loadHotPosts = async () => {
  activeMenu.value = '3'
  totalPosts.value = 0
  currentPage.value = 1
  try {
    const res = await fetch('/api/post/hot')
    const json = await res.json()
    if (json.code === 200) {
      posts.value = json.posts
    } else {
      ElMessage.error(json.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

// 公告帖（不分页）
const goNotice = async () => {
  activeMenu.value = '4'
  totalPosts.value = 0
  currentPage.value = 1
  try {
    const res = await fetch('/api/post/notice')
    const json = await res.json()
    if (json.code === 200) {
      posts.value = json.posts
    } else {
      ElMessage.error(json.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

// 监听页码，仅当为“所有帖子”栏目时切换分页
watch(currentPage, async (val) => {
  if (activeMenu.value === '1') {
    await fetchPostPageData()
  }
})
const extractFirstImage = (markdown) => {
  const regex = /!\[.*?\]\((.*?)\)/;
  const match = markdown.match(regex);
  return match ? match[1] : null;
};

const getPreviewText = (markdown) => {
  // 去除 Markdown 图片语法，只保留文本
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/[#>*`]/g, '') // 去除其他 Markdown 符号
    .slice(0, 100) + '...';
};

onMounted(() => {
  loadAllPosts()
})

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
.preview-image {
  max-width: 100%;
  max-height: 150px;
  margin-bottom: 8px;
  border-radius: 4px;
  object-fit: cover;
}

</style>
