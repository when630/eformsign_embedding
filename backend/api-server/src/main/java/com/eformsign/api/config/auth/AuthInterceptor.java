package com.eformsign.api.config.auth;

import com.eformsign.common.util.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

  private final JwtProvider jwtProvider;

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    if (request.getMethod().equals("OPTIONS"))
      return true;

    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      if (jwtProvider.validateToken(token)) {
        String subject = jwtProvider.getSubject(token);
        log.debug("AuthInterceptor: Token valid. Subject: {}", subject);
        request.setAttribute("USER_ID", subject);
        request.setAttribute("USER_ROLE", jwtProvider.getRole(token));
        return true;
      } else {
        log.warn("AuthInterceptor: Token valid failed");
      }
    }

    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or missing token");
    return false;
  }
}
