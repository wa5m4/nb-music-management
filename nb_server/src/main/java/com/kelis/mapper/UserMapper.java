package com.kelis.mapper;

import com.github.pagehelper.Page;
import com.kelis.annotation.AutoFill;
import com.kelis.enumeration.OperationType;
import com.kelis.dto.UserQueryDTO;
import com.kelis.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper {
    @Select("select * from user where username = #{username}")
    User selectByUsername(String username);

    Page<User> query(UserQueryDTO userQueryDTO);

    @AutoFill(OperationType.INSERT)
    void insert(User user);
    @AutoFill(OperationType.UPDATE)
    void update(User user);
}
