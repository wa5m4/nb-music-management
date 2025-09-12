package com.kelis.config;

import com.kelis.properties.AliOssProperties;
import com.kelis.utils.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
@Slf4j
public class OssConfiguration {
    @Bean
    @ConditionalOnMissingBean
    //如果容器中没有AliOssUtil对象，就创建一个
    public JwtUtil.AliOssUtil aliOssUtil(AliOssProperties aliOssProperties) {
        log.info("初始化阿里云OSS工具类对象：{}",aliOssProperties);
        return new JwtUtil.AliOssUtil(aliOssProperties.getEndpoint(),
                aliOssProperties.getAccessKeyId(),
                aliOssProperties.getAccessKeySecret(),
                aliOssProperties.getBucketName());
    }//这里的AliOssUtil类是我们自己写的，它继承了OSS的SDK，并实现了上传文件到OSS的方法。
}
