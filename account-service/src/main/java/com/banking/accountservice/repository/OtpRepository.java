package com.banking.accountservice.repository;

import com.banking.accountservice.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {

    List<Otp> findByEmail(String email);

    void deleteByEmail(String email);

    Optional<Otp> findTopByEmailAndUsedFalseOrderByIdDesc(String email);
}
