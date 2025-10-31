// src/stores/global.ts
import { defineStore } from 'pinia';
import type { UserInfo } from '../types/api';

export const useGlobalStore = defineStore('global', {
  state: () => ({
    isLogin:!!localStorage.getItem('token'),
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null') as UserInfo | null,
    token: localStorage.getItem('token') || '',
    coverUrl: localStorage.getItem('coverUrl') || '', // 初始化时从本地存储获取，若没有则为空字符串
  }),
  actions: {
    // 登录成功时保存用户信息、Token
    setLoginInfo(info: { userInfo: UserInfo; token: string }) {
      this.isLogin = true;
      this.userInfo = info.userInfo;
      this.token = info.token;
      localStorage.setItem('token', info.token);
      localStorage.setItem('userInfo', JSON.stringify(info.userInfo));
    },
    // 新增：保存封面URL到 Pinia 及本地存储
    setCoverUrl(url: string) {
      this.coverUrl = url;
      localStorage.setItem('coverUrl', url);
    },
    // 登出时清空所有状态
    logout() {
      this.isLogin = false;
      this.userInfo = null;
      this.token = '';
      this.coverUrl = ''; // 登出时也清空封面URL
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('coverUrl');
    },
  },
});