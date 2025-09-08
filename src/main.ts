import { createApp } from 'vue'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import { createRouter, createMemoryHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

const app = createApp(App)

const routes = [
    {
        path: '/home',
        component: () => import('./components/Home.vue')
    },
    {
        path: "/",
        component: () => import('./components/Home.vue')
    }
]



const router = createRouter({
    history: createMemoryHistory(),
    routes
})

app.use(router);
app.use(ElementPlus);
app.mount('#app')

