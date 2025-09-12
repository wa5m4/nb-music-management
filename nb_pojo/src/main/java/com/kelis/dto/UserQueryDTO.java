package com.kelis.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserQueryDTO implements Serializable {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String username;
    private String email;
    private String status;
    private String sex;

}
