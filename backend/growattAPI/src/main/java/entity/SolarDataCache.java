package entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A cached Growatt chart response (day / month / year).
 *
 * <p>Each response is stored as its raw JSON {@link #payload} so every range keeps its
 * native shape while still being searchable by {@link #plantId} and {@link #date}. The
 * {@link #id} is an auto-generated Mongo ObjectId; uniqueness and fast look-ups are
 * provided by a compound index on {@code (type, plantId, date)} instead.</p>
 */
@Document(collection = "growattData")
@CompoundIndex(name = "type_plant_date_idx", def = "{'type': 1, 'plantId': 1, 'date': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SolarDataCache {

	/** Unique id (UUID). */
	@Id
	private String id;

	/** Range discriminator: DAY, MONTH, YEAR. */
	private String type;

	/** Id of the plant the data belongs to. */
	private String plantId;

	/** Date of the data, e.g. 2023-06-19, 2023-06 or 2023 depending on the type. */
	private String date;

	/** Raw JSON of the original Growatt response. */
	private String payload;

	/** When this entry was written. */
	private Instant cachedAt;

	/** Creates a new entry with a generated UUID id. */
	public SolarDataCache(String type, String plantId, String date, String payload, Instant cachedAt) {
		this.id = UUID.randomUUID().toString();
		this.type = type;
		this.plantId = plantId;
		this.date = date;
		this.payload = payload;
		this.cachedAt = cachedAt;
	}
}
