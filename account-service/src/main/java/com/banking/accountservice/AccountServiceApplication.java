package com.banking.accountservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;

import jakarta.annotation.PostConstruct;

/**
 * Entry point for the Account Service.
 * This service handles all account-related operations:
 * create, read, update, and delete bank accounts.
 */
@SpringBootApplication
public class AccountServiceApplication {
     @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.admin.email:}")
    private String adminEmail;

    public static void main(String[] args) {
        SpringApplication.run(AccountServiceApplication.class, args);
    }
    @PostConstruct
public void init() {
    if (jwtSecret == null || jwtSecret.isBlank()) {
        throw new RuntimeException("JWT secret is missing!");
    }

    if (adminEmail == null || adminEmail.isBlank()) {
        throw new RuntimeException("Admin email is missing!");
    }

    System.out.println("Config loaded successfully");
}

      
}
