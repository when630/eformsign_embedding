package com.eformsign.api.controller;

import com.eformsign.api.service.AuthService;
import com.eformsign.common.dto.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/login")
  public ApiResponse<Map<String, String>> login(@RequestBody LoginRequest request) {
    String token = authService.login(request.getLoginId(), request.getPassword());
    return ApiResponse.success(Map.of("accessToken", token));
  }

  @Data
  public static class LoginRequest {
    private String loginId;
    private String password;
  }
}
