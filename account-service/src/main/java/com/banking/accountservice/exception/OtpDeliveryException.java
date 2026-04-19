package com.banking.accountservice.exception;

/**
 * Thrown when an OTP cannot be delivered (e.g. SMTP failure).
 * Separate from generic {@link IllegalStateException} so API responses stay accurate.
 */
public class OtpDeliveryException extends RuntimeException {

    public OtpDeliveryException(String message) {
        super(message);
    }

    public OtpDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
