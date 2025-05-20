<template>
  <div class="post-detail-container" v-if="post">
    <div class="top-actions">
      <el-button type="primary" @click="router.push('/forum')" size="small" plain>
        返回贴吧首页
      </el-button>
    </div>

    <h1 class="title">{{ post.title }}</h1>
    <div class="meta">
      <el-avatar :src="post.author.avatar" size="large" style="margin-right: 10px" />
      作者：{{ post.author?.username || '匿名' }} | 发布时间：{{ formatTime(post.createTime) }}
      浏览量：{{ post.views }} | 点赞：{{ post.likes }}
    </div>

    <hr />

    <div class="content" v-html="htmlContent" />

    <div class="like-section">
      <el-button
        :icon="liked ? 'el-icon-success' : 'el-icon-thumb'"
        :type="liked ? 'success' : 'primary'"
        size="small"
        @click="handleLike"
      >
        {{ liked ? '已点赞' : '点赞' }} {{ post.likes }}
      </el-button>
    </div>

    <!-- 评论区 -->
    <div class="comment-section">
      <h3 style="display: inline-block;">全部回复</h3>
      <el-button
        size="small"
        type="text"
        @click="() => { showOnlyAuthor = !showOnlyAuthor; currentPage = 1 }"
        style="margin-left: 10px;"
      >
        {{ showOnlyAuthor ? '查看全部' : '只看楼主' }}
      </el-button>

      <el-divider />
      <div v-if="nestedComments.length === 0" class="no-comments">暂无评论</div>

      <div class="comment-list">
        <div class="comment-item" v-for="(comment, index) in pagedTopLevelComments" :key="comment.id">
          <!-- 主楼评论 -->
          <div class="comment-header">
            <el-avatar :src="getAvatarUrl(comment.user?.avatar)" size="large" />
            <div class="header-info">
              <strong>{{ comment.user?.username }}</strong>
              <div class="meta">
                #{{ index + 1 + (currentPage - 1) * pageSize }}楼 | {{ formatTime(comment.createTime) }}
              </div>
            </div>
          </div>
          <div class="comment-body" v-html="marked.parse(comment.content)" />

          <!-- 回复按钮 -->
          <div class="sub-meta">
            <el-button text size="small" class="reply-btn" @click="toggleReply(comment.id)">回复</el-button>
          </div>

          <!-- 回复框 -->
          <div v-if="replyVisibleMap[comment.id]" class="reply-box">
            <div :ref="el => replyEditorRoots[comment.id] = el" class="editor-root" />
            <el-button
              size="small"
              type="primary"
              style="margin-top: 5px"
              @click="submitReply(comment.id)"
            >提交回复</el-button>
          </div>

          <!-- 子评论 -->
          <div v-if="comment.flatReplies?.length" class="sub-comment-box">
            <div
              class="sub-comment"
              v-for="reply in getDisplayReplies(comment)"
              :key="reply.id"
            >
              <div class="sub-header">
                <el-avatar :src="getAvatarUrl(reply.user?.avatar)" size="small" />
                <strong>{{ reply.user?.username }}</strong>
                <span class="reply-text">
                  回复 {{ reply.replyTo?.username || '楼主' }}：
                  <i class="quoted">{{ extractPlainText(reply.replyTo?.content) }}</i>
                </span>
              </div>
              <div class="sub-body" v-html="marked.parse(reply.content)" />
              <div class="sub-meta">
                {{ formatTime(reply.createTime) }}
                <el-button text size="small" class="reply-btn" @click="toggleReply(reply.id)">回复</el-button>
              </div>

              <div v-if="replyVisibleMap[reply.id]" class="reply-box">
                <div :ref="el => replyEditorRoots[reply.id] = el" class="editor-root" />
                <el-button
                  size="small"
                  type="primary"
                  style="margin-top: 5px"
                  @click="submitReply(reply.id)"
                >提交回复</el-button>
              </div>
            </div>

            <!-- 子评论分页 -->
            <div class="expand-btn" v-if="comment.flatReplies.length > 3 && !replyControlMap[comment.id]?.showAll">
              <el-button size="small" type="link" @click="toggleShowAll(comment.id)">
                展开全部 {{ comment.flatReplies.length }} 条回复
              </el-button>
            </div>
            <div class="pagination-controls" v-if="replyControlMap[comment.id]?.showAll">
              <el-button size="small" @click="changePage(comment.id, -1)" :disabled="replyControlMap[comment.id].page === 1">
                上一页
              </el-button>
              <el-button
                v-for="p in Math.ceil(comment.flatReplies.length / 5)"
                :key="p"
                size="small"
                :type="replyControlMap[comment.id].page === p ? 'primary' : 'default'"
                @click="jumpToPage(comment.id, p)"
              >{{ p }}</el-button>
              <el-button
                size="small"
                @click="changePage(comment.id, 1)"
                :disabled="replyControlMap[comment.id].page >= Math.ceil(comment.flatReplies.length / 5)"
              >下一页</el-button>
              <el-button type="link" size="small" @click="toggleShowAll(comment.id)">收起</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- ✅ 主评论分页 -->
      <div class="floor-pagination" v-if="totalPages > 1">
        <el-button size="small" :disabled="currentPage === 1" @click="currentPage--">上一页</el-button>
        <el-button
          v-for="p in totalPages"
          :key="p"
          size="small"
          :type="p === currentPage ? 'primary' : 'default'"
          @click="currentPage = p"
        >
          {{ p }}
        </el-button>
        <el-button size="small" :disabled="currentPage === totalPages" @click="currentPage++">下一页</el-button>
      </div>
    </div>

    <!-- 发表评论 -->
    <div class="comment-box">
      <div ref="commentEditorRoot" class="editor-root" />
      <el-button type="primary" style="margin-top: 10px" @click="submitComment">发表评论</el-button>
    </div>
  </div>

  <div v-else class="loading">
    <el-skeleton :rows="5" animated />
  </div>
</template>



<script setup>
import { ref, onMounted, nextTick, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import { useUserStore } from '@/store/user'
import Editor from '@toast-ui/editor'

const replyEditorRefs = ref({})
const replyEditorRoots = reactive({})

const commentEditorRoot = ref(null)
let commentEditorInstance = null
const nestedComments = ref([])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const post = ref(null)
const htmlContent = ref('')

const mode = route.query.from || ''
const id = route.params.id
const replyVisibleMap = ref({})
const replyContentMap = ref({})

const replyControlMap = ref({})  // 每层评论分页控制
const liked = ref(false)
const likeKey = `liked_post_${id}`

const showOnlyAuthor = ref(false)

const currentPage = ref(1)
const pageSize = 10

const pagedTopLevelComments = computed(() => {
  const list = filteredTopLevelComments.value
  const start = (currentPage.value - 1) * pageSize
  return list.slice(start, start + pageSize)
})

const totalPages = computed(() =>
  Math.ceil(filteredTopLevelComments.value.length / pageSize)
)

const handleLike = async () => {
  const url = liked.value
    ? `http://localhost:8080/api/post/${id}/unlike`
    : `http://localhost:8080/api/post/${id}/like`

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    const json = await res.json()
    if (json.code === 200) {
      liked.value = !liked.value
      post.value.likes = json.likes
      if (liked.value) {
        localStorage.setItem(likeKey, '1')
        ElMessage.success('点赞成功')
      } else {
        localStorage.removeItem(likeKey)
        ElMessage.success('已取消点赞')
      }
    } else {
      ElMessage.error(json.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('网络错误，操作失败')
  }
}



const getDisplayReplies = (comment) => {
  const replies = comment.flatReplies || []
  const control = replyControlMap.value[comment.id]
  if (!control) return replies.slice(0, 3)
  if (!control.showAll) return replies.slice(0, 3)
  const start = (control.page - 1) * 5
  return replies.slice(start, start + 5)
}

const toggleShowAll = (commentId) => {
  const control = replyControlMap.value[commentId] || { showAll: false, page: 1 }
  replyControlMap.value[commentId] = { ...control, showAll: !control.showAll, page: 1 }
}

const changePage = (commentId, delta) => {
  const control = replyControlMap.value[commentId]
  if (!control) return
  const totalPages = Math.ceil(nestedComments.value.find(c => c.id === commentId)?.flatReplies.length / 5)
  const newPage = Math.min(Math.max(1, control.page + delta), totalPages)
  replyControlMap.value[commentId].page = newPage
}

const jumpToPage = (commentId, page) => {
  replyControlMap.value[commentId].page = page
}

const toggleReply = async (id) => {
  replyVisibleMap.value[id] = !replyVisibleMap.value[id]
  if (replyVisibleMap.value[id] && !replyEditorRefs.value[id]) {
    await nextTick()
    const el = replyEditorRoots[id]
    if (!el) {
      console.warn(`❌ replyEditorRoots[${id}] 不存在`)
      return
    }

    const instance = new Editor({
      el,
      height: '150px',
      initialEditType: 'markdown',
      previewStyle: 'tab',
      hideModeSwitch: true,
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          const formData = new FormData()
          formData.append('file', blob)
          const res = await fetch('http://localhost:8080/api/upload', {
            method: 'POST',
            body: formData
          })
          const json = await res.json()
          if (json.url) {
            callback(`http://localhost:8080${json.url}`, blob.name)
          } else {
            ElMessage.error(json.error || '上传失败')
          }
        }
      }
    })

    // 捕获 mismatched transaction 报错（可选）
    const pmView = instance.mdEditor?.view
    if (pmView && typeof pmView.dispatchTransaction === 'function') {
      const oldDispatch = pmView.dispatchTransaction.bind(pmView)
      pmView.dispatchTransaction = (tr) => {
        try {
          oldDispatch(tr)
        } catch (err) {
          if (err instanceof RangeError && /mismatched transaction/.test(err.message)) {
            console.warn(`🍞 [Editor ${id}] 忽略 mismatched transaction`, err)
          } else {
            throw err
          }
        }
      }
    } else {
      console.warn(`⚠️ Toast UI Editor ${id} 的 ProseMirror view 尚未初始化`)
    }


    replyEditorRefs.value[id] = instance
  }
}

