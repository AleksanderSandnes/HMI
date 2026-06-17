package entity;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DayResponse implements GrowattResponse {
	
	/** Status of query: 1 == ok */
	private Long result;
	
	private Obj obj;

	/** True when at least one interval has real production (ignores leading/trailing night nulls). */
	@Override
	public boolean hasData() {
		return obj != null && obj.getPac() != null
				&& obj.getPac().stream().anyMatch(value -> value != null && value > 0);
	}

	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	public class Obj {
		
		/** Power production for each 5 minute interval of the day, in total 288 values */
		private List<Double> pac;
	}
	
}
