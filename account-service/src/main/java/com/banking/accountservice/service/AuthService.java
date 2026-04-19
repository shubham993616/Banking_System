package com.banking.accountservice.service;

import com.banking.accountservice.dto.auth.*;
import com.banking.accountservice.entity.User;
import com.banking.accountservice.entity.UserRole;
import com.banking.accountservice.entity.UserStatus;
import com.banking.accountservice.repository.UserRepository;
import com.banking.accountservice.security.AdminPasswordVerificationStore;
import com.banking.accountservice.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AdminPasswordVerificationStore adminPasswordVerificationStore;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       OtpService otpService,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       AdminPasswordVerificationStore adminPasswordVerificationStore) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.adminPasswordVerificationStore = adminPasswordVerificationStore;
    }

    public boolean isEmailRegistered(String email) {
        return userRepository.existsByEmail(normalizeEmail(email));
    }

    /** {@code /api/auth/send-otp} and {@code /api/auth/resend-otp} */
    public void sendOtpForEmail(SendOtpRequest request) {
        otpService.sendOtp(normalizeEmail(request.getEmail()));
    }

    /**
     * New-user registration after OTP (fails if email already registered).
     */
    @Transactional
    public AuthTokenResponse registerAfterOtp(RegisterCompleteRequest request) {
        String email = normalizeEmail(request.getEmail());
        otpService.verifyOtp(email, request.getOtp());

        if (userRepository.existsByEmail(email)) {
            throw new com.banking.accountservice.exception.DuplicateResourceException("User", "email", email);
        }

        validatePasswordPolicy(request.getPassword());

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        return new AuthTokenResponse(jwtService.generateToken(user.getEmail(), user.getRole().name()));
    }

    /** Password-only login (admins must use {@link #adminLoginStep1} + OTP instead). */
    @Transactional(readOnly = true)
    public AuthTokenResponse loginWithPassword(PasswordLoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        validatePasswordPolicy(request.getPassword());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials."));
        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Administrators must sign in via Admin login (password + OTP).");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Account is not active.");
        }
        return new AuthTokenResponse(jwtService.generateToken(user.getEmail(), user.getRole().name()));
    }

    /** OTP login step 1: only for existing accounts. */
    public void sendLoginOtp(SendOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("No account found for this email. Register first.");
        }
        otpService.sendOtp(email);
    }

    /**
     * Verifies OTP; creates a new active user (name + password) if none exists,
     * otherwise logs in (issues JWT). Activates {@link UserStatus#PENDING} users after OTP.
     */
    @Transactional
    public AuthTokenResponse verifyOtpAndAuthenticate(VerifyOtpAuthRequest request) {
        String email = normalizeEmail(request.getEmail());
        otpService.verifyOtp(email, request.getOtp());

        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isEmpty()) {
            String name = request.getName() == null ? null : request.getName().trim();
            String password = request.getPassword();
            if (name == null || name.isEmpty() || password == null || password.isEmpty()) {
                throw new IllegalArgumentException(
                        "Name and password are required to register a new account after OTP verification.");
            }
            validatePasswordPolicy(password);
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(UserRole.USER);
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);
            return new AuthTokenResponse(jwtService.generateToken(user.getEmail(), user.getRole().name()));
        }

        User user = existing.get();
        if (user.getStatus() == UserStatus.PENDING) {
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Account is not active.");
        }
        return new AuthTokenResponse(jwtService.generateToken(user.getEmail(), user.getRole().name()));
    }

    /** Does not reveal whether the email exists (anti-enumeration). */
    public void requestForgotPassword(SendOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            otpService.sendOtp(email);
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        validatePasswordPolicy(request.getNewPassword());
        otpService.verifyOtp(email, request.getOtp());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /** Admin step 1: validate password, then send OTP (existing OTP pipeline). */
    public void adminLoginStep1(AdminLoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));
        if (user.getRole() != UserRole.ADMIN) {
            throw new BadCredentialsException("Invalid email or password.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password.");
        }
        adminPasswordVerificationStore.recordVerified(email);
        otpService.sendOtp(email);
    }

    @Transactional
    public AuthTokenResponse adminVerifyOtp(AdminVerifyOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!adminPasswordVerificationStore.isValid(email)) {
            throw new IllegalArgumentException("Complete admin password verification first, or start again.");
        }
        otpService.verifyOtp(email, request.getOtp());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Not an administrator account.");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Account is not active.");
        }
        adminPasswordVerificationStore.clear(email);
        return new AuthTokenResponse(jwtService.generateToken(user.getEmail(), user.getRole().name()));
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.PENDING);
        userRepository.save(user);

        otpService.sendOtp(email);
    }

    @Transactional
    public void verifyRegisterOtp(OtpVerificationRequest request) {
        String email = normalizeEmail(request.getEmail());
        otpService.verifyOtp(email, request.getCode());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }

    /** Legacy: password check then OTP send (unchanged contract). */
    public void login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );
        otpService.sendOtp(email);
    }

    public AuthTokenResponse verifyLoginOtp(OtpVerificationRequest request) {
        String email = normalizeEmail(request.getEmail());
        otpService.verifyOtp(email, request.getCode());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("User is not active. Complete registration OTP first.");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthTokenResponse(token);
    }

    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getStatus().name()
                ))
                .toList();
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