const submitReply = async (parentId) => {
  const editor = replyEditorRefs.value[parentId]
  if (!editor) return ElMessage.error('回复编辑器未加载')
  const content = editor.getMarkdown()
  if (!content.trim()) return ElMessage.warning('回复内容不能为空')

  try {
    const res = await fetch('http://localhost:8080/api/comment/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token}`
      },
      body: JSON.stringify({ postId: id, parentId, content })
    })
    const json = await res.json()
    if (json.code === 200) {
      ElMessage.success('回复成功')
      replyContentMap.value[parentId] = ''
      replyVisibleMap.value[parentId] = false
      await loadNestedComments()
    } else {
      ElMessage.error(json.message)
    }
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const submitComment = async () => {
  if (!commentEditorInstance) return ElMessage.error('评论编辑器尚未加载')
  const content = commentEditorInstance.getMarkdown()
  if (!content.trim()) return ElMessage.warning('评论不能为空')

  try {
    const res = await fetch('http://localhost:8080/api/comment/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token}`
      },
      body: JSON.stringify({ postId: id, content })
    })
    const json = await res.json()
    if (json.code === 200) {
      ElMessage.success('评论成功')
      commentEditorInstance.setMarkdown('')
      await loadNestedComments()
    } else {
      ElMessage.error(json.message)
    }
  } catch (err) {
    ElMessage.error('评论提交失败')
  }
}

const loadPost = async () => {
  // 如果不是审核模式，增加浏览量
  if (mode !== 'check') {
    await fetch(`http://localhost:8080/api/post/${id}/view`, { method: 'PUT' })
  }

  const endpoint = mode === 'check'
    ? `http://localhost:8080/api/checkPost/detail?id=${id}`
    : `http://localhost:8080/api/post/detail?id=${id}`

  try {
    const res = await fetch(endpoint, {
      headers: mode !== 'check' && userStore.token
        ? { Authorization: `Bearer ${userStore.token}` }
        : {}
    })
    const json = await res.json()
    if (json.code === 200) {
      post.value = json.data
      htmlContent.value = marked.parse(json.data.content || '')

      // ✅ 设置点赞状态（后端返回 liked 字段）
      liked.value = !!json.data.liked
    } else {
      ElMessage.error(json.message || '帖子不存在')
    }
  } catch (err) {
    ElMessage.error('加载帖子失败')
  }
}


const loadNestedComments = async () => {
  if (mode === 'check') return 
  const res = await fetch(`http://localhost:8080/api/comment/flat?postId=${id}`)
  const json = await res.json()
  const flatList = json || []
  nestedComments.value = buildDisplayComments(flatList)
}

