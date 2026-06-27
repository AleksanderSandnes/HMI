package service;

import controller.GrowattWebClient;

/**
 * A logged-in Growatt session: the per-request client (with its cookie jar) and the resolved
 * plant id to query.
 */
public record GrowattSession(GrowattWebClient client, String plantId) {
}
