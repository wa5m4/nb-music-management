package com.kelis.service;

import com.kelis.dto.UserDTO;
import com.kelis.dto.UserQueryDTO;
import com.kelis.entity.User;
import com.kelis.result.PageResult;

public interface UserService {
    /**
     * 用户登录
     * @param userDTO 用户信息
     * @return
     */
    User login(UserDTO userDTO);

    /**
     * 用户列表
     * @param userQueryDTO
     * @return
     */
    PageResult list(UserQueryDTO userQueryDTO);

    /**
     * 用户注册
     * @param userDTO
     * @return
     */
    User register(UserDTO userDTO);

    /**
     * 发送验证码
     * @param email
     */
    void sendCode(String email);

    /**
     * 更新用户信息
     * @param user
     */
    void update(User user);
}
