package com.banking.accountservice.service;

import com.banking.accountservice.dto.AccountDTO;
import com.banking.accountservice.entity.Account;
import com.banking.accountservice.entity.AccountType;
import com.banking.accountservice.exception.InsufficientBalanceException;
import com.banking.accountservice.repository.AccountRepository;
import com.banking.accountservice.repository.TransactionRepository;
import com.banking.accountservice.security.SecurityUtils;
import com.banking.accountservice.service.impl.AccountServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    private AccountServiceImpl accountService;

    private Account account;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@banking.com", null, java.util.List.of(
                        () -> "ROLE_ADMIN"
                ))
        );
        accountService = new AccountServiceImpl(accountRepository, transactionRepository, new SecurityUtils());

        account = new Account();
        account.setId(1L);
        account.setAccountHolderName("Test User");
        account.setAccountNumber("ACC1234567890");
        account.setAccountType(AccountType.SAVINGS);
        account.setBalance(new BigDecimal("5000.00"));
    }

    @Test
    void deposit_successCase() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountDTO result = accountService.deposit(1L, new BigDecimal("1000.00"));

        assertEquals(new BigDecimal("6000.00"), result.getBalance());
        verify(accountRepository, times(1)).save(any(Account.class));
        verify(transactionRepository, times(1)).save(any());
    }

    @Test
    void withdraw_successCase() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountDTO result = accountService.withdraw(1L, new BigDecimal("2000.00"));

        assertEquals(new BigDecimal("3000.00"), result.getBalance());
        verify(accountRepository, times(1)).save(any(Account.class));
        verify(transactionRepository, times(1)).save(any());
    }

    @Test
    void withdraw_insufficientBalanceCase() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThrows(InsufficientBalanceException.class,
                () -> accountService.withdraw(1L, new BigDecimal("4500.00")));

        verify(transactionRepository, times(0)).save(any());
    }
}
