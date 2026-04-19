package com.banking.accountservice.service;

import com.banking.accountservice.entity.Otp;
import com.banking.accountservice.repository.OtpRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Generates OTPs, persists a BCrypt hash, sends the plain code by email, and verifies submissions.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OtpRateLimiter otpRateLimiter;

    public OtpService(OtpRepository otpRepository,
                      PasswordEncoder passwordEncoder,
                      EmailService emailService,
                      OtpRateLimiter otpRateLimiter) {
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.otpRateLimiter = otpRateLimiter;
    }

    /**
     * Issue a new OTP: rate-limit, remove prior rows for email, save hash, send email.
     */
    @Transactional
    public void sendOtp(String email) {
        String normalized = normalizeEmail(email);

        otpRepository.deleteByEmail(normalized);

        String plain = generateSixDigitOtp();
        Otp entity = new Otp();
        entity.setEmail(normalized);
        entity.setOtp(passwordEncoder.encode(plain));
        entity.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        entity.setUsed(false);
        otpRepository.save(entity);

        emailService.sendOtp(normalized, plain);
        otpRateLimiter.checkAndRecord(normalized);
        log.info("OTP email dispatched to {}", normalized);
    }

    /**
     * Validates OTP; marks row used on success.
     */
    @Transactional
    public void verifyOtp(String email, String plainOtp) {
        String normalized = normalizeEmail(email);
        Otp row = otpRepository.findTopByEmailAndUsedFalseOrderByIdDesc(normalized)
                .orElseThrow(() -> new IllegalArgumentException("OTP not found. Please request a new OTP."));

        if (row.getExpiryTime().isBefore(LocalDateTime.now())) {
            row.setUsed(true);
            otpRepository.save(row);
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(plainOtp, row.getOtp())) {
            throw new IllegalArgumentException("Invalid OTP code.");
        }

        row.setUsed(true);
        otpRepository.save(row);
    }

    private String generateSixDigitOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
