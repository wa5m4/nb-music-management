package com.kelis.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User implements Serializable {
    private Integer id;
    private String username;
    private String password;
    private String email;
    private String status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Integer createPerson;
    private Integer updatePerson;
    private String sex;
    private String avatar;
}
