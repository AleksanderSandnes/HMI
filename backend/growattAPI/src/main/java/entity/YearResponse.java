package entity;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class YearResponse {
	
	private Long result;
	private Obj obj;

	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	public class Obj {
		
		private List<Double> energy;

	}
	
}