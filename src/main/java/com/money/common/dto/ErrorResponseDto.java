package com.money.common.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ErrorResponseDto {
    private final LocalDateTime timestamp;
    private final  int status;
    private final String error;
    private final String message;
    private final String path;

    public ErrorResponseDto(int status, String error, String message, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }

    public static ErrorResponseDto of(int status, String error, String message, String path) {
        return new ErrorResponseDto(status, error, message, path);
    }
}
