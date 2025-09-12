package com.kelis.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.kelis.dto.UserDTO;
import com.kelis.dto.UserQueryDTO;
import com.kelis.entity.User;
import com.kelis.mapper.UserMapper;
import com.kelis.result.PageResult;
import com.kelis.service.UserService;
import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private org.springframework.mail.javamail.JavaMailSender mailSender;
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    /**
     * 用户登录
     * @param userDTO 用户信息
     * @return
     */
    @Override
    public User login(UserDTO userDTO) {
        String username = userDTO.getUsername();
        String password = userDTO.getPassword();
        String code = userDTO.getCode();
        User user = userMapper.selectByUsername(username);
        if (user == null) {
            throw  new RuntimeException("用户不存在");
        }
        String password1 = DigestUtils.md5DigestAsHex(password.getBytes(StandardCharsets.UTF_8));
        if (!password1.equals(user.getPassword())) {
            throw  new RuntimeException("密码错误");
        }
        return user;
    }
    /**
     * 用户列表
     * @param userQueryDTO
     * @return
     */
    @Override
    public PageResult list(UserQueryDTO userQueryDTO) {
        PageHelper.startPage(userQueryDTO.getPageNum(), userQueryDTO.getPageSize());
        Page<User> page = userMapper.query(userQueryDTO);
        return new PageResult(page.getTotal(), page.getResult());
    }
    /**
     * 用户注册
     * @param userDTO
     * @return
     */
    @Override
    public User register(UserDTO userDTO) {
        String username = userDTO.getUsername();
        if (userMapper.selectByUsername(username) != null) {
            throw new RuntimeException("用户已存在");
        }
        String code = userDTO.getCode();
        String code1 = (String) redisTemplate.opsForValue().get(userDTO.getEmail());
        if (code1 ==null)
            throw new RuntimeException("验证码已过期");
        if (!code.equals(code1))
            throw new RuntimeException("验证码错误");
        String email = userDTO.getEmail();
        String password = userDTO.getPassword();
        String sex = userDTO.getSex();
        String password1 = DigestUtils.md5DigestAsHex(password.getBytes(StandardCharsets.UTF_8));
        User user = User.builder()
                .username(username)
                .password(password1)
                .email(email)
                .status("1")
                .sex(sex)
                .build();
        userMapper.insert(user);
        return user;
    }

    /**
     * 发送验证码
     * @param email
     */
    @Override
    public void sendCode(String email) {
        Random random = new Random();
        int ra = random.nextInt(100000, 999999);
        String code = String.valueOf(ra);
        MimeMessagePreparator preparator = new MimeMessagePreparator() {
            public void prepare(MimeMessage mimeMessage) throws Exception {
                mimeMessage.setRecipient(Message.RecipientType.TO,
                        new InternetAddress(email));
                mimeMessage.setFrom(new InternetAddress("13790526970@163.com"));
                mimeMessage.setText("您的验证码为" + code);
            }
        };

        try {
            this.mailSender.send(preparator);
            // 保存验证码到redis中, 5分钟过期
            redisTemplate.opsForValue().set(email, code, 5, TimeUnit.MINUTES);
        }
        catch (MailException ex) {
            // simply log it and go on...
            System.err.println(ex.getMessage());
            throw new RuntimeException("发送失败");
        }
    }
    /**
     * 更新用户信息
     * @param user1
     */
    @Override
    public void update(User user1) {
        User user = userMapper.selectByUsername(user1.getUsername());
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        if (user1.getPassword() != null)
        {
            String password1 = DigestUtils.md5DigestAsHex(user1.getPassword().getBytes(StandardCharsets.UTF_8));
            user1.setPassword(password1);
        }
        else
            throw new RuntimeException("密码不能为空");
        BeanUtils.copyProperties(user1, user);
        userMapper.update(user);
    }
}
