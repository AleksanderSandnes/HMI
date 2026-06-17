package repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import entity.SolarDataCache;

/**
 * MongoDB repository for cached Growatt responses.
 */
public interface SolarDataCacheRepository extends MongoRepository<SolarDataCache, String> {

	/** Look up a single cached entry by its logical key. */
	Optional<SolarDataCache> findFirstByTypeAndPlantIdAndDate(String type, String plantId, String date);

	/** All cached entries for a plant of a given range type. */
	List<SolarDataCache> findByPlantIdAndType(String plantId, String type);

	/** All cached entries for a plant on a given date (across range types). */
	List<SolarDataCache> findByPlantIdAndDate(String plantId, String date);
}
