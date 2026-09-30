package md5;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class MD5Test {

    /** Fixed compatibility vectors verified against Growatt's MD5.js, without a live dependency. */
    @Test
    void matchesProviderUtf8PasswordDigests() {
        assertEquals("bc8c2fa9a9d734eb030b44e97c75f7ce", MD5.md5("PlainPassword"));
        assertEquals("d41d8cd98f00b204e9800998ecf8427e", MD5.md5(""));
        assertEquals("900150983cd24fb0d6963f7d28e17f72", MD5.md5("abc"));
        assertEquals("c4735c275339c1840a5cadd59a9d41cb", MD5.md5("påssord"));
        assertEquals("0f426c3da8e1a8bfddd36fead7e3ae35", MD5.md5("家庭🔐"));
        assertEquals("2dc8f4b282f6dec7471173938ea4bd41", MD5.md5("line\r\nend"));
    }

    @Test
    void nullPasswordFailsBeforeStartingALogin() {
        assertThrows(NullPointerException.class, () -> MD5.md5(null));
    }

    @Test
    void missingAlgorithmFailsInsteadOfSendingAnEmptyPasswordHash() {
        try (var digests = org.mockito.Mockito.mockStatic(java.security.MessageDigest.class)) {
            digests.when(() -> java.security.MessageDigest.getInstance("MD5"))
                    .thenThrow(new java.security.NoSuchAlgorithmException("unavailable"));
            var failure = assertThrows(IllegalStateException.class, () -> MD5.md5("fictional-password"));
            assertInstanceOf(java.security.NoSuchAlgorithmException.class, failure.getCause());
            assertFalse(failure.getMessage().contains("fictional-password"));
        }
    }
}
