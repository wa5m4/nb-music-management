package com.kelis.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserVO implements Serializable {
    private String token;
    private Integer id;
    private String username;
    private String avatar;
    private String email;
    private String createTime;
    private String updateTime;
    private String createPerson;
    private String updatePerson;
    private Integer status;
    private String sex;
}
