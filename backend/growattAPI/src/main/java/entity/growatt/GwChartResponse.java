package entity.growatt;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Raw Growatt v2.0.0 chart response from the {@code /energy/compare/getDevices*Chart}
 * endpoints. Shape (day/month/year share it):
 * <pre>{ "result": 1, "obj": [ { "datas": { "pac": [...], "energy": [...], "autoEnergy": [...] },
 *   "sn": "...", "type": "plant", "params": "..." } ] }</pre>
 * Mapped into our stable {@code DayResponse}/{@code MonthResponse}/{@code YearResponse} by
 * {@code GrowattWebClient}, so the public API contract and the frontend stay unchanged.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@NoArgsConstructor
public class GwChartResponse {

	private List<Obj> obj;

	@JsonIgnoreProperties(ignoreUnknown = true)
	@Getter
	@NoArgsConstructor
	public static class Obj {
		private Datas datas;
		private String sn;
		private String type;
		private String params;
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	@Getter
	@NoArgsConstructor
	public static class Datas {
		/** 5-minute power values for the day chart (≈288 values). */
		private List<Double> pac;
		/** Per-day (month chart) or per-month (year chart) energy totals. */
		private List<Double> energy;
		/** Per-day auto-consumption energy (month chart). */
		private List<Double> autoEnergy;
	}

	/** The datas block of the first series, or null if the response carried none. */
	public Datas firstDatas() {
		return (obj != null && !obj.isEmpty() && obj.get(0) != null) ? obj.get(0).getDatas() : null;
	}
}
