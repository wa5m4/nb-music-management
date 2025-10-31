import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 定义接口返回数据结构
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// GET 请求
export const get = <T>(url: string, params?: Record<string, any>): Promise<T> => {
  return service.get(url, { params });
};

// POST 请求
export const post = <T>(url: string, data?: Record<string, any>): Promise<T> => {
  return service.post(url, data);
};

// 上传请求
export const upload = <T>(url: string, formData: FormData): Promise<T> => {
  return service.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default service;