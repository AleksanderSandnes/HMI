package md5;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

class MD5Test {

	/**
	 * {@link MD5#md5(String)} downloads Growatt's MD5.js at runtime and evaluates it with
	 * Nashorn, so it depends on network access. When the script cannot be fetched (offline
	 * CI, Nashorn unavailable, Growatt down) {@code md5(..)} returns {@code null}; in that
	 * case we skip rather than fail the build. When it IS reachable we assert the exact
	 * Growatt-flavoured digest so a regression in the algorithm is still caught.
	 */
	@Test
	void testMD5() {
		String result = MD5.md5("PlainPassword");
		Assumptions.assumeTrue(
				result != null,
				"Skipping: Growatt MD5 script could not be loaded (offline or Nashorn unavailable)");
		assertEquals("bc8c2fa9a9d734eb030b44e97c75f7ce", result);
	}

}
