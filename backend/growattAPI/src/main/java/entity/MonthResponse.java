package entity;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MonthResponse implements GrowattResponse {
	
	/** Status of query: 1 == ok */
	private Long result;
	
	private Obj obj;

	/** True when at least one day of the month has real production. */
	@Override
	public boolean hasData() {
		return obj != null && obj.getEnergy() != null
				&& obj.getEnergy().stream().anyMatch(value -> value != null && value > 0);
	}

	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	public class Obj {
		
		/** Power production for each day of the month */
		private List<Double> energy;

	}
	
}
