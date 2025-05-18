<template>
  <div class="admin-dashboard">
    <!-- 左侧导航栏 -->
    <el-menu class="sidebar" :default-active="activeMenu" @select="handleMenuClick">
      <el-menu-item index="review">人工审核</el-menu-item>
      <el-menu-item index="posts">帖子管理</el-menu-item>
      <el-menu-item index="users">用户管理</el-menu-item>
    </el-menu>

    <!-- 右侧内容区域 -->
    <div class="main-content">
      <!-- 人工审核 -->
      <template v-if="activeMenu === 'review'">
        <h2>待人工审核的帖子</h2>
        <el-table :data="checkPosts" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="author" label="作者" width="120" />
          <el-table-column prop="createTime" label="提交时间" width="180" />
          <el-table-column prop="riskLevel" label="风险等级" width="100" />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
                <el-button size="small" @click="viewPost(row.id, 'check')">查看</el-button>
                <el-button type="success" size="small" @click="approve(row.id)">通过</el-button>
                <el-button type="danger" size="small" @click="remove(row.id)">删除</el-button>

            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          style="margin-top: 20px"
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="(p) => { currentPage = p; fetchData('review') }"
        />
      </template>
            <!-- 帖子管理 -->
      <template v-else-if="activeMenu === 'posts'">
        <h2>已发布的帖子</h2>
        <el-table :data="posts" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="author" label="作者" width="120" />
          <el-table-column prop="createTime" label="发布时间" width="180" />
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
                <el-button size="small" @click="viewPost(row.id)">查看</el-button>
                <el-button type="primary" size="small" @click="toggleFeatured(row.id, row.featured)">
                {{ row.featured ? '取消精华' : '设为精华' }}
                </el-button>
                <el-button type="danger" size="small" @click="deletePost(row.id)">删除</el-button>

            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          style="margin-top: 20px"
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="(p) => { currentPage = p; fetchData('posts') }"
        />
      </template>

      <!-- 用户管理 -->
      <template v-else-if="activeMenu === 'users'">
        <h2>所有注册用户</h2>
        <el-table :data="users" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="isAdmin" label="是否管理员" :formatter="boolText" />
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-button
                size="small"
                :type="row.isAdmin ? 'warning' : 'primary'"
                @click="row.isAdmin ? unsetAdmin(row.username) : setAdmin(row.username)"
              >
                {{ row.isAdmin ? '取消管理员' : '设为管理员' }}
              </el-button>
              <el-button
                size="small"
                :type="row.enabled ? 'danger' : 'success'"
                @click="row.enabled ? banUser(row.username) : unbanUser(row.username)"
              >
                {{ row.enabled ? '封禁账号' : '解除封禁' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          style="margin-top: 20px"
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="(p) => { currentPage = p; fetchData('users') }"
        />
      </template>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const activeMenu = ref(localStorage.getItem('adminActiveMenu') || 'review')
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

const checkPosts = ref([])
const posts = ref([])
const users = ref([])

const boolText = (row, column, value) => (value ? '是' : '否')

const handleMenuClick = async (key) => {
  activeMenu.value = key
  localStorage.setItem('adminActiveMenu', key)
  currentPage.value = 1
  await fetchData(key)
}


const fetchData = async (type) => {
  let url = ''
  if (type === 'review') url = `http://localhost:8080/api/checkPost/page?page=${currentPage.value}&size=${pageSize}`
  if (type === 'posts') url = `http://localhost:8080/api/post/adminPage?page=${currentPage.value}&size=${pageSize}`
  if (type === 'users') url = `http://localhost:8080/api/admin/userPage?page=${currentPage.value}&size=${pageSize}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    })
    const res = await response.json()
    if (res.code === 200 && res.data) {
    const { records, total: count } = res.data
    if (type === 'review') checkPosts.value = records
    if (type === 'posts') posts.value = records
    if (type === 'users') users.value = records
    total.value = count
    }
    else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('服务器连接失败')
  }
}


onMounted(() => {
  fetchData(activeMenu.value)
})


// 审核通过
const approve = async (id) => {
  try {
    const res = await fetch('http://localhost:8080/api/checkPost/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success('审核通过');
      fetchData('review');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

// 删除待审核帖子
const remove = async (id) => {
  try {
    const res = await fetch('http://localhost:8080/api/checkPost/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success('已删除');
      fetchData('review');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

// 删除正式帖子
const deletePost = async (id) => {
  try {
    const res = await fetch('http://localhost:8080/api/post/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success('已删除帖子');
      fetchData('posts');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

// 精华切换
const toggleFeatured = async (id, currentStatus) => {
  try {
    const res = await fetch('http://localhost:8080/api/post/toggleFeatured', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success(json.message);
      fetchData('posts');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

// 管理员权限控制
const setAdmin = async (username) => {
  try {
    const res = await fetch('http://localhost:8080/api/admin/makeAdmin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ username })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success('已设为管理员');
      fetchData('users');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const unsetAdmin = async (username) => {
  try {
    const res = await fetch('http://localhost:8080/api/admin/unsetAdmin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ username })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success('已取消管理员');
      fetchData('users');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

// 封禁 & 解封
const banUser = async (username) => {
  try {
    const res = await fetch('http://localhost:8080/api/admin/ban', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ username })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success('账号已封禁');
      fetchData('users');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const unbanUser = async (username) => {
  try {
    const res = await fetch('http://localhost:8080/api/admin/unban', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ username })
    });
    const json = await res.json();
    if (json.code === 200) {
      ElMessage.success('账号已解封');
      fetchData('users');
    } else {
      ElMessage.error(json.message);
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const viewPost = (id, mode = '') => {
  if (mode === 'check') {
    router.push(`/post/${id}?from=check`)
  } else {
    router.push(`/post/${id}`)
  }
}

</script>

<style scoped>
.admin-dashboard {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 200px;
  border-right: 1px solid #ddd;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>


<style scoped>
.admin-dashboard {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 200px;
  border-right: 1px solid #ddd;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
