package entity.growatt;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Raw Growatt v2.0.0 response from {@code /panel/getDevicesByPlantList}. Provides the
 * cumulative "as of now" figures (eToday/eMonth/eTotal/pac) that the old
 * {@code /indexbC/getTotalData} + {@code /indexbC/inv/getInvTotalData} endpoints used to
 * return. Mapped into our {@code TotalDataResponse} / {@code TotalDataInvResponse}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@NoArgsConstructor
public class GwDevicesResponse {

	private Obj obj;

	@JsonIgnoreProperties(ignoreUnknown = true)
	@Getter
	@NoArgsConstructor
	public static class Obj {
		private List<Data> datas;
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	@Getter
	@NoArgsConstructor
	public static class Data {
		@JsonProperty("eToday")
		private Double eToday;
		@JsonProperty("eMonth")
		private Double eMonth;
		@JsonProperty("eTotal")
		private Double eTotal;
		private Double pac;
		private String nominalPower;
		private String plantId;
		private String sn;
		private String plantName;
		private String status;
	}

	/** The first device of the plant, or null if none. */
	public Data firstDevice() {
		return (obj != null && obj.getDatas() != null && !obj.getDatas().isEmpty())
				? obj.getDatas().get(0)
				: null;
	}
}
