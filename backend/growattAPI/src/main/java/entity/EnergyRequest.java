package entity;

import lombok.Getter;

@Getter
public class EnergyRequest {
	
	/** Id of the plant that is queried. Is set as a cookie during the login process */
	private String plantId;
	
	/** e.g. 2023, 2023-06, 2023-06-19 depending on the query */
	private String date;
	
	// Default constructor for Jackson
	public EnergyRequest() {}
	
	public EnergyRequest(String plantId) {
		this.plantId = plantId;
		this.date = null;
	}
	
	public EnergyRequest(String plantId, String date) {
		this.plantId = plantId;
		this.date = date;
	}
	
	// Setters for Jackson
	public void setPlantId(String plantId) {
		this.plantId = plantId;
	}
	
	public void setDate(String date) {
		this.date = date;
	}
}
