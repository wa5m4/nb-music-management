import axios from 'axios'
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://10.27.252.62:9527',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api