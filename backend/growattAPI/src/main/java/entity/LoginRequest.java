package entity;

import lombok.Getter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Getter
public class LoginRequest {

    @NotBlank(message = "Account cannot be blank")
    @Email(message = "Account must be a valid email")
    private String account;
    
    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String passwordCrc;

    // Default constructor for Jackson
    public LoginRequest() {}

    // Optionally, you can keep your custom constructor if you use it elsewhere
    public LoginRequest(String account, String password) {
        this.account = account;
        this.passwordCrc = md5.MD5.md5(password);
    }

    // Optionally, add a setter for password that hashes automatically
    public void setPassword(String password) {
        this.passwordCrc = md5.MD5.md5(password);
    }

    public void setAccount(String account) {
        this.account = account;
    }
}