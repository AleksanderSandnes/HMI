package entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TotalDataInvResponse implements GrowattResponse {

	private Long result;
	private Obj obj;

	@Override
	public boolean hasData() {
		return obj != null;
	}

	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Obj {

		private String epvToday;
		private String epvTotal;
		private String pac;
	}
}