const buildDisplayComments = (comments) => {
  const commentMap = new Map()
  comments.forEach(c => commentMap.set(c.id, { ...c, replies: [] }))
  for (const comment of commentMap.values()) {
    if (comment.parentId && comment.parentId !== 0) {
      const parent = commentMap.get(comment.parentId)
      if (parent) {
        parent.replies.push(comment)
        comment.replyTo = {
          username: parent.user?.username || '楼主',
          content: parent.content
        }
      }
    }
  }

  const roots = []
  for (const comment of commentMap.values()) {
    if (!comment.parentId || comment.parentId === 0) {
      const flatReplies = []
      const dfs = (node) => {
        for (const reply of node.replies) {
          flatReplies.push(reply)
          dfs(reply)
        }
      }
      dfs(comment)
      comment.flatReplies = flatReplies
      comment._level = 1
      roots.push(comment)
      if (!replyControlMap.value[comment.id]) {
        replyControlMap.value[comment.id] = { showAll: false, page: 1 }
      }
    }
  }
  return roots
}

const topLevelComments = computed(() =>
  nestedComments.value.filter(c => c._level === 1)
)

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').slice(0, 19) : ''
const getAvatarUrl = (path) => (!path ? '' : path.startsWith('http') ? path : `http://localhost:8080${path}`)
const extractPlainText = (markdown) => {
  if (!markdown) return ''
  const stripped = markdown.replace(/!\[.*?\]\(.*?\)/g, '图片')
  return stripped.length > 30 ? stripped.slice(0, 30) + '...' : stripped
}

// 审核相关操作
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
      router.push('/admin')
    } else {
      ElMessage.error(json.message)
    }
  } catch (err) {
    ElMessage.error('审核失败')
  }
}

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
const filteredTopLevelComments = computed(() => {
  if (!showOnlyAuthor.value) return nestedComments.value
  const authorName = post.value?.author?.username
  return nestedComments.value.filter(c => c.user?.username === authorName)
})

onMounted(async () => {
  await loadPost()
  await loadNestedComments()
   // ✅ 检查 localStorage 是否标记已点赞
  if (localStorage.getItem(likeKey)) {
    liked.value = true
  }
  await nextTick()
  if (commentEditorRoot.value) {
    commentEditorInstance = new Editor({
      el: commentEditorRoot.value,
      height: '200px',
      initialEditType: 'markdown',
      previewStyle: 'tab',
      hideModeSwitch: true,
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          const formData = new FormData()
          formData.append('file', blob)
          const res = await fetch('http://localhost:8080/api/upload', {
            method: 'POST',
            body: formData
          })
          const json = await res.json()
          if (json.url) {
            const fullUrl = `http://localhost:8080${json.url}`
            callback(fullUrl, blob.name)
          } else {
            ElMessage.error(json.error || '上传失败')
          }
        }
      }
    })
  } else {
    ElMessage.error('评论编辑器未找到挂载节点')
  }
})
</script>


<style>
.post-detail-container {
  max-width: 1200px; /* 原为 900px，现加宽至 1200px */
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
  font-size: 12px;
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

.no-comments {
  color: #aaa;
  font-style: italic;
  margin: 20px 0;
}

.comment-list {
  margin-top: 20px;
}

.comment-item {
  padding: 20px;
  background: #fdfdfd;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 30px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.comment-body {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin-top: 10px;
  white-space: pre-wrap;
}

.comment-body img {
  max-width: 60%;
  height: auto;
  display: block;
  margin: 10px 0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sub-comment-box {
  margin-top: 20px;
  padding: 15px;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.sub-comment {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.sub-comment:last-child {
  border-bottom: none;
}

.sub-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  margin-bottom: 5px;
}

.reply-text {
  margin-left: 4px;
  color: #555;
}

.quoted {
  color: #999;
  font-style: italic;
}

.sub-body {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  margin: 4px 0;
}

.comment-box {
  margin-top: 40px;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  position: relative;
}

.editor-root {
  margin-top: 10px;
}

.sub-meta {
  font-size: 12px;
  color: #aaa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.reply-btn {
  margin-left: auto;
  font-size: 12px;
  color: #409EFF;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.expand-btn {
  margin-top: 8px;
  text-align: right;
}

.pagination-controls {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.sub-body img {
  max-width: 50%;          /* 控制宽度 */
  max-height: 150px;       /* 限制最大高度，防止超长图撑高 */
  display: block;
  margin: 10px 0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain;     /* 保证图片缩放时比例正常 */
}

.like-section {
  margin: 15px 0;
}
.floor-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

</style>
