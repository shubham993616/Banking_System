package com.banking.accountservice.dto;

import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountType;

/**
 * Utility class for mapping between Entity and DTO objects.
 * Keeps conversion logic centralized and reusable.
 */
public class AccountMapper {

    private AccountMapper() {
        // Utility class — prevent instantiation
    }

    /**
     * Convert Account entity → AccountDTO (for API responses).
     */
    public static AccountDTO toDTO(Account account) {
        AccountDTO dto = new AccountDTO();
        dto.setId(account.getId());
        dto.setAccountHolderName(account.getAccountHolderName());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setAccountType(account.getAccountType().name());
        dto.setBalance(account.getBalance());
        dto.setEmail(account.getEmail());
        dto.setPhoneNumber(account.getPhoneNumber());
        dto.setActive(account.isActive());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setUpdatedAt(account.getUpdatedAt());
        return dto;
    }

    /**
     * Convert AccountCreateRequest → Account entity (for persistence).
     */
    public static Account toEntity(AccountCreateRequest request) {
        Account account = new Account();
        account.setAccountHolderName(request.getAccountHolderName());
        account.setAccountType(AccountType.valueOf(request.getAccountType().toUpperCase()));
        account.setBalance(request.getBalance());
        account.setEmail(request.getEmail());
        account.setPhoneNumber(request.getPhoneNumber());
        return account;
    }

    /**
     * Apply non-null fields from AccountUpdateRequest onto an existing entity.
     * Supports partial updates — only provided fields are changed.
     */
    public static void applyUpdate(AccountUpdateRequest request, Account account) {
        if (request.getAccountHolderName() != null) {
            account.setAccountHolderName(request.getAccountHolderName());
        }
        if (request.getAccountType() != null) {
            account.setAccountType(AccountType.valueOf(request.getAccountType().toUpperCase()));
        }
        if (request.getBalance() != null) {
            account.setBalance(request.getBalance());
        }
        if (request.getEmail() != null) {
            account.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            account.setPhoneNumber(request.getPhoneNumber());
        }
    }
}
