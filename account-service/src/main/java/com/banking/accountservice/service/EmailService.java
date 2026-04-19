package com.banking.accountservice.service;

import com.banking.accountservice.exception.OtpDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendOtp(String toEmail, String otpCode) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.error("Cannot send OTP: app.mail.from / MAIL_USERNAME is not configured.");
            throw new OtpDeliveryException(
                    "Email is not configured on the server. Set MAIL_USERNAME and MAIL_PASSWORD (Gmail App Password).");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Your OTP Code");
            message.setText("Your OTP is: " + otpCode + " (valid for 5 minutes)");
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("SMTP failed sending OTP to {}: {}", toEmail, ex.getMessage());
            throw new OtpDeliveryException(
                    "Could not send OTP email. Check MAIL_USERNAME and MAIL_PASSWORD (Gmail App Password).",
                    ex);
        }
    }
}
