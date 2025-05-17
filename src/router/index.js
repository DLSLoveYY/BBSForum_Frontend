import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Forum from '../views/Forum.vue' // ✅ 引入论坛主页
import AddPost from '../views/AddPost.vue'
const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forum', component: Forum },       // ✅ 添加论坛路由
  { path: '/', redirect: '/forum' },// ✅ 默认跳转到论坛主页
  { path: '/post/add', component: AddPost }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
