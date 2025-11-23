import MainLayout from '../Layout/Main-layout.vue'
import LoginView from '../view/login-view.vue'
import AdminLayout from '../Layout/Admin-layout.vue'
import DashboardView from '../view/admin/DashboardView.vue'
import UsersView from '../view/admin/UsersView.vue'
import SongsView from '../view/admin/SongsView.vue'
import SettingsView from '../view/admin/SettingsView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import LikeView from '../view/like-view.vue'
import Home from '../components/Home.vue'
import Login from '../components/Login.vue'
import RegisterView from '../view/register-view.vue'
import Profile from '../view/me/Profile.vue'
import UserSettings from '../view/me/Settings.vue'
import collectList from '../view/collectList.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    children: [
      {
        path: "registerview",
        name: "registerview",
        component: RegisterView
      },
      {
        path: "", // 默认显示密码登录
        name: "loginview",
        component: LoginView
      },
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardView },
      { path: 'users', name: 'users', component: UsersView },
      { path: 'songs', name: 'songs', component: SongsView },
      { path: 'settings', name: 'settings', component: SettingsView }
    ]
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'home',
        name: 'home',
        component: Home,
        meta: { requiresAuth: true }
      },
      {
        path: 'collect',
        name: 'collect',
        component: collectList,
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'profile',
        component: Profile,
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'usersettings',
        component: UserSettings,
        meta: { requiresAuth: true }
      },
      {
        path: 'like/:id', // 增加动态参数 :id
        name: 'like',
        component: LikeView,
        meta: { requiresAuth: true }
      },
      {
        path: '',
        redirect: 'home'
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫保持不变
import { useAuthStore } from '../store/auth'


router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isLogin = !!(authStore.isLogin && (authStore.isLogin as any).value !== undefined ? (authStore.isLogin as any).value : authStore.isLogin)
  const isAdmin = !!(authStore.isAdmin && (authStore.isAdmin as any).value !== undefined ? (authStore.isAdmin as any).value : authStore.isAdmin)

  // 管理页保护：匹配所有 /admin 子路由
  if (to.path.startsWith('/admin') && !isAdmin) {
    next('/login')
    return
  }

  if (to.meta.requiresAuth && !isLogin) {
    next('/login');
  } else if (to.path === '/login' && isLogin) {
    next('/home');
  } else {
    next();
  }
});

export default router