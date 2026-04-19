package com.banking.accountservice.exception;

public class OtpRateLimitExceededException extends RuntimeException {

    public OtpRateLimitExceededException(String message) {
        super(message);
    }
}
