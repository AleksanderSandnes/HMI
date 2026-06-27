package repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.SolarDataCache;
import entity.SolarDataCacheId;

/**
 * Postgres (JPA) repository for cached Growatt responses. {@code save(...)} upserts by the
 * composite key {@code (type, plantId, date)}.
 */
public interface SolarDataCacheRepository extends JpaRepository<SolarDataCache, SolarDataCacheId> {

	/** Look up a single cached entry by its logical key. */
	Optional<SolarDataCache> findFirstByTypeAndPlantIdAndDate(String type, String plantId, String date);

	/** All cached entries for a plant of a given range type. */
	List<SolarDataCache> findByPlantIdAndType(String plantId, String type);

	/** All cached entries for a plant on a given date (across range types). */
	List<SolarDataCache> findByPlantIdAndDate(String plantId, String date);
}
