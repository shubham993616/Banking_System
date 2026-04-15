package com.banking.accountservice.repository;

import com.banking.accountservice.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Transaction entity.
 * Spring Data JPA auto-generates the implementation at runtime.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /** Find all transactions for a given account, sorted by most recent first. */
    List<Transaction> findByAccountIdOrderByTimestampDesc(Long accountId);
}
