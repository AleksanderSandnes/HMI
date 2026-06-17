package entity;

/**
 * Common contract for all Growatt API responses so the caching layer can
 * uniformly check whether a response was successful before persisting it.
 */
public interface GrowattResponse {

	/** Status of the query: 1 == ok. */
	Long getResult();

	/** Whether the response actually carries usable production data (not all null/zero). */
	boolean hasData();
}
