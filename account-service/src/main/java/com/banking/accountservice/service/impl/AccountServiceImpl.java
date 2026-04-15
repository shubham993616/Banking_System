package com.banking.accountservice.service.impl;

import com.banking.accountservice.dto.*;
import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountType;
import com.banking.accountservice.entity.Transaction;
import com.banking.accountservice.entity.TransactionType;
import com.banking.accountservice.exception.DuplicateResourceException;
import com.banking.accountservice.exception.InsufficientBalanceException;
import com.banking.accountservice.exception.ResourceNotFoundException;
import com.banking.accountservice.repository.AccountRepository;
import com.banking.accountservice.repository.TransactionRepository;
import com.banking.accountservice.service.AccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of AccountService.
 * Contains all business logic for account and transaction operations.
 *
 * Business Rules:
 *   SAVINGS  — minimum balance of ₹1,000
 *   CURRENT  — overdraft allowed up to -₹5,000
 */
@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountServiceImpl.class);

    /** Minimum balance for SAVINGS accounts. */
    private static final BigDecimal SAVINGS_MIN_BALANCE = new BigDecimal("1000");

    /** Maximum overdraft limit for CURRENT accounts. */
    private static final BigDecimal CURRENT_OVERDRAFT_LIMIT = new BigDecimal("-5000");

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public AccountServiceImpl(AccountRepository accountRepository,
                              TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    // =============================================
    // CRUD Operations
    // =============================================

    @Override
    public AccountDTO createAccount(AccountCreateRequest request) {
        log.info("Creating account for: {}", request.getAccountHolderName());

        Account account = AccountMapper.toEntity(request);
        String accountNumber = generateUniqueAccountNumber();
        account.setAccountNumber(accountNumber);

        Account savedAccount = accountRepository.save(account);
        log.info("Account created successfully: {} ({})",
                savedAccount.getAccountHolderName(), savedAccount.getAccountNumber());

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
        Account account = findAccountOrThrow(id);
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
        Account existing = findAccountOrThrow(id);
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

    // =============================================
    // Banking Operations (Deposit / Withdraw)
    // =============================================

    @Override
    @Transactional
    public AccountDTO deposit(Long accountId, BigDecimal amount) {
        log.info("Depositing ₹{} into account ID: {}", amount, accountId);

        validatePositiveAmount(amount);

        Account account = findAccountOrThrow(accountId);

        // Add amount to balance
        BigDecimal newBalance = account.getBalance().add(amount);
        account.setBalance(newBalance);
        Account savedAccount = accountRepository.save(account);

        // Record the transaction
        Transaction transaction = new Transaction(
                savedAccount, TransactionType.DEPOSIT, amount, newBalance
        );
        transactionRepository.save(transaction);

        log.info("Deposit successful. Account {} new balance: ₹{}",
                savedAccount.getAccountNumber(), newBalance);

        return AccountMapper.toDTO(savedAccount);
    }

    @Override
    @Transactional
    public AccountDTO withdraw(Long accountId, BigDecimal amount) {
        log.info("Withdrawing ₹{} from account ID: {}", amount, accountId);

        validatePositiveAmount(amount);

        Account account = findAccountOrThrow(accountId);

        BigDecimal newBalance = account.getBalance().subtract(amount);

        // Enforce business rules based on account type
        if (account.getAccountType() == AccountType.SAVINGS) {
            if (newBalance.compareTo(SAVINGS_MIN_BALANCE) < 0) {
                throw new InsufficientBalanceException(
                        "SAVINGS",
                        "Minimum balance of ₹1,000 must be maintained. " +
                        "Available for withdrawal: ₹" + account.getBalance().subtract(SAVINGS_MIN_BALANCE)
                );
            }
        } else if (account.getAccountType() == AccountType.CURRENT) {
            if (newBalance.compareTo(CURRENT_OVERDRAFT_LIMIT) < 0) {
                throw new InsufficientBalanceException(
                        "CURRENT",
                        "Overdraft limit of -₹5,000 reached. " +
                        "Available for withdrawal: ₹" + account.getBalance().subtract(CURRENT_OVERDRAFT_LIMIT)
                );
            }
        }

        // Deduct amount from balance
        account.setBalance(newBalance);
        Account savedAccount = accountRepository.save(account);

        // Record the transaction
        Transaction transaction = new Transaction(
                savedAccount, TransactionType.WITHDRAW, amount, newBalance
        );
        transactionRepository.save(transaction);

        log.info("Withdrawal successful. Account {} new balance: ₹{}",
                savedAccount.getAccountNumber(), newBalance);

        return AccountMapper.toDTO(savedAccount);
    }

    // =============================================
    // Transaction History
    // =============================================

    @Override
    @Transactional(readOnly = true)
    public List<TransactionDTO> getTransactions(Long accountId) {
        log.debug("Fetching transactions for account ID: {}", accountId);

        // Verify account exists
        findAccountOrThrow(accountId);

        return transactionRepository.findByAccountIdOrderByTimestampDesc(accountId)
                .stream()
                .map(TransactionMapper::toDTO)
                .collect(Collectors.toList());
    }

    // =============================================
    // Private Helpers
    // =============================================

    /**
     * Find an account by ID or throw ResourceNotFoundException.
     */
    private Account findAccountOrThrow(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
    }

    /**
     * Validate that the amount is positive.
     */
    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }

    /**
     * Generates a unique 13-character account number (ACC + 10 hex chars).
     */
    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            accountNumber = "ACC" + UUID.randomUUID().toString().replace("-", "")
                    .substring(0, 10).toUpperCase();
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }
}
