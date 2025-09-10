import { createApp } from 'vue'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createStore } from 'vuex';
import './style.css'
import App from './App.vue'

const app = createApp(App)

const routes = [
    {
        path: '/home',
        component: () => import('./views/MainView.vue')
    },
    {
        path: "/",
        component: () => import('./views/MainView.vue')
    },
    {
        path: "/discover",
        component: () => import('./views/Discover.vue')
    },
    {
        path: "/subscribe",
        component: () => import("./views/Subscribe.vue")
    },
    {
        path: "/profile",
        component: () => import("./views/me/Profile.vue")
    },
    {
        path: "/search/:query",
        component: () => import("./views/SearchResult.vue"),
        props: true
    },
    {
        path: '/like',
        component: () => import('./views/me/Like.vue')
    },
    {
        path: '/upload',
        component: () => import('./views/me/Upload.vue')
    }
]



const router = createRouter({
    history: createMemoryHistory(),
    routes
})

const store = createStore({
    state() {
        return {
            count: 0
        }
    },
    mutations: {
        increment(state) {
            state.count++
        }
    }
})

app.use(router);
app.use(ElementPlus);
app.use(store);
app.mount('#app')

