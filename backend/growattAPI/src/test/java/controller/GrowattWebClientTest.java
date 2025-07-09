package controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.platform.commons.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import entity.DayResponse;
import entity.EnergyRequest;
import entity.LoginRequest;
import entity.MonthResponse;
import entity.TotalDataInvResponse;
import entity.TotalDataResponse;
import entity.YearResponse;

@ExtendWith(SpringExtension.class)
@TestPropertySource("classpath:application.properties") 
class GrowattWebClientTest {
	
	@Value("${growatt.account}")
	private String account;
	
	@Value("${growatt.password}")
	private String password;
	
	@Value("${proxy.url}")
	private String proxyUrl;
	
	@Value("${proxy.port}")
	private String proxyPort;
	
	// enable after setting account/password in src/test/resources/application.properties
	@Test
	void testGrowattWebClient() {
		
		assertFalse(StringUtils.isBlank(account)); // define an user name in the application.properties
		assertFalse(StringUtils.isBlank(password)); // define a password in the application.properties
		
		GrowattWebClient client = StringUtils.isBlank(proxyUrl) ? new GrowattWebClient() : new GrowattWebClient(proxyUrl, Integer.valueOf(proxyPort));
		
		String login = client.login(new LoginRequest(account, password));
		assertEquals("{\"result\":1}", login);
		assertNotNull(client.getPlantId());
		
		TotalDataResponse totalData = client.getTotalData(new EnergyRequest(client.getPlantId()));
		assertEquals(1, totalData.getResult());
		assertEquals(account, totalData.getObj().getAccountName());
		assertEquals(client.getPlantId(), totalData.getObj().getPlantId());
		
		TotalDataInvResponse totalDataInv = client.getInvTotalData(new EnergyRequest(client.getPlantId()));
		assertEquals(1, totalDataInv.getResult());
		
		DayResponse day = client.getInvEnergyDayChart(new EnergyRequest(client.getPlantId(), "2023-05-31"));
		assertEquals(1, day.getResult());
		assertEquals(24*12, day.getObj().getPac().size());
		
		MonthResponse month = client.getInvEnergyMonthChart(new EnergyRequest(client.getPlantId(), "2023-05"));
		assertEquals(1, month.getResult());
		assertEquals(31, month.getObj().getEnergy().size());
		
		YearResponse year = client.getInvEnergyYearChart(new EnergyRequest(client.getPlantId(), "2023"));
		assertEquals(1, year.getResult());
		assertEquals(12, year.getObj().getEnergy().size());
	}

}
