import { defineStore } from 'pinia'
import { ref,computed } from 'vue'
import { useRouter } from 'vue-router'
import axios, { type AxiosResponse } from 'axios'
import api, { setAdminToken, clearAdminToken } from '../services/api'
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
    const isAdmin = ref<boolean>(localStorage.getItem('isAdmin') === 'true')

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
        // 使用传入的 credentials（注意已经校验密码格式）
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

        // 按照 src/types/index.ts 中的 User 接口映射并使用默认值防止缺失字段导致类型/使用不一致
        const d = responseData.data;
        const mappedUser = {
            username: d.username || d.email || 'unknown',
            email: d.email || '',
            sex: d.sex || '未知',
            id: d.id,
            status: d.status,
            avatar: d.avatar
        };
        user.value = mappedUser;

        // 持久化存储
        localStorage.setItem('token', responseData.data.token);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        // 如果之前处于管理员快速登录状态，清理管理员标识与 token header，使用当前登录的正常 token
        try {
            isAdmin.value = false
            localStorage.removeItem('isAdmin')
            clearAdminToken()
        } catch (e) {
            console.debug('清理管理员 token 失败', e)
        }

        return true;
        }
        
        // 后端返回业务错误（如账号/密码错误） — 给出友好提示，不直接展示错误码
        error.value = '账号或者密码错误'
        return false;
    } catch (err) {
        // 网络错误或请求异常
        if (axios.isAxiosError(err)) {
            // 无论后端返回 4xx/5xx 或请求异常，统一提示账号或密码错误以避免暴露内部错误码
            error.value = '账号或者密码错误'
        } else {
            error.value = err instanceof Error ? err.message : '登录过程发生未知错误'
        }
        return false
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
        // 同时清理管理员标识
        isAdmin.value = false
        localStorage.removeItem('isAdmin')
        router.push('/login')
    }

    // 管理员标识管理
    const ADMIN_QUICK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE4MzIwNzcyNzEsInVzZXJJZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.os_tB3lYYnz9J6Zfz_sqEBSZ2G8FvIUiTqs9I2Vzu7g'

    const setAdmin = (flag: boolean) => {
        isAdmin.value = !!flag
        if (flag) {
            localStorage.setItem('isAdmin', 'true')
            // 在所有请求中添加管理员 token（键名为 'token'）
            try {
                setAdminToken(ADMIN_QUICK_TOKEN)
                // 也把 token 持久化到 localStorage，便于页面刷新后仍然保持请求头
                localStorage.setItem('token', ADMIN_QUICK_TOKEN)
            } catch (e) {
                console.error('设置管理员 token 失败', e)
            }
        } else {
            localStorage.removeItem('isAdmin')
            try {
                clearAdminToken()
                localStorage.removeItem('token')
            } catch (e) {
                console.error('清除管理员 token 失败', e)
            }
        }
    }

    

    // 初始化用户信息
    const init = (): void => {
        if (token.value) {
            const savedUser = localStorage.getItem('user')
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser)
                    // 验证用户数据结构：后端可能未返回所有字段，我们至少要求包含 username 字段以视为有效用户数据
                    if (parsedUser && typeof parsedUser === 'object' && 'username' in parsedUser) {
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
        // 如果之前处于管理员模式，确保请求头包含管理员 token
        if (isAdmin.value) {
            try {
                setAdmin(!!isAdmin.value)
            } catch (e) {
                console.error('恢复管理员 token 失败', e)
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
        isAdmin,
        setAdmin,
        imgUrl,
        codeKey,
        login,
        register,
        logout,
        handlePic
    }
})
    

