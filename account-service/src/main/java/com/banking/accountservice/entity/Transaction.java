package com.banking.accountservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a banking transaction.
 * Maps to the 'transactions' table in the database.
 * Every deposit/withdraw operation creates a transaction record.
 */
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_after_transaction", nullable = false, precision = 19, scale = 2)
    private BigDecimal balanceAfterTransaction;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }

    // --- Constructors ---

    public Transaction() {
    }

    public Transaction(Account account, TransactionType type, BigDecimal amount, BigDecimal balanceAfterTransaction) {
        this.account = account;
        this.type = type;
        this.amount = amount;
        this.balanceAfterTransaction = balanceAfterTransaction;
    }

    // --- Getters and Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getBalanceAfterTransaction() { return balanceAfterTransaction; }
    public void setBalanceAfterTransaction(BigDecimal balanceAfterTransaction) { this.balanceAfterTransaction = balanceAfterTransaction; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    @Override
    public String toString() {
        return "Transaction{id=" + id + ", type=" + type + ", amount=" + amount +
               ", balanceAfter=" + balanceAfterTransaction + ", timestamp=" + timestamp + "}";
    }
}
