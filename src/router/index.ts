import MainLayout from '../Layout/Main-layout.vue'
import LoginView from '../view/login-view.vue'
import AdminLayout from '../Layout/Admin-layout.vue'
import Splash from '../view/Splash.vue'
import DashboardView from '../view/admin/DashboardView.vue'
import UsersView from '../view/admin/UsersView.vue'
import SongsView from '../view/admin/SongsView.vue'
import AdsView from '../view/admin/AdsView.vue'
import SettingsView from '../view/admin/SettingsView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import LikeView from '../view/like-view.vue'
import Home from '../components/Home.vue'
import Login from '../components/Login.vue'
import RegisterView from '../view/register-view.vue'
import Profile from '../view/me/Profile.vue'
import UserSettings from '../view/me/Settings.vue'
import collectList from '../view/collectList.vue'
import UploadView from '../view/upload.vue'

const routes = [
  {
    path: '/splash',
    name: 'splash',
    component: Splash
  },
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
      { path: 'ads', name: 'ads', component: AdsView },
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
        path: 'upload',
        name: 'upload',
        component: UploadView,
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
  // 若首次打开，且尚未标记已查看 teamIntro（teamIntroSeen !== '1'），则优先展示 /splash
  try {
    const seen = localStorage.getItem('teamIntroSeen') === '1'
    const sessionSkip = (typeof sessionStorage !== 'undefined') && sessionStorage.getItem('splashSkipped') === '1'
    // 若既未持久标记也未在本会话跳过，则强制展示 /splash（避免循环）
    if (!seen && !sessionSkip && to.path !== '/splash') {
      next({ path: '/splash' })
      return
    }
    // 如果已持久标记并访问 /splash，则引导到登录页（避免用户被困）
    if (seen && to.path === '/splash') {
      next({ path: '/login' })
      return
    }
  } catch (e) {
    // ignore storage errors
  }
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