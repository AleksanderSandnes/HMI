package entity;

import md5.MD5;
import lombok.Getter;

@Getter
public class LoginRequest {
	
	private String account;
	private String passwordCrc;
	
	// Default constructor for Jackson
	public LoginRequest() {}
	
	public LoginRequest(String account, String password) {
		this.account = account;
		this.passwordCrc = MD5.md5(password);
	}
	
	// Setters for Jackson deserialization
	public void setAccount(String account) {
		this.account = account;
	}
	
	public void setPassword(String password) {
		this.passwordCrc = MD5.md5(password);
	}
}