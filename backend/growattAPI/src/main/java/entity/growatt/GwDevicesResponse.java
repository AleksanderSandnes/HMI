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
		/** Total number of devices on the plant (list metadata). */
		private Integer count;
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
		/** Device run status: "1" == online/normal. */
		private String status;
		private String deviceModel;
		private String deviceTypeName;
		private String lastUpdateTime;
		private String accountName;
	}

	/** The first device of the plant, or null if none. */
	public Data firstDevice() {
		return (obj != null && obj.getDatas() != null && !obj.getDatas().isEmpty())
				? obj.getDatas().get(0)
				: null;
	}

	/** Total device count for the plant ("count" field, falling back to the list size). */
	public String deviceCount() {
		if (obj == null) {
			return null;
		}
		if (obj.getCount() != null) {
			return String.valueOf(obj.getCount());
		}
		return obj.getDatas() != null ? String.valueOf(obj.getDatas().size()) : null;
	}

	/** Number of devices currently online (status "1"); null if the list is absent. */
	public String onlineCount() {
		if (obj == null || obj.getDatas() == null) {
			return null;
		}
		long online = obj.getDatas().stream().filter(d -> "1".equals(d.getStatus())).count();
		return String.valueOf(online);
	}
}
