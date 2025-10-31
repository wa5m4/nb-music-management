import { createApp } from 'vue'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'


const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(ElementPlus);
app.use(pinia);
app.use(router);
app.mount('#app')

