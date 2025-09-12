package com.kelis.controller;
import com.kelis.dto.UserDTO;
import com.kelis.dto.UserQueryDTO;
import com.kelis.entity.User;
import com.kelis.properties.JwtProperties;
import com.kelis.result.PageResult;
import com.kelis.result.Result;
import com.kelis.service.UserService;
import com.kelis.utils.JwtUtil;
import com.kelis.vo.UserVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
@RestController
@RequestMapping("/user")
@Slf4j
@Api(tags = "用户模块")
public class UserController {
    @Autowired
    private UserService userService;
    @Autowired
    private JwtProperties jwtProperties;


    @GetMapping("/login")
    @ApiOperation(value = "登录", notes = "登录接口")
    public Result<UserVO> login(@RequestBody UserDTO userDTO) {
        log.info("用户登录：{}", userDTO);
        User user = userService.login(userDTO);
    //登录成功后，生成jwt令牌
    Map<String, Object> claims = new HashMap<>();
    claims.put("userId", user.getId());
    String token = JwtUtil.createJWT(
            jwtProperties.getUserSecretKey(),
            jwtProperties.getUserTtl(),
            claims);

        UserVO userVO = UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .token(token)
                .build();
        return Result.success(userVO);
    }

    @GetMapping("/list")
    @ApiOperation(value = "用户列表", notes = "用户列表接口")
    public Result<PageResult> list(UserQueryDTO userQueryDTO) {
        return Result.success(userService.list(userQueryDTO));
    }
    @PostMapping("/register")
    @ApiOperation(value = "注册", notes = "注册接口")
    public Result<User> register(@RequestBody UserDTO userDTO) {
        return Result.success(userService.register(userDTO));
    }

    @GetMapping("/code")
    @ApiOperation(value = "获取邮箱验证码", notes = "获取邮箱验证码接口")
    public Result checkCode(@RequestParam String email) {
        userService.sendCode(email);
        return Result.success("验证码发送成功");
    }

    @PutMapping("/update")
    @ApiOperation(value = "更新用户信息", notes = "更新用户信息接口")
    public Result update(@RequestBody User user) {
        userService.update(user);
        return Result.success("更新成功");
    }
}