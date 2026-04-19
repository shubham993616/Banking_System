package com.banking.accountservice.controller;

import com.banking.accountservice.dto.ApiResponse;
import com.banking.accountservice.dto.auth.*;
import com.banking.accountservice.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Primary REST auth API. OTP delivery is delegated to {@link com.banking.accountservice.service.OtpService} unchanged.
 */
@RestController
@RequestMapping("/api/auth")
@Validated
public class ApiAuthController {

    private final AuthService authService;

    public ApiAuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<EmailRegisteredResponse>> checkEmail(
            @RequestParam("email") @NotBlank @Email String email) {
        boolean registered = authService.isEmailRegistered(email);
        return ResponseEntity.ok(ApiResponse.success(
                "OK",
                new EmailRegisteredResponse(registered)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> register(@Valid @RequestBody RegisterCompleteRequest request) {
        AuthTokenResponse token = authService.registerAfterOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful.", token));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> loginWithPassword(@Valid @RequestBody PasswordLoginRequest request) {
        AuthTokenResponse token = authService.loginWithPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful.", token));
    }

    @PostMapping("/login-otp")
    public ResponseEntity<ApiResponse<Void>> loginOtpSend(@Valid @RequestBody SendOtpRequest request) {
        authService.sendLoginOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email.", null));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtpForEmail(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email.", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> verifyOtp(@Valid @RequestBody VerifyOtpAuthRequest request) {
        AuthTokenResponse token = authService.verifyOtpAndAuthenticate(request);
        return ResponseEntity.ok(ApiResponse.success("Authenticated successfully.", token));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtpForEmail(request);
        return ResponseEntity.ok(ApiResponse.success("OTP resent to your email.", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody SendOtpRequest request) {
        authService.requestForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                "If an account exists for this email, an OTP has been sent.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password updated. You can sign in.", null));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<Void>> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        authService.adminLoginStep1(request);
        return ResponseEntity.ok(ApiResponse.success("Password verified. OTP sent to your email.", null));
    }

    @PostMapping("/admin/verify-otp")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> adminVerifyOtp(@Valid @RequestBody AdminVerifyOtpRequest request) {
        AuthTokenResponse token = authService.adminVerifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Admin login successful.", token));
    }
}
