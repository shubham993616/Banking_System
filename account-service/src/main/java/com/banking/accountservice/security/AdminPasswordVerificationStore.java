package com.banking.accountservice.security;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks that an admin successfully passed password validation before OTP is verified (short TTL).
 */
@Component
public class AdminPasswordVerificationStore {

    private static final long TTL_MS = 5 * 60_000L;

    private final ConcurrentHashMap<String, Long> expiryByEmail = new ConcurrentHashMap<>();

    public void recordVerified(String normalizedEmail) {
        expiryByEmail.put(normalizedEmail, System.currentTimeMillis() + TTL_MS);
    }

    public boolean isValid(String normalizedEmail) {
        Long exp = expiryByEmail.get(normalizedEmail);
        if (exp == null || System.currentTimeMillis() > exp) {
            expiryByEmail.remove(normalizedEmail);
            return false;
        }
        return true;
    }

    public void clear(String normalizedEmail) {
        expiryByEmail.remove(normalizedEmail);
    }
}
