package entity;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class YearResponse implements GrowattResponse {
	
	private Long result;
	private Obj obj;

	/** True when at least one month of the year has real production. */
	@Override
	public boolean hasData() {
		return obj != null && obj.getEnergy() != null
				&& obj.getEnergy().stream().anyMatch(value -> value != null && value > 0);
	}

	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	public class Obj {
		
		private List<Double> energy;

	}
	
}