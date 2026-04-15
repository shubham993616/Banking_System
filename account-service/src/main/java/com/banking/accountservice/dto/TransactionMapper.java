package com.banking.accountservice.dto;

import com.banking.accountservice.entity.Transaction;

/**
 * Utility class for mapping between Transaction Entity and DTO.
 */
public class TransactionMapper {

    private TransactionMapper() {
        // Utility class — prevent instantiation
    }

    /**
     * Convert Transaction entity → TransactionDTO (for API responses).
     */
    public static TransactionDTO toDTO(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setAccountId(transaction.getAccount().getId());
        dto.setType(transaction.getType().name());
        dto.setAmount(transaction.getAmount());
        dto.setBalanceAfterTransaction(transaction.getBalanceAfterTransaction());
        dto.setTimestamp(transaction.getTimestamp());
        return dto;
    }
}
