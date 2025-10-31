import { defineStore } from 'pinia'
import { ref,computed } from 'vue'
import { useRouter } from 'vue-router'
import axios, { type AxiosResponse } from 'axios'
import api from '../services/api'
import {type ApiResponse, type LoginCredentials, type RegisterData, type User,type CaptchaResponse, type codeSendResponce } from '../types/index'

export const useAuthStore = defineStore('auth', () => {
    // 状态 - 基于自定义接口类型
    const user = ref<User | null>(null)
    const token = ref<string | null>(localStorage.getItem('token') || null)
    const isLoading = ref<boolean>(false)
    const error = ref<string | null>(null)
    const router = useRouter()
    const imgUrl = ref('')
    const codeKey = ref('')

    // 用于路由守卫的登录状态变量
    const isLogin = computed<boolean>(() => !!token.value && !!user.value)
    
    // 其他计算属性
    const isAuthenticated = computed<boolean>(() => isLogin.value)
    const userStatus = computed<string | null>(() => user.value?.status || null)

    // 登录方法（适配后端接口）
    const login = async (credentials: LoginCredentials): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;
    try {
        // 登录请求无需携带 token 头（登录前本地无 token）
        const response: AxiosResponse<ApiResponse> = await api.post(
        '/user/login', 
        credentials // 仅传递 username 和 password（后端要求）
        );

        const responseData = response.data;
        console.log('登录响应:', responseData); // 调试用

        // 后端成功条件：code=200 且 data 中包含 token（必填字段）
        if (responseData.code === 200 && responseData.data?.token) {
        // 从 data 字段读取 token 和用户信息（后端格式要求）
        token.value = responseData.data.token;
        user.value = responseData.data; // data 中包含完整用户信息（id、username 等）
        
        // 持久化存储
        localStorage.setItem('token', responseData.data.token);
        localStorage.setItem('user', JSON.stringify(responseData.data));
        
        return true;
        }
        
        // 后端返回业务错误（如账号密码错误）
        error.value = responseData.msg || '登录失败，请检查账号密码';
        return false;
    } catch (err) {
        // 网络错误或请求异常
        if (axios.isAxiosError(err)) {
        // 优先读取后端返回的 msg 字段（后端错误信息格式）
        error.value = err.response?.data?.msg || `登录失败（${err.message}）`;
        } else {
        error.value = err instanceof Error ? err.message : '登录过程发生未知错误';
        }
        return false;
    } finally {
        isLoading.value = false;
    }
    };

    // 注册方法
    const register = async (userData: RegisterData): Promise<boolean> => {
        isLoading.value = true
        error.value = null
        try {
            // 手动添加token到请求头（注册场景可能不需要，但保持一致性）
            const headers: Record<string, string> = {}
            if (token.value) {
                headers.Authorization = `Bearer ${token.value}`
            }

            const response: AxiosResponse<ApiResponse> = await api.post(
                '/user/register', 
                userData,
                { headers }
            )
            
            const responseData = response.data
            
            if (responseData.code == 200) {
                return true
            }
            
            error.value = responseData.msg
            return false
        } catch (err) {
            if (axios.isAxiosError(err)) {
                error.value = err.response?.data?.message || '注册请求失败'
            } else {
                error.value = err instanceof Error ? err.message : '注册失败'
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    const handlePic =async () => {
        const picRecieve = await api.get<CaptchaResponse>('/user/getCode')
        if(picRecieve.data.code == 200){
            console.log('获取验证码成功');
        }else{
            console.log(picRecieve.data.msg);
        }
         if (picRecieve.data.code === 200) {
            console.log('获取验证码成功');
            // 可安全访问 data 内的字段
            codeKey.value = picRecieve.data.data.codeKey;
            imgUrl.value = picRecieve.data.data.checkCodeBase64;
            console.log('验证码 key:', codeKey);
            console.log('验证码图片 base64:', imgUrl);
            } else {
            console.log('业务错误:', picRecieve.data.msg || '无提示信息');
        }
    }

    

    // 登出方法
    const logout = (): void => {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
    }

    

    // 初始化用户信息
    const init = (): void => {
        if (token.value) {
            const savedUser = localStorage.getItem('user')
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser)
                    // 验证用户数据结构
                    if (parsedUser && typeof parsedUser === 'object' && 'id' in parsedUser) {
                        user.value = parsedUser as User
                    } else {
                        throw new Error('用户数据结构不匹配')
                    }
                } catch (err) {
                    console.error('解析用户信息失败', err)
                    // 清除无效数据
                    localStorage.removeItem('user')
                    localStorage.removeItem('token')
                    token.value = null
                    user.value = null
                }
            }
        }
    }

    // 初始化
    init()

    return {
        user,
        token,
        isLoading,
        error,
        isLogin,
        isAuthenticated,
        userStatus,
        imgUrl,
        codeKey,
        login,
        register,
        logout,
        handlePic
    }
})
    

