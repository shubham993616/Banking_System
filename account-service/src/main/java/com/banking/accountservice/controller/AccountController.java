package com.banking.accountservice.controller;

import com.banking.accountservice.dto.AccountCreateRequest;
import com.banking.accountservice.dto.AccountDTO;
import com.banking.accountservice.dto.AccountUpdateRequest;
import com.banking.accountservice.service.AccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Account operations.
 * Thin layer — delegates all business logic to AccountService.
 *
 * Endpoints:
 *   POST   /api/accounts       → Create account
 *   GET    /api/accounts       → List all accounts
 *   GET    /api/accounts/{id}  → Get by ID
 *   PUT    /api/accounts/{id}  → Update account
 *   DELETE /api/accounts/{id}  → Delete account
 */
@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<AccountDTO> createAccount(@RequestBody AccountCreateRequest request) {
        log.info("POST /api/accounts — Creating account for: {}", request.getAccountHolderName());
        AccountDTO created = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<AccountDTO>> getAllAccounts() {
        log.debug("GET /api/accounts — Fetching all accounts");
        List<AccountDTO> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO> getAccountById(@PathVariable Long id) {
        log.debug("GET /api/accounts/{} — Fetching account", id);
        AccountDTO account = accountService.getAccountById(id);
        return ResponseEntity.ok(account);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountDTO> updateAccount(
            @PathVariable Long id,
            @RequestBody AccountUpdateRequest request) {
        log.info("PUT /api/accounts/{} — Updating account", id);
        AccountDTO updated = accountService.updateAccount(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAccount(@PathVariable Long id) {
        log.info("DELETE /api/accounts/{} — Deleting account", id);
        accountService.deleteAccount(id);
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully", "id", id));
    }
}
