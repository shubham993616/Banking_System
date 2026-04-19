package com.banking.accountservice.dto.auth;

public class EmailRegisteredResponse {

    private final boolean registered;

    public EmailRegisteredResponse(boolean registered) {
        this.registered = registered;
    }

    public boolean isRegistered() {
        return registered;
    }
}
