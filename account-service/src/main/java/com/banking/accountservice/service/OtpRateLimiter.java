package com.banking.accountservice.service;

import com.banking.accountservice.exception.OtpRateLimitExceededException;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Limits OTP send attempts to {@value #MAX_SENDS_PER_WINDOW} per email per rolling {@value #WINDOW_MS} ms window.
 */
@Component
public class OtpRateLimiter {

    static final int MAX_SENDS_PER_WINDOW = 3;
    static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> sendsByEmail = new ConcurrentHashMap<>();

    /**
     * @throws OtpRateLimitExceededException if limit exceeded
     */
    public void checkAndRecord(String normalizedEmail) {
        long now = System.currentTimeMillis();
        ConcurrentLinkedQueue<Long> window = sendsByEmail.computeIfAbsent(
                normalizedEmail, k -> new ConcurrentLinkedQueue<>());
        synchronized (window) {
            while (!window.isEmpty() && now - window.peek() > WINDOW_MS) {
                window.poll();
            }
            if (window.size() >= MAX_SENDS_PER_WINDOW) {
                throw new OtpRateLimitExceededException(
                        "Too many OTP requests for this email. Try again in about a minute.");
            }
            window.add(now);
        }
    }
}
