package com.banking.accountservice.controller;

import com.banking.accountservice.dto.ApiResponse;
import com.banking.accountservice.dto.auth.*;
import com.banking.accountservice.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration initiated. Verify OTP to activate account.", null));
    }

    @PostMapping("/verify-register-otp")
    public ResponseEntity<ApiResponse<Void>> verifyRegisterOtp(@Valid @RequestBody OtpVerificationRequest request) {
        authService.verifyRegisterOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Registration OTP verified. User is now ACTIVE.", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(@Valid @RequestBody LoginRequest request) {
        authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login OTP sent successfully.", null));
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> verifyLoginOtp(@Valid @RequestBody OtpVerificationRequest request) {
        AuthTokenResponse token = authService.verifyLoginOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful.", token));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", authService.getAllUsers()));
    }
}
