package entity;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EnergyRequest {
	
	/** Id of the plant that is queried. Is set as a cookie during the login process */
	private String plantId;
	
	/** Date in format YYYY-MM-DD, YYYY-MM, or YYYY */
	@NotBlank(message = "Date cannot be blank")
	@Pattern(regexp = "^\\d{4}(-\\d{2}(-\\d{2})?)?$", message = "Date must be in format YYYY-MM-DD, YYYY-MM, or YYYY")
	private String date;
	
	// Single-argument constructor for backward compatibility
	public EnergyRequest(String date) {
		this.date = date;
	}
}
