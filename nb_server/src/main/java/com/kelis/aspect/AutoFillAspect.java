package com.kelis.aspect;

import com.kelis.annotation.AutoFill;
import com.kelis.context.BaseContext;
import com.kelis.enumeration.OperationType;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDateTime;

@Component
@Slf4j
@Aspect
public class AutoFillAspect {
    @Pointcut("@annotation(com.kelis.annotation.AutoFill)")
    public void autoFillPointcut(){}
    // 前置通知
    @Before("autoFillPointcut()")
    public void autoFill(JoinPoint joinPoint){
        log.info("正在自动填充数据...");
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        AutoFill autoFill = signature.getMethod().getAnnotation(AutoFill.class);
        OperationType operationType = autoFill.value();

        Object[] args = joinPoint.getArgs();
        if (args.length == 0)
            return;
        Object object = args[0];
        Long updateUser = BaseContext.getCurrentId();
        LocalDateTime updateTime = LocalDateTime.now();
        if (operationType == OperationType.INSERT){
            try {
                Method setCreateTime = object.getClass().getDeclaredMethod("setCreateTime", LocalDateTime.class);
                setCreateTime.invoke(object, updateTime);
                Method setCreateUser = object.getClass().getDeclaredMethod("setCreatePerson", Long.class);
                setCreateUser.invoke(object, updateUser);
            } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
                throw new RuntimeException(e);
            }
        }
        else if (operationType == OperationType.UPDATE){
            try {
                Method setUpdateTime = object.getClass().getDeclaredMethod("setUpdateTime", LocalDateTime.class);
                setUpdateTime.invoke(object, updateTime);
                Method setUpdateUser = object.getClass().getDeclaredMethod("setUpdatePerson", Long.class);
                setUpdateUser.invoke(object, updateUser);
            } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
                throw new RuntimeException(e);
            }
            log.info("自动填充数据完成...");
        }

    }
}
