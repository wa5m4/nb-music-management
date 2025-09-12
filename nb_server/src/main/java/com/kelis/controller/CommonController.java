package com.kelis.controller;

import com.kelis.result.Result;
import com.kelis.service.CommonService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/common")
public class CommonController {
    @Autowired
    private CommonService commonService;
    @RequestMapping("/upload")
    public Result<Object> upload(MultipartFile file, String type) throws IOException, InterruptedException {
        log.info("upload file: {}, type: {}", file.getOriginalFilename(), type);
        return Result.success(commonService.uploadFile(file, type));
    }
}
