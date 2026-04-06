package com.banking.accountservice.repository;

import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Account entity.
 * Spring Data JPA auto-generates the implementation at runtime.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    /** Find an account by its unique account number. */
    Optional<Account> findByAccountNumber(String accountNumber);

    /** Check if an account with the given account number already exists. */
    boolean existsByAccountNumber(String accountNumber);

    /** Find all accounts of a given type. */
    List<Account> findByAccountType(AccountType accountType);

    /** Find all active accounts. */
    List<Account> findByActiveTrue();

    /** Search by account holder name (case-insensitive, partial match). */
    List<Account> findByAccountHolderNameContainingIgnoreCase(String name);
}
