package com.eformsign.api.config.auth;

import com.eformsign.common.type.MemberRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RoleInterceptor implements HandlerInterceptor {

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    if (!(handler instanceof HandlerMethod)) {
      return true;
    }

    HandlerMethod handlerMethod = (HandlerMethod) handler;
    ManagerOnly managerOnly = handlerMethod.getMethodAnnotation(ManagerOnly.class);
    if (managerOnly == null) {
      managerOnly = handlerMethod.getBeanType().getAnnotation(ManagerOnly.class);
    }

    if (managerOnly != null) {
      MemberRole role = (MemberRole) request.getAttribute("USER_ROLE");
      if (role != MemberRole.MANAGER) {
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Requires Manager role");
        return false;
      }
    }

    return true;
  }
}
