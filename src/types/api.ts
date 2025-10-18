// src/types/api.ts

// 1. 通用接口返回结构（所有接口的外层格式）
export interface ApiResponse<T> {
  code: number; // 状态码（200表示成功）
  data: T;      // 接口返回的具体数据
  message: string; // 提示信息
}

// 2. 获取“我喜欢的音乐”列表的请求参数
export interface LikeMusicListParams {
  userId: number; // 必须传入的用户ID
}

// 3. 获取“我喜欢的音乐”列表接口的返回数据结构（对应 data 字段）
export interface LikeMusicListData {    
  id: 0;
  name: string;
  image: string;
  create_time: string;
  update_time: string;
  musics: Array<{
    name: string;
    author: string;
    type: string;
    url: string;
    image: string;
    id: 0;
    createTime: string;
    updateTime: string;
    duration: 0;
    status: 0;
  }>;     
}

// 4. 完整的“获取我喜欢的音乐”接口定义（包含请求和响应）
export interface GetLikeMusicListAPI {
  params: LikeMusicListParams; // 请求时需要传的参数
  response: ApiResponse<LikeMusicListData>; // 接口返回的完整结构
}

//5.用户信息
export interface UserInfo {
  id: number; // 用户ID（后端返回integer，前端用number接收）
  username: string; // 用户名
  email: string; // 邮箱s
  status: '0' | '1'; // 状态：0-隐藏，1-正常（枚举值）
  sex: '0' | '1'; // 性别：0-女，1-男，空字符串-未知
  avatar: string; // 头像地址
  createTime: string; // 创建时间（后端通常返回ISO字符串，如"2023-10-01 12:00:00"）
  createPerson: string; // 创建人
  updateTime: string; // 更新时间
  updatePerson: string; // 更新人
}


export interface UserCollectList {
    create_time?: string;
    id: number;
    musicCount: number;
    image?: string;
    name?: string;
    update_time?: string;
    [property: string]: any;
}


