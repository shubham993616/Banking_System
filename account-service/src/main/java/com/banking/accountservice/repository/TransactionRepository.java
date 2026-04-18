package com.banking.accountservice.repository;

import com.banking.accountservice.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Transaction entity.
 * Spring Data JPA auto-generates the implementation at runtime.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /** Find paged transactions for a given account, sorted by most recent first. */
    Page<Transaction> findByAccountId(Long accountId, Pageable pageable);

     void deleteByAccountId(Long accountId);
}
