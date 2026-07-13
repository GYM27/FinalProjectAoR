package com.grupo3aor.innovationlab.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when attempting to activate an account that is already active.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class AccountAlreadyActivatedException extends RuntimeException {

    public AccountAlreadyActivatedException(String message) {
        super(message);
    }

    public AccountAlreadyActivatedException(String message, Throwable cause) {
        super(message, cause);
    }
}
