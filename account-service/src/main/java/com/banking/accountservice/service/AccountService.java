package com.banking.accountservice.service;

import com.banking.accountservice.dto.AccountCreateRequest;
import com.banking.accountservice.dto.AccountDTO;
import com.banking.accountservice.dto.AccountUpdateRequest;

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

    /** Get a single account by its ID. */
    AccountDTO getAccountById(Long id);

    /** Get a single account by its account number. */
    AccountDTO getAccountByAccountNumber(String accountNumber);

    /** Update an existing account. */
    AccountDTO updateAccount(Long id, AccountUpdateRequest request);

    /** Delete an account by its ID. */
    void deleteAccount(Long id);
}
