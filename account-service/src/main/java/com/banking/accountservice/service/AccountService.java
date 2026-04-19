package com.banking.accountservice.service;

import com.banking.accountservice.dto.AccountCreateRequest;
import com.banking.accountservice.dto.AccountDTO;
import com.banking.accountservice.dto.PagedResponse;
import com.banking.accountservice.dto.AccountUpdateRequest;
import com.banking.accountservice.dto.TransactionDTO;
import com.banking.accountservice.dto.TransferRequest;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service interface for Account operations.
 * Defines the business logic contract — implementation is separate.
 */
public interface AccountService {

    /** Create a new bank account. */
    AccountDTO createAccount(AccountCreateRequest request);

    /** Get all accounts. */
    List<AccountDTO> getAllAccounts();

    /** Get accounts of currently authenticated user. */
    List<AccountDTO> getMyAccounts();

    /** Get a single account by its ID. */
    AccountDTO getAccountById(Long id);

    /** Get a single account by its account number. */
    AccountDTO getAccountByAccountNumber(String accountNumber);

    /** Update an existing account. */
    AccountDTO updateAccount(Long id, AccountUpdateRequest request);

    /** Delete an account by its ID. */
    void deleteAccount(Long id);

    /** Deposit money into an account. */
    AccountDTO deposit(Long accountId, BigDecimal amount);

    /** Withdraw money from an account. */
    AccountDTO withdraw(Long accountId, BigDecimal amount);

    /** Get paged transactions for an account, sorted by latest first. */
    PagedResponse<TransactionDTO> getTransactions(Long accountId, int page, int size);

    /** Transfer money between two accounts atomically. */
    void transfer(TransferRequest request);
}
