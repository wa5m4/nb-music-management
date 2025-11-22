// 用户类型
export interface User {
    status?: string
    username: string
    id?: number
    email: string
    sex: string
    avatar?: string
    
}
// 用户登录凭证
export interface LoginCredentials {
    email: string
    password: string
}
// 定义注册数据接口
export interface RegisterData{
    username: string
    email: string
    password: string
    code: string
    sex:string
    emailCode: string
    codeKey: string
}
export interface ApiResponse<T = any>{
    code: number
    msg: string
    data:T
    token?: string
    user?: User
}
// 定义验证码接口的返回数据结构
export interface CaptchaResponse {
  code: number; // 业务状态码（必需）
  msg?: string | null; // 提示信息（可选，可为 string 或 null）
  data: {
    codeKey: string; // 验证码 key（必需）
    checkCodeBase64: string; // 验证码图片 base64（必需）
  };
}

export interface codeSendResponce {
  code: number
  emailCode: number,
  msg?: string | null;
  data: object
}





