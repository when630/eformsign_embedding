package com.eformsign.api.config;

import com.eformsign.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<Void> handleIllegalArgumentException(IllegalArgumentException e) {
    return ApiResponse.error(e.getMessage());
  }

  @ExceptionHandler(org.springframework.web.reactive.function.client.WebClientResponseException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ApiResponse<Void> handleWebClientException(
      org.springframework.web.reactive.function.client.WebClientResponseException e) {
    String responseBody = e.getResponseBodyAsString();
    int statusCode = e.getStatusCode().value();
    System.err.println("WebClient Error (" + statusCode + "): " + responseBody);
    return ApiResponse.error("External API Error (" + statusCode + "): " + responseBody);
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ApiResponse<Void> handleException(Exception e) {
    e.printStackTrace(); // Log stack trace
    return ApiResponse.error("Internal Server Error: " + e.getMessage());
  }
}
