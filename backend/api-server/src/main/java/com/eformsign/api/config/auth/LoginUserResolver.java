package com.eformsign.api.config.auth;

import com.eformsign.common.type.MemberRole;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import lombok.extern.slf4j.Slf4j;

@Slf4j

@Component
public class LoginUserResolver implements HandlerMethodArgumentResolver {

  @Override
  public boolean supportsParameter(MethodParameter parameter) {
    return parameter.hasParameterAnnotation(LoginUser.class);
  }

  @Override
  public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
      NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
    HttpServletRequest request = (HttpServletRequest) webRequest.getNativeRequest();
    String userId = (String) request.getAttribute("USER_ID");
    log.debug("Resolving LoginUser: userId attribute = {}", userId);
    if (userId == null) {
      log.warn("LoginUserResolver: USER_ID attribute is null");
      return null;
    }

    // Return a simple DTO or just the ID depending on need.
    // For now returning a Map or custom object would be better, but let's conform
    // to what request has.
    // Or simply returning the user ID string if the parameter is String.
    // Let's assume usage is @LoginUser String userId or we create a UserSession
    // object.
    // Checking parameter type:
    if (parameter.getParameterType().equals(String.class)) {
      return userId; // Return LoginId
    }

    return null;
  }
}
