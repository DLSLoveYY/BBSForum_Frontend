<template>
  <div class="add-post-container">
    <el-card>
      <h2>发表新帖子</h2>
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>

        <!-- Toast UI 编辑器挂载点 -->
        <el-form-item label="内容">
            <div ref="editorRoot" class="editor-root" />
        </el-form-item>


        <!-- 表情按钮 -->
        <el-form-item>
          <el-button @click.stop="toggleEmoji">😀 插入表情</el-button>
        </el-form-item>
        <div v-if="showEmoji" ref="emojiWrapper" class="emoji-popover">
          <emoji-picker @select="onEmojiSelect" />
        </div>

        <!-- 图片上传 -->

        <!-- 提交按钮区域 -->
        <el-form-item>
          <div class="button-align-right">
            <el-space>
              <el-button @click="saveDraft">保存草稿</el-button>
              <el-button @click="cancel">取消</el-button>
              <el-button type="primary" @click="submitPost">提交</el-button>
            </el-space>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import '@toast-ui/editor/dist/toastui-editor.css'
import Editor from '@toast-ui/editor'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { addPostApi } from '@/api/post'

// 表单数据
const form = ref({
  title: ''
})

// 编辑器实例及挂载 DOM
const editorRoot = ref(null)
let editorInstance = null

onMounted(async () => {
  // 初始化编辑器
  editorInstance = new Editor({
    el: editorRoot.value,
    height: '400px',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    hideModeSwitch: true,
    hooks: {
      addImageBlobHook: async (blob, callback) => {
        const formData = new FormData();
        formData.append('file', blob);

        try {
          const response = await fetch('http://localhost:8080/api/upload', {
            method: 'POST',
            body: formData
          });

          const res = await response.json();
          if (response.ok && res.url) {
            const fullUrl = `http://localhost:8080${res.url}`;
            callback(fullUrl, blob.name);
          } else {
            ElMessage.error(res.error || '图片上传失败');
          }
        } catch (err) {
          console.error('图片上传异常:', err);
          ElMessage.error('图片上传出错');
        }
      }
    }
  });

  await nextTick();

  // 👇 检查草稿是否存在，但不直接加载
  try {
    const response = await fetch('http://localhost:8080/api/draft/latest', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    });

    const res = await response.json();
    console.log('草稿检查返回：', res);

    if (response.ok && res.code === 0 && res.data) {
      // 弹窗确认加载草稿
      ElMessageBox.confirm(
        '检测到你有未提交的草稿，是否加载？',
        '提示',
        {
          confirmButtonText: '确定加载',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        form.value.title = res.data.title || ''
        editorInstance.setMarkdown(res.data.content || '')
        ElMessage.success('草稿已加载')
      }).catch(() => {
        ElMessage.info('已取消加载草稿')
      });
    }

  } catch (err) {
    console.error('草稿检查失败:', err);
  }

  document.addEventListener('click', handleClickOutside);
});




onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 路由 & 用户
const router = useRouter()
const userStore = useUserStore()

// Emoji 控制
const showEmoji = ref(false)
const emojiWrapper = ref(null)

const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value
}

const onEmojiSelect = (emoji) => {
  editorInstance.insertText(emoji.i)
  showEmoji.value = false
}

const handleClickOutside = (event) => {
  if (
    showEmoji.value &&
    emojiWrapper.value &&
    !emojiWrapper.value.contains(event.target)
  ) {
    showEmoji.value = false
  }
}

// 上传图片并插入 Markdown
const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('http://localhost:8080/api/upload', {
      method: 'POST',
      body: formData
    })

    console.log('响应状态码：', response.status)

    const res = await response.json()
    console.log('上传结果：', res)

    if (response.ok && res.url) {
      const fullUrl = `http://localhost:8080${res.url}`
      editorInstance.insertText(`![图片](${fullUrl})\n`)
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.error || '上传失败')
    }

  } catch (err) {
    console.error('上传异常：', err)
    ElMessage.error('上传出错')
  }

  event.target.value = ''
}

// 提交帖子
const submitPost = async () => {
  const content = editorInstance.getMarkdown()
  const title = form.value.title

  // 前端校验
  if (!title || !content.trim()) {
    ElMessage.warning('标题和内容不能为空')
    return
  }

  try {
    const response = await fetch('http://localhost:8080/api/post/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}` // 如果你需要登录鉴权
      },
      body: JSON.stringify({
        title,
        content
      })
    })

    const res = await response.json()

    if (response.ok && res.code === 200) {
      ElMessage.success('发帖成功，待审核中')
      router.push('/forum') // 成功后跳转到论坛首页
    } else {
      ElMessage.error(res.message || '提交失败')
    }

  } catch (error) {
    console.error('提交出错', error)
    ElMessage.error('网络异常，提交失败')
  }
}


const saveDraft = async () => {
  const content = editorInstance.getMarkdown()
  const title = form.value.title

  // 简单校验
  if (!title || !content.trim()) {
    ElMessage.warning('标题和内容不能为空')
    return
  }

  try {
    const response = await fetch('http://localhost:8080/api/draft/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}` // 确保已登录
      },
      body: JSON.stringify({
        title,
        content
      })
    })

    const res = await response.json()

    if (response.ok && res.code === 0) {
      ElMessage.success('草稿保存成功！')
    } else {
      ElMessage.error(res.message || '草稿保存失败')
    }

  } catch (error) {
    console.error('保存草稿出错：', error)
    ElMessage.error('网络异常，草稿保存失败')
  }
}


const cancel = () => {
  router.push('/forum')
}
</script>


<style scoped>
.add-post-container {
  width: 90vw;
  max-width: 1100px;
  margin: 40px auto;
  padding: 20px;
}
.emoji-popover {
  position: absolute;
  z-index: 999;
  background: white;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.button-align-right {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

/* 限制 Toast UI Editor 中预览图片最大宽度 */
.toastui-editor-contents img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
.editor-root {
  width: 100%;
}
.toastui-editor {
  width: 100% !important; /* 保证编辑器本体也响应式 */
  box-sizing: border-box;
}

</style>