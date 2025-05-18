<template>
  <div class="post-detail-container" v-if="post">
    <div class="top-actions">
    <el-button type="primary" @click="router.push('/forum')" size="small" plain>
        返回贴吧首页
    </el-button>
    </div>

    <h1 class="title">{{ post.title }}</h1>
    <div class="meta">
    <el-avatar
        :src="post.author.avatar"
        size="large"
        style="margin-right: 10px"
    />

    作者：{{ post.author?.username || '匿名' }} ｜ 发布时间：{{ formatTime(post.createTime) }}
    </div>

    <hr />
    <div class="content" v-html="htmlContent" />

    <!-- 管理员审核操作，仅在 ?from=check 模式下显示 -->
    <div v-if="mode === 'check'" class="audit-actions">
      <el-button type="success" @click="approvePost">通过</el-button>
      <el-button type="danger" @click="deletePost">删除</el-button>
    </div>

    <!-- 评论列表 -->
    <div class="comment-section">
      <h3>全部回复</h3>
      <el-divider />
      <div v-if="comments.length === 0" class="no-comments">暂无评论</div>
      <div v-for="(comment, index) in comments" :key="comment.id" class="comment">
        <div class="comment-header">
            <div class="comment-user">
                <el-avatar
                v-if="comment.user?.avatar"
                :src="getAvatarUrl(comment.user.avatar)"
                size="small"
                style="margin-right: 8px"
                />
                <strong>{{ comment.user?.username || '匿名' }}</strong>
            </div>
            <span class="floor">| {{ index + 1 }}楼 | {{ formatTime(comment.createTime) }}</span>
        </div>

        <div class="comment-body">{{ comment.content }}</div>
      </div>
    </div>

    <!-- 发表评论 -->
    <div class="comment-box">
      <el-input
        v-model="newComment"
        type="textarea"
        rows="4"
        placeholder="说点什么吧..."
      />
      <el-button type="primary" style="margin-top: 10px" @click="submitComment">发表评论</el-button>
    </div>
  </div>

  <div v-else class="loading">
    <el-skeleton :rows="5" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const post = ref(null)
const htmlContent = ref('')
const comments = ref([])
const newComment = ref('')
const mode = route.query.from || ''  // 是否处于审核模式
const id = route.params.id

// 格式化时间
const formatTime = (timeStr) => {
  return timeStr ? timeStr.replace('T', ' ').slice(0, 19) : ''
}
const getAvatarUrl = (path) => {
  if (!path) return ''
  return path.startsWith('http') ? path : `http://localhost:8080${path}`
}

// 加载帖子
const loadPost = async () => {
  const endpoint = mode === 'check'
    ? `http://localhost:8080/api/checkPost/detail?id=${id}`
    : `http://localhost:8080/api/post/detail?id=${id}`

  try {
    const res = await fetch(endpoint)
    const json = await res.json()
    if (json.code === 200) {
      post.value = json.data
      htmlContent.value = marked.parse(json.data.content || '')
    } else {
      ElMessage.error(json.message || '帖子不存在')
    }
  } catch (err) {
    ElMessage.error('加载帖子失败')
  }
}

// 加载评论
const loadComments = async () => {
  try {
    const res = await fetch(`http://localhost:8080/api/comment/list?postId=${id}`)
    const json = await res.json()
    if (json.code === 200) {
      comments.value = json.comments
    } else {
      ElMessage.error(json.message || '评论加载失败')
    }
  } catch (err) {
    ElMessage.error('评论请求失败')
  }
}

// 发表评论
const submitComment = async () => {
  if (!userStore.token) {
    ElMessage.warning('请先登录后评论')
    router.push('/login')
    return
  }

  if (!newComment.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  try {
    const res = await fetch('http://localhost:8080/api/comment/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token}`
      },
      body: JSON.stringify({
        postId: id,
        content: newComment.value
      })
    })
    const json = await res.json()
    if (json.code === 200) {
      ElMessage.success('评论成功')
      newComment.value = ''
      await loadComments()
    } else {
      ElMessage.error(json.message)
    }
  } catch (err) {
    ElMessage.error('评论提交失败')
  }
}

// 管理员审核通过
const approvePost = async () => {
  try {
    const res = await fetch('http://localhost:8080/api/checkPost/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ id })
    })
    const json = await res.json()
    if (json.code === 200) {
      ElMessage.success('已通过审核')
      router.push('/admin') // ✅ 审核后返回后台主页
    } else {
      ElMessage.error(json.message)
    }
  } catch (err) {
    ElMessage.error('审核失败')
  }
}

// 管理员删除帖子
const deletePost = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该帖子吗？', '确认操作', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await fetch('http://localhost:8080/api/checkPost/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ id })
    })
    const json = await res.json()
    if (json.code === 200) {
      ElMessage.success('已删除')
      router.push('/admin')
    } else {
      ElMessage.error(json.message)
    }
  } catch (err) {
    ElMessage.info('已取消删除')
  }
}

onMounted(() => {
  loadPost()
  loadComments()
})
</script>

<style scoped>
.post-detail-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 10px;
}

.meta {
  font-size: 14px;
  color: #888;
  margin-bottom: 20px;
}

.content {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 30px;
}

.content img {
  max-width: 100%;
  display: block;
  margin: 15px 0;
  border-radius: 4px;
}

.audit-actions {
  margin: 20px 0;
  display: flex;
  gap: 20px;
}

.comment-section {
  margin-top: 40px;
}

.comment {
  border-bottom: 1px solid #eee;
  padding: 16px 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
}

.floor {
  color: #999;
}

.comment-body {
  font-size: 15px;
  color: #333;
  white-space: pre-wrap;
  line-height: 1.6;
}

.comment-box {
  margin-top: 40px;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}
.no-comments {
  color: #aaa;
  font-style: italic;
  margin: 20px 0;
}

.comment-user {
  display: flex;
  align-items: center;
}

</style>
