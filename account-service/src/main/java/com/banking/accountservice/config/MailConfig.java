package com.banking.accountservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Logs clear guidance when Gmail SMTP credentials are missing so OTP delivery failures are obvious.
 */
@Configuration
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    @Bean
    ApplicationRunner mailCredentialsCheck(
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password) {
        return args -> {
            if (username == null || username.isBlank()) {
                log.error(
                        "OTP email is disabled: set environment variable MAIL_USERNAME (your Gmail address). "
                                + "Also set MAIL_PASSWORD to a Gmail App Password (not your normal password).");
                return;
            }
            if (password == null || password.isBlank()) {
                log.error(
                        "OTP email will fail: MAIL_PASSWORD is not set. "
                                + "Use a Gmail App Password: Google Account → Security → 2-Step Verification → App passwords.");
            } else {
                log.info("Mail SMTP configured for sender {} (Gmail App Password authentication).", username);
            }
        };
    }
}
