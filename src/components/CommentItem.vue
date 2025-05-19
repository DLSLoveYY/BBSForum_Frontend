<template>
  <div class="comment-item">
    <!-- 主楼 -->
    <div class="top-comment">
      <div class="comment-header">
        <el-avatar :src="getAvatarUrl(comment.user?.avatar)" size="large" />
        <div class="header-info">
          <strong>{{ comment.user?.username }}</strong>
          <span class="meta">发表于：{{ formatTime(comment.createTime) }}</span>
        </div>
      </div>
      <div class="comment-body" v-html="marked.parse(comment.content)" />
    </div>

    <!-- 子评论列表（集中展示） -->
    <div v-if="comment.replies && comment.replies.length" class="sub-comment-box">
      <div
        v-for="(reply, index) in comment.replies"
        :key="reply.id"
        class="sub-comment"
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
        <div class="sub-meta">{{ formatTime(reply.createTime) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { marked } from 'marked'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import { useUserStore } from '@/store/user'

const props = defineProps({
  comment: Object,
  postId: Number
})

const userStore = useUserStore()

// 时间格式化
const formatTime = (str) => str?.replace('T', ' ').slice(0, 19)

// 获取头像地址
const getAvatarUrl = (path) =>
  path?.startsWith('http') ? path : `http://localhost:8080${path}`

// 提取纯文本摘要，隐藏图片
const extractPlainText = (markdown) => {
  if (!markdown) return ''
  const stripped = markdown.replace(/!\[.*?\]\(.*?\)/g, '图片')
  return stripped.length > 30 ? stripped.slice(0, 30) + '...' : stripped
}
</script>

<style scoped>
.comment-item {
  margin-bottom: 30px;
  padding: 20px;
  background: #fdfdfd;
  border-radius: 8px;
  border: 1px solid #eee;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.header-info {
  margin-left: 10px;
}

.header-info .meta {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.comment-body {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-top: 10px;
}

.comment-body img {
  max-width: 100%;
  border-radius: 6px;
  margin: 10px 0;
  display: block;
}

/* 子评论统一集中在一块灰框中展示 */
.sub-comment-box {
  margin-top: 20px;
  padding: 15px;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.sub-comment {
  padding: 12px 0;
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
  color: #888;
  font-style: italic;
}

.sub-body {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  margin: 4px 0;
}

.sub-body img {
  max-width: 90%;
  border-radius: 4px;
  margin-top: 6px;
}

.sub-meta {
  font-size: 12px;
  color: #aaa;
  text-align: right;
}
</style>
