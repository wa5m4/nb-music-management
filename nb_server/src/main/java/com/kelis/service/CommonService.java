package com.kelis.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface CommonService {
    /**
     * 上传文件
     * @param file 文件
     * @return 上传后的文件路径
     */
    Object uploadFile(MultipartFile file, String type) throws IOException, InterruptedException;
}
