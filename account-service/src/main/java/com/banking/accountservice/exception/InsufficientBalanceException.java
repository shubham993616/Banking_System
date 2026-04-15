package com.banking.accountservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an account has insufficient balance for a withdrawal.
 * Considers SAVINGS minimum balance (₹1,000) and CURRENT overdraft limit (-₹5,000).
 * Returns HTTP 400 Bad Request.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InsufficientBalanceException extends RuntimeException {

    private final String accountType;
    private final String limit;

    public InsufficientBalanceException(String accountType, String limit) {
        super(String.format("Insufficient balance for %s account. %s", accountType, limit));
        this.accountType = accountType;
        this.limit = limit;
    }

    public String getAccountType() { return accountType; }
    public String getLimit() { return limit; }
}
