package entity;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class RequestAndCacheIdentityTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void requestJsonPreservesDateAndHashesPasswords() throws Exception {
        var energy = mapper.readValue("{\"plantId\":\"demo-plant\",\"date\":\"2025-01\"}", EnergyRequest.class);
        assertEquals("demo-plant", energy.getPlantId());
        assertEquals("2025-01", energy.getDate());
        var login = mapper.readValue("{\"account\":\"demo@example.com\",\"password\":\"PlainPassword\"}", LoginRequest.class);
        assertEquals("demo@example.com", login.getAccount());
        assertEquals("bc8c2fa9a9d734eb030b44e97c75f7ce", login.getPasswordCrc());
        assertFalse(mapper.writeValueAsString(login).contains("PlainPassword"));
        var mutable = new LoginRequest();
        mutable.setAccount("other-demo@example.com");
        mutable.setPassword("abc");
        assertEquals("other-demo@example.com", mutable.getAccount());
        assertEquals("900150983cd24fb0d6963f7d28e17f72", mutable.getPasswordCrc());
    }

    @Test
    void cacheIdentityUsesAllThreeKeyFields() {
        var key = new SolarDataCacheId("DAY", "demo-plant", "2025-01-01");
        var same = new SolarDataCacheId("DAY", "demo-plant", "2025-01-01");
        assertEquals(key, key);
        assertEquals(key, same);
        assertEquals(key.hashCode(), same.hashCode());
        assertNotEquals(key, null);
        assertNotEquals(key, "DAY");
        assertNotEquals(key, new SolarDataCacheId("MONTH", "demo-plant", "2025-01-01"));
        assertNotEquals(key, new SolarDataCacheId("DAY", "other-plant", "2025-01-01"));
        assertNotEquals(key, new SolarDataCacheId("DAY", "demo-plant", "2025-01-02"));
        assertEquals(new SolarDataCacheId(), new SolarDataCacheId());
    }
}
