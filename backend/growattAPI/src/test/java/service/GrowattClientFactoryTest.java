package service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class GrowattClientFactoryTest {
    @Test
    void eachLoginGetsAnIndependentClientWithOrWithoutProxy() {
        var factory = new GrowattClientFactory();
        for (String proxy : new String[] {null, "", " ", "localhost"}) {
            ReflectionTestUtils.setField(factory, "proxyUrl", proxy);
            ReflectionTestUtils.setField(factory, "proxyPort", 8080);
            var first = factory.create();
            var second = factory.create();
            assertNotSame(first, second);
            assertNull(first.getPlantId());
            assertNull(second.getPlantId());
        }
    }
}
