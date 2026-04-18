package com.banking.accountservice.controller;

import com.banking.accountservice.dto.*;
import com.banking.accountservice.service.AccountService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller for Account and Transaction operations.
 * Thin layer — delegates all business logic to AccountService.
 *
 * Endpoints:
 *   POST   /api/accounts               → Create account
 *   GET    /api/accounts               → List all accounts
 *   GET    /api/accounts/{id}          → Get by ID
 *   PUT    /api/accounts/{id}          → Update account
 *   DELETE /api/accounts/{id}          → Delete account
 *   POST   /api/accounts/{id}/deposit  → Deposit money
 *   POST   /api/accounts/{id}/withdraw → Withdraw money
 *   GET    /api/accounts/{id}/transactions → Transaction history
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

    // =============================================
    // CRUD Endpoints
    // =============================================

    @PostMapping
    public ResponseEntity<ApiResponse<AccountDTO>> createAccount(@Valid @RequestBody AccountCreateRequest request) {
        log.info("POST /api/accounts — Creating account for: {}", request.getAccountHolderName());
        AccountDTO created = accountService.createAccount(request);
        return ResponseEntity.ok(ApiResponse.success("Account created successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getAllAccounts() {
        log.debug("GET /api/accounts — Fetching all accounts");
        List<AccountDTO> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(ApiResponse.success("Accounts retrieved successfully", accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountDTO>> getAccountById(@PathVariable Long id) {
        log.debug("GET /api/accounts/{} — Fetching account", id);
        AccountDTO account = accountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.success("Account retrieved successfully", account));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountDTO>> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody AccountUpdateRequest request) {
        log.info("PUT /api/accounts/{} — Updating account", id);
        AccountDTO updated = accountService.updateAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Account updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable Long id) {
        log.info("DELETE /api/accounts/{} — Deleting account", id);
        accountService.deleteAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", null));
    }

    // =============================================
    // Banking Endpoints (Deposit / Withdraw)
    // =============================================

    @PostMapping("/{id}/deposit")
    public ResponseEntity<ApiResponse<AccountDTO>> deposit(
            @PathVariable Long id,
            @Valid @RequestBody AmountRequest request) {
        log.info("POST /api/accounts/{}/deposit — Depositing ₹{}", id, request.getAmount());
        AccountDTO updated = accountService.deposit(id, request.getAmount());
        return ResponseEntity.ok(ApiResponse.success("Deposit successful", updated));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<AccountDTO>> withdraw(
            @PathVariable Long id,
            @Valid @RequestBody AmountRequest request) {
        log.info("POST /api/accounts/{}/withdraw — Withdrawing ₹{}", id, request.getAmount());
        AccountDTO updated = accountService.withdraw(id, request.getAmount());
        return ResponseEntity.ok(ApiResponse.success("Withdrawal successful", updated));
    }

    // =============================================
    // Transaction History
    // =============================================

    @GetMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<PagedResponse<TransactionDTO>>> getTransactions(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.debug("GET /api/accounts/{}/transactions — Fetching history", id);
        PagedResponse<TransactionDTO> transactions = accountService.getTransactions(id, page, size);
        return ResponseEntity.ok(ApiResponse.success("Transactions retrieved successfully", transactions));
    }
}
