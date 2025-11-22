import MainLayout from '../Layout/Main-layout.vue'
import LoginView from '../view/login-view.vue'
import { createRouter, createWebHistory } from 'vue-router'
import LikeView from '../view/like-view.vue'
import Home from '../components/Home.vue'
import Login from '../components/Login.vue'
import RegisterView from '../view/register-view.vue'
import Profile from '../view/me/Profile.vue'
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


router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isLogin = authStore.isLogin;

  if (to.meta.requiresAuth && !isLogin) {
    next('/login');
  } else if (to.path === '/login' && isLogin) {
    next('/home');
  } else {
    next();
  }
});

export default router