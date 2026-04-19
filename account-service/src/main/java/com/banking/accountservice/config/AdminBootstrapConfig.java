package com.banking.accountservice.config;

import com.banking.accountservice.entity.User;
import com.banking.accountservice.entity.UserRole;
import com.banking.accountservice.entity.UserStatus;
import com.banking.accountservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrapConfig {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapConfig.class);

    @Bean
    CommandLineRunner bootstrapAdmin(UserRepository userRepository,
                                     PasswordEncoder passwordEncoder,
                                     @Value("${app.admin.email:admin@banking.com}") String adminEmail,
                                     @Value("${app.admin.password:Admin@12345}") String adminPassword) {
        return args -> {
            String normalized = adminEmail.trim().toLowerCase();
            if (userRepository.existsByEmail(normalized)) {
                return;
            }

            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail(normalized);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(UserRole.ADMIN);
            admin.setStatus(UserStatus.ACTIVE);
            userRepository.save(admin);
            log.info("Bootstrapped default admin user with email {}", normalized);
        };
    }
}
