import axios from 'axios'

const api = axios.create({
    // 优先使用环境变量，回退到开发时的默认地址（若需要请替换成你的后端地址）
    baseURL:'http://192.168.95.146:9527',
    // 请求超时时间（毫秒）
    timeout: 10000,
    // 全局默认请求头，可在单次请求中覆盖
    headers: {
        'Content-Type': 'application/json'
    }
})

// 上传及大请求的超时时间（毫秒）
const UPLOAD_TIMEOUT = 60000 // 60s

// 请求拦截器：在请求发送前注入 token（若存在）
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
        config.headers['token'] = token
    }
    return config
}, (error) => {
    // 请求发送错误时的处理（例如记录日志）
    return Promise.reject(error)
})

export default api

/**
 * 获取音乐列表（参照文档：GET /music/list）
 * 支持的 query 参数示例：{ status, name, pageNum, pageSize, author, type }
 * 返回 axios 的 Promise，可在调用端访问 `resp.data`。
 */
export function getMusicList(params: Record<string, any>) {
    return api.get('/music/list', { params })
}

/** 获取指定用户的歌单（我的歌单） */
export function getUserPlaylists(userId: string | number) {
    // 后端实际使用 /musicList?id=<userId> 返回该用户创建的歌单列表
    return api.get('/musicList', { params: { id: userId } })
}

/** 歌单（MusicList）相关接口 */
export function createPlaylist(data: Record<string, any>) {
    return api.post('/musicList', data, { timeout: UPLOAD_TIMEOUT })
}

export function updatePlaylistList(data: Record<string, any>) {
    return api.put('/musicList', data)
}

export function deletePlaylist(id: string | number) {
    return api.delete(`/musicList/${id}`)
}

export function getPlaylistDetail(id: string | number) {
    return api.get(`/musicList/${id}`)
}

/** 获取用户基础信息 */
export function getUserProfile(userId: string | number) {
    return api.get(`/user/${userId}`)
}

/** 上传文件（multipart/form-data）
 * 使用通用上传接口：POST /common/upload
 * 必需表单字段：file (文件)
 * 推荐表单字段：type = 'Picture'|'OnlineMusic'|'LocalMusic'（本处上传头像请使用 'Picture'）
 * 可选 header: token （某些后端接口使用该 header 做鉴权）
 * 返回示例：{ code:0|200, data: { url: string, duration?: string } }
 */
export function uploadAvatar(formData: FormData) {
    // 一些后端示例要求额外的 header: token
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' }
    if (token) headers['token'] = token
    return api.post('/common/upload', formData, { headers, timeout: UPLOAD_TIMEOUT })
}

/** 通用文件上传（支持音频/视频/图片等）
 * 示例：上传 mp3，后端返回 { code:0|200, data: { url: string, duration?: number } }
 * 前端在上传音频时请在 formData 中添加 `type = 'LocalMusic'` 或 `type = 'OnlineMusic'`。
 */
export function uploadFile(formData: FormData) {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' }
    if (token) headers['token'] = token
    return api.post('/common/upload', formData, { headers, timeout: UPLOAD_TIMEOUT })
}

/** 更新用户资料（部分更新）
 * 示例：PUT /user/:id
 * body: { username?, email?, sex?, age?, avatar? }
 */
export function updateUserProfile(id: string | number, data: Record<string, any>) {
    // 后端文档显示为 PUT /user，body 中包含用户字段；为了兼容不同后端实现，将 id 放到 body 中并调用 /user
    return api.put('/user', { id, ...data })
}

/**
 * 获取用户列表（示例 helper）
 * 支持分页参数：{ pageNum, pageSize }
 */
export function getUserList(params: Record<string, any>) {
    return api.get('/user/list', { params })
}

// ====== Songs / Music CRUD ======
export function createMusic(data: Record<string, any>) {
    return api.post('/music', data, { timeout: UPLOAD_TIMEOUT })
}

export function updateMusic(id: string | number, data: Record<string, any>) {
    // 后端文档显示为 PUT /music，并在 body 中传递 id 与其它字段
    return api.put('/music', { id, ...data }, { timeout: UPLOAD_TIMEOUT })
}

export function deleteMusic(id: string | number) {
    return api.delete(`/music/${id}`)
}

// ====== User CRUD ======
export function createUser(data: Record<string, any>) {
    return api.post('/user', data)
}

export function updateUser(id: string | number, data: Record<string, any>) {
    // 后端文档显示：PUT /user，body 中包含 id 与需要更新的字段
    return api.put('/user', { id, ...data })
}

export function deleteUser(id: string | number) {
    // 根据文档，DELETE /user 使用 query 参数 id
    return api.delete('/user', { params: { id } })
}

/**
 * 管理员专用：在所有请求头中添加名为 `token` 的字段（用于快速登录场景）
 * 调用后，axios 实例会在随后的请求中自动带上该 header。
 */
export function setAdminToken(token: string) {
    if (token) {
        api.defaults.headers['token'] = token
    }
}

export function clearAdminToken() {
    delete api.defaults.headers['token']
}

// ====== 广告相关接口 ======
/** 创建并推送广告
 * POST /ad/create
 * body: { content: string, picture?: string, duration: number }
 * 返回示例: { code: 0, data: { key: string } }
 */
export function createAd(data: { content: string; picture?: string; duration: number }) {
    return api.post('/td/create', data)
}


const request = api;


// ---------- 新增 API 函数（与后端接口约定） ----------

export async function getMusicDetail(id: number) {
  // 注意：本文件顶部已有 axios 实例变量名为 `api`（保持一致）
  const res = await api.get(`/music/${id}`);
  return res.data.data as import('../types/api').MusicDetail;
}



// ---------- 新增 API 函数（与后端接口约定） ----------


export async function postComment(params: import('../types/api').CommentParams) {
    const res = await api.post('/comment', params);
    return res.data.data as import('../types/api').Comment;
}


export async function getCommentsByMusic(musicId: number) {
  const res = await api.get('/comment/list', { params: { musicId } });
  // 后端约定：res.data 为 ApiResponse<T>
  return res.data.data as import('../types/api').Comment[];
}



export async function getCommentById(id: number) {
  const res = await api.get('/comment', { params: { id } });
  return res.data.data as import('../types/api').Comment;
}

