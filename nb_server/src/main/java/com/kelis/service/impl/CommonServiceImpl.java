package com.kelis.service.impl;

import com.kelis.service.CommonService;
import com.kelis.utils.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.UUID;

@Service
@Slf4j
public class CommonServiceImpl implements CommonService {
    private final String basepath="E:/JavaWeb/nb_music_management_backend/nb_server/src/main/resources/static/upload/";
    @Autowired
    private JwtUtil.AliOssUtil aliOssUtil;
    /**
     * 上传文件
     * @param file 文件
     * @return 上传后的文件路径
     */
    @Override
    public Object uploadFile(MultipartFile file, String type) throws IOException, InterruptedException {
        String originalFilename = file.getOriginalFilename();
        String objectName = originalFilename.substring(originalFilename.lastIndexOf("."));
        String preName = type;
        if(preName.equals("onlineVideo")){
           preName = type+"/" ;
            String fileName = UUID.randomUUID().toString() + objectName;
            byte[] bytes = file.getBytes();
            String newFileName = preName + fileName;
            aliOssUtil.upload(bytes, newFileName);
            return newFileName;
        }
        else{
            preName = type+"/" ;
            String fileName = UUID.randomUUID().toString() + objectName;

            // 修复1: 正确创建临时文件而不是目录
            File tempFile = new File(basepath, fileName);
            // 确保父目录存在
            File parentDir = tempFile.getParentFile();
            if (!parentDir.exists()) {
                parentDir.mkdirs();
            }
            // 创建文件
            file.transferTo(tempFile);

            // 使用FFmpeg对本地音频文件进行HLS分片编码
            String tempDir = basepath + "/temp_hls";
            File hlsDir = new File(tempDir);
            if (!hlsDir.exists()) {
                hlsDir.mkdirs();
            }
            // 修复2: 针对音频的正确FFmpeg命令
            // 使用MP3格式的分片
            String command = String.format(
                    "ffmpeg -i %s -vn -acodec aac -b:a 128k -ar 44100 -ac 2 " +
                            "-f hls -hls_time 8 -hls_list_size 0 -hls_segment_filename %s/segment_%%03d.ts " +
                            "-hls_flags delete_segments+split_by_time -mpegts_flags +resync+system_b " +
                            "-mpegts_copyts 1 -avoid_negative_ts make_zero -y %s/playlist.m3u8",
                    tempFile.getAbsolutePath().replace("\\", "/"),
                    tempDir.replace("\\", "/"),
                    tempDir.replace("\\", "/")
            );
            // 使用ProcessBuilder并处理输出流，防止阻塞
            ProcessBuilder processBuilder = new ProcessBuilder(command.split(" "));
            processBuilder.redirectErrorStream(true); // 合并标准输出和错误输出
            Process process = processBuilder.start();
            // 添加日志记录，便于调试
            log.info("执行FFmpeg命令: " + command);

            // 修复3: 读取FFmpeg输出，避免缓冲区阻塞
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            // 修复4: 添加超时机制，避免永久阻塞
            boolean completed = process.waitFor(3, java.util.concurrent.TimeUnit.MINUTES);
            if (!completed) {
                process.destroy();
                throw new RuntimeException("FFmpeg音频处理超时");
            }

            // 检查FFmpeg执行是否成功
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                throw new RuntimeException("FFmpeg处理失败，退出码: " + exitCode + "\n输出: " + output.toString());
            }

            // 上传.m3u8文件到阿里云
            String m3u8Name = preName + fileName.substring(0, fileName.lastIndexOf(".")) + ".m3u8";
            File m3u8File = new File(tempDir + "/playlist.m3u8");
            if (!m3u8File.exists()) {
                throw new RuntimeException("FFmpeg未生成m3u8文件");
            }

            byte[] bytes = Files.readAllBytes(m3u8File.toPath());
            String m3u8Url = aliOssUtil.upload(bytes, m3u8Name);

            // 上传所有.ts分片文件
            log.info("上传.ts分片文件到阿里云");
            ArrayList<String> tsUrls = new ArrayList<>();
            File[] tsFiles = hlsDir.listFiles((dir, name) -> name.endsWith(".ts"));
            if (tsFiles != null) {
                for (File tsFile : tsFiles) {
                    if (tsFile.isFile()) {
                        byte[] tsBytes = Files.readAllBytes(tsFile.toPath());
                        String tsName = preName + tsFile.getName();
                        String tsUrl = aliOssUtil.upload(tsBytes, tsName);
                        tsUrls.add(tsUrl);
                    }
                }
            }

            // 修复5: 安全清理临时文件
            if (tempFile.exists() && !tempFile.delete()) {
                System.out.println("警告: 无法删除临时文件: " + tempFile.getAbsolutePath());
            }

            // 递归删除临时目录
            deleteDirectory(hlsDir);
// 返回.m3u8文件的URL和.ts文件的URL列表
            log.info("返回.m3u8文件的URL和.ts文件的URL列表");
            return new ArrayList<String>() {{
                add(m3u8Url);
                addAll(tsUrls);
            }};
        }
    }

    // 新增: 递归删除目录的辅助方法
    private void deleteDirectory(File directory) {
        if (directory.exists()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        deleteDirectory(file);
                    } else {
                        file.delete();
                    }
                }
            }
            directory.delete();
        }
    }
}