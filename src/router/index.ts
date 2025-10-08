import MainLayout from '../Layout/Main-layout.vue'
import PasswordLogin from '../view/passwordLogin.vue'
import MessageLogin from '../view/messageLogin.vue'
import { createRouter, createWebHistory } from 'vue-router'
import LikeView from '../view/like-view.vue'
import Home from '../components/Home.vue'
import Login from '../components/Login.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    children: [
      {
        path: "messageLogin",
        name: "messageLogin",
        component: MessageLogin
      },
      {
        path: "", // 默认显示密码登录
        name: "passwordLogin",
        component: PasswordLogin
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
        path: 'like',
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
import { useGlobalStore } from '../store';

router.beforeEach((to, from, next) => {
  const store = useGlobalStore();
  const isLogin = store.isLogin;

  if (to.meta.requiresAuth && !isLogin) {
    next('/login');
  } else if (to.path === '/login' && isLogin) {
    next('/home');
  } else {
    next();
  }
});

export default router