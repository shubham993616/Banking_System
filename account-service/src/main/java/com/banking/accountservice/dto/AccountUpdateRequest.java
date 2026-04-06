package com.banking.accountservice.dto;

import java.math.BigDecimal;

/**
 * DTO for updating an existing account.
 * All fields are optional — only non-null values will be applied.
 */
public class AccountUpdateRequest {

    private String accountHolderName;
    private String accountType;
    private BigDecimal balance;
    private String email;
    private String phoneNumber;

    public AccountUpdateRequest() {
    }

    // --- Getters and Setters ---

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
