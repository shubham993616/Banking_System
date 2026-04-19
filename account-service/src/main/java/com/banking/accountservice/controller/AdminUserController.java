package com.banking.accountservice.controller;

import com.banking.accountservice.dto.ApiResponse;
import com.banking.accountservice.dto.auth.UserSummaryResponse;
import com.banking.accountservice.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AuthService authService;

    public AdminUserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> listUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", authService.getAllUsers()));
    }
}
