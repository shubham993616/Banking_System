package com.banking.accountservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for Transaction responses.
 * Decouples the API response from the internal entity.
 */
public class TransactionDTO {

    private Long id;
    private Long accountId;
    private String type;
    private BigDecimal amount;
    private BigDecimal balanceAfterTransaction;
    private LocalDateTime timestamp;

    public TransactionDTO() {
    }

    // --- Getters and Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getBalanceAfterTransaction() { return balanceAfterTransaction; }
    public void setBalanceAfterTransaction(BigDecimal balanceAfterTransaction) { this.balanceAfterTransaction = balanceAfterTransaction; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
