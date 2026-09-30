package md5;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Objects;

/** Growatt's passwordCrc wire format: lowercase MD5 of the UTF-8 password. */
public final class MD5 {

    private MD5() {}

    public static String md5(String password) {
        Objects.requireNonNull(password, "Password is required");
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("MD5")
                    .digest(password.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Required MD5 algorithm is unavailable", e);
        }
    }
}
