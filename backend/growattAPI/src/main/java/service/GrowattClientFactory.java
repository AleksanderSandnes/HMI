package service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import controller.GrowattWebClient;
import io.micrometer.common.util.StringUtils;

/**
 * Produces a <b>fresh</b> {@link GrowattWebClient} per use. Growatt sessions are stateful
 * (cookie jar incl. the plant id), so a single shared client would bleed one user's session
 * into another's request. Each login therefore gets its own client. The optional outbound
 * proxy ({@code growatt.proxy.url}/{@code growatt.proxy.port}) is the escalation lever when
 * Growatt IP-blocks the server's egress.
 */
@Component
public class GrowattClientFactory {

	@Value("${growatt.proxy.url:}")
	private String proxyUrl;

	@Value("${growatt.proxy.port:0}")
	private int proxyPort;

	public GrowattWebClient create() {
		return StringUtils.isBlank(proxyUrl)
				? new GrowattWebClient()
				: new GrowattWebClient(proxyUrl, proxyPort);
	}
}
