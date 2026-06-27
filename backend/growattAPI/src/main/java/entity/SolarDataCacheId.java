package entity;

import java.io.Serializable;
import java.util.Objects;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Composite primary key for {@link SolarDataCache}, matching the Postgres
 * {@code solar_data_cache} primary key {@code (type, plant_id, date)}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SolarDataCacheId implements Serializable {

	private String type;
	private String plantId;
	private String date;

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof SolarDataCacheId that)) return false;
		return Objects.equals(type, that.type)
				&& Objects.equals(plantId, that.plantId)
				&& Objects.equals(date, that.date);
	}

	@Override
	public int hashCode() {
		return Objects.hash(type, plantId, date);
	}
}
