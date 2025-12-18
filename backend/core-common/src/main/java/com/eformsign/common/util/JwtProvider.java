package com.eformsign.common.util;

import com.eformsign.common.type.MemberRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {

  private final Key key;

  public JwtProvider(@Value("thisisthedefaultsecretkeyforeformsigndemoprojectwhichmustbeverylong") String secretKey) {
    byte[] keyBytes = Decoders.BASE64.decode(secretKey);
    this.key = Keys.hmacShaKeyFor(keyBytes);
  }

  public String createToken(String subject, MemberRole role) {
    Date now = new Date();
    Date validity = new Date(now.getTime() + 3600000); // 1 hour

    return Jwts.builder()
        .setSubject(subject)
        .claim("role", role.name())
        .setIssuedAt(now)
        .setExpiration(validity)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  public String getSubject(String token) {
    return Jwts.parserBuilder().setSigningKey(key).build()
        .parseClaimsJws(token)
        .getBody()
        .getSubject();
  }

  public MemberRole getRole(String token) {
    String roleStr = Jwts.parserBuilder().setSigningKey(key).build()
        .parseClaimsJws(token)
        .getBody()
        .get("role", String.class);
    return MemberRole.valueOf(roleStr);
  }
}
