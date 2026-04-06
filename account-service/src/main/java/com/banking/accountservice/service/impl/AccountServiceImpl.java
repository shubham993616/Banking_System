package com.banking.accountservice.service.impl;

import com.banking.accountservice.dto.*;
import com.banking.accountservice.entity.Account;
import com.banking.accountservice.exception.DuplicateResourceException;
import com.banking.accountservice.exception.ResourceNotFoundException;
import com.banking.accountservice.repository.AccountRepository;
import com.banking.accountservice.service.AccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of AccountService.
 * Contains all business logic for account operations.
 */
@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountServiceImpl.class);

    private final AccountRepository accountRepository;

    public AccountServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public AccountDTO createAccount(AccountCreateRequest request) {
        log.info("Creating account for: {}", request.getAccountHolderName());

        // Convert DTO → Entity
        Account account = AccountMapper.toEntity(request);

        // Generate unique account number
        String accountNumber = generateUniqueAccountNumber();
        account.setAccountNumber(accountNumber);

        // Save to database
        Account savedAccount = accountRepository.save(account);
        log.info("Account created successfully: {} ({})", savedAccount.getAccountHolderName(), savedAccount.getAccountNumber());

        return AccountMapper.toDTO(savedAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountDTO> getAllAccounts() {
        log.debug("Fetching all accounts");
        return accountRepository.findAll()
                .stream()
                .map(AccountMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AccountDTO getAccountById(Long id) {
        log.debug("Fetching account with ID: {}", id);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        return AccountMapper.toDTO(account);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountDTO getAccountByAccountNumber(String accountNumber) {
        log.debug("Fetching account with number: {}", accountNumber);
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "accountNumber", accountNumber));
        return AccountMapper.toDTO(account);
    }

    @Override
    public AccountDTO updateAccount(Long id, AccountUpdateRequest request) {
        log.info("Updating account with ID: {}", id);

        Account existing = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));

        // Apply partial updates
        AccountMapper.applyUpdate(request, existing);

        Account updated = accountRepository.save(existing);
        log.info("Account updated successfully: {}", updated.getAccountNumber());

        return AccountMapper.toDTO(updated);
    }

    @Override
    public void deleteAccount(Long id) {
        log.info("Deleting account with ID: {}", id);

        if (!accountRepository.existsById(id)) {
            throw new ResourceNotFoundException("Account", "id", id);
        }

        accountRepository.deleteById(id);
        log.info("Account deleted successfully: ID {}", id);
    }

    /**
     * Generates a unique 13-character account number (ACC + 10 hex chars).
     * Ensures no collisions by checking the database.
     */
    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            accountNumber = "ACC" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }
}
