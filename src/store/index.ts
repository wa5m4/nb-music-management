// src/stores/global.ts
import { defineStore } from 'pinia';
import type { UserInfo, UserCollectList } from '../types/api';

export const useGlobalStore = defineStore('global', {
  state: () => ({
    isLogin: !!localStorage.getItem('token'),
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null') as UserInfo | null,
    token: localStorage.getItem('token') || '',
    // 只需要存储用户歌单列表，封面和名称都从后端实时获取
    musicLists: JSON.parse(localStorage.getItem('musicLists') || '[]') as UserCollectList[],
  }),

  getters: {
    /**
     * 获取用户歌单列表
     */
    getUserPlaylists: (state) => {
      return state.musicLists;
    }
  },

  actions: {
    // 登录成功时保存用户信息、Token
    setLoginInfo(info: { userInfo: UserInfo; token: string }) {
      this.isLogin = true;
      this.userInfo = info.userInfo;
      this.token = info.token;
      localStorage.setItem('token', info.token);
      localStorage.setItem('userInfo', JSON.stringify(info.userInfo));
    },

    // 设置用户歌单列表
    setUserPlaylists(playlists: UserCollectList[]) {
      this.musicLists = playlists;
      localStorage.setItem('musicLists', JSON.stringify(this.musicLists));
    },

    // 更新单个歌单信息（用于编辑名称后更新本地缓存）
    updatePlaylist(updatedPlaylist: UserCollectList) {
      const index = this.musicLists.findIndex(item => item.id === updatedPlaylist.id);
      if (index !== -1) {
        this.musicLists[index] = { ...this.musicLists[index], ...updatedPlaylist };
        localStorage.setItem('musicLists', JSON.stringify(this.musicLists));
      }
    },

    // 登出时清空所有状态
    logout() {
      this.isLogin = false;
      this.userInfo = null;
      this.token = '';
      this.musicLists = [];
      
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('musicLists');
    },
  },
});