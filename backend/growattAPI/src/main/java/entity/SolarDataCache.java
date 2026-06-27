package entity;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A cached Growatt chart response (day / week / month / year), stored in Supabase Postgres.
 *
 * <p>Each response is kept as its raw JSON {@link #payload} (a {@code jsonb} column) so every
 * range keeps its native shape while remaining queryable by {@link #plantId} / {@link #date}.
 * The logical key {@code (type, plantId, date)} is the table's composite primary key
 * (see {@link SolarDataCacheId}); {@code repository.save(...)} therefore upserts by that key.</p>
 */
@Entity
@Table(name = "solar_data_cache")
@IdClass(SolarDataCacheId.class)
@Getter
@Setter
@NoArgsConstructor
public class SolarDataCache {

	/** Range discriminator: DAY, WEEK, MONTH, YEAR. */
	@Id
	private String type;

	/** Id of the plant the data belongs to. */
	@Id
	@Column(name = "plant_id")
	private String plantId;

	/** Date of the data, e.g. 2023-06-19, 2023-06 or 2023 depending on the type. */
	@Id
	private String date;

	/** Raw JSON of the original Growatt response (jsonb). */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private String payload;

	/** When this entry was written. */
	@Column(name = "cached_at")
	private Instant cachedAt;

	/** Creates a new cache entry (keyed by type/plantId/date). */
	public SolarDataCache(String type, String plantId, String date, String payload, Instant cachedAt) {
		this.type = type;
		this.plantId = plantId;
		this.date = date;
		this.payload = payload;
		this.cachedAt = cachedAt;
	}
}
