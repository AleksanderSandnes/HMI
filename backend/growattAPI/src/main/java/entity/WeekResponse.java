package entity;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregated weekly production. Growatt has no native weekly endpoint, so this response is
 * assembled in {@link service.GrowattDataService} from the daily totals contained in the
 * monthly chart(s) covering the requested 7-day window.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class WeekResponse implements GrowattResponse {

	/** Status of query: 1 == ok */
	private Long result;

	private Obj obj;

	/** True when at least one day of the week has real production. */
	@Override
	public boolean hasData() {
		return obj != null && obj.getEnergy() != null
				&& obj.getEnergy().stream().anyMatch(value -> value != null && value > 0);
	}

	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Obj {

		/** Energy production (kWh) for each of the 7 days in the window, oldest first. */
		private List<Double> energy;

		/** The calendar date (yyyy-MM-dd) matching each value in {@link #energy}. */
		private List<String> days;
	}

}
