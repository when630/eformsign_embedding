package com.eformsign.api.service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EformsignService {

  private final String apiKey;
  private final String companyId;
  private final String secretKey;
  private final WebClient webClient;

  public EformsignService(
      @Value("${eformsign.api.url}") String eformsignUrl,
      @Value("${eformsign.api.key}") String apiKey,
      @Value("${eformsign.company.id}") String companyId,
      @Value("${eformsign.secret.key}") String secretKey) {
    this.apiKey = apiKey;
    this.companyId = companyId;
    this.secretKey = secretKey;
    this.webClient = WebClient.builder()
        .baseUrl(eformsignUrl)
        .build();
  }

  public Map<String, Object> generateToken(String memberId) {
    // Return structure expected by Frontend for iframe init
    Map<String, Object> response = new HashMap<>();

    // Use the real access token from Eformsign API
    try {
      Map<String, Object> tokenData = getAccessToken(memberId);

      // Ensure we pass the full structure the frontend expects under 'oauth_token'
      // If tokenData already contains keys like 'access_token', 'refresh_token', copy
      // them.
      Map<String, Object> oauthTokenContext = new HashMap<>(tokenData);

      // Ensure id is present if not in tokenData
      if (!oauthTokenContext.containsKey("id")) {
        oauthTokenContext.put("id", memberId);
      }

      response.put("oauth_token", oauthTokenContext);
    } catch (Exception e) {
      log.error("Failed to get access token for embedding", e);
      throw new RuntimeException("Failed to get access token for embedding", e);
    }

    Map<String, Object> apiKeyInfo = new HashMap<>();
    Map<String, String> company = new HashMap<>();
    company.put("company_id", companyId);
    company.put("user_key", apiKey);
    apiKeyInfo.put("company", company);

    response.put("api_key", apiKeyInfo);

    return response;
  }

  public Map<String, Object> getTemplates(String memberId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/forms")
            .queryParam("member_id", memberId)
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .header("Content-Type", "application/json")
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  public Map<String, Object> getDocuments(String memberId, String type) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    Map<String, Object> body = new HashMap<>();
    String typeCode = (type != null && !type.isEmpty()) ? type : "01"; // Default to 01 (Todo) or 04 (All)

    body.put("type", typeCode);
    body.put("limit", "20");
    body.put("skip", "0");
    body.put("template_ids", new String[] {});
    body.put("title", "");
    body.put("content", "");
    body.put("title_and_content", "");

    return webClient.method(org.springframework.http.HttpMethod.GET)
        .uri("/v2.0/api/documents")
        .header("Authorization", "Bearer " + accessToken)
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  // --- Template Management ---
  public Map<String, Object> duplicateTemplate(String memberId, String templateId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    // Assuming POST /v2.0/api/forms/{form_id}/duplicate
    return webClient.post()
        .uri("/v2.0/api/forms/" + templateId + "/copy")
        .header("Authorization", "Bearer " + accessToken)
        .header("Content-Type", "application/json")
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  // --- Member Management ---
  public Map<String, Object> getMembers(String memberId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/members")
            .queryParam("include_fields", "true")
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  public Map<String, Object> createMember(String memberId, Map<String, Object> memberData) {
    log.info("Creating member for user: {}", memberId);
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    try {
      return webClient.post()
          .uri(uriBuilder -> uriBuilder
              .path("/v2.0/api/members")
              .queryParam("mailOption", "false")
              .build())
          .header("Authorization", "Bearer " + accessToken)
          .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
          .bodyValue(memberData)
          .retrieve()
          .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
          })
          .block();
    } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
      log.error("Eformsign API Error (createMember): {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
      throw new RuntimeException("Eformsign API Error: " + e.getResponseBodyAsString(), e);
    } catch (Exception e) {
      log.error("Unexpected Error (createMember)", e);
      throw new RuntimeException("Unexpected Error during member creation: " + e.getMessage(), e);
    }
  }

  public Map<String, Object> updateMember(String memberId, String targetMemberId, Map<String, Object> memberData) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    return webClient.patch()
        .uri("/v2.0/api/members/" + targetMemberId)
        .header("Authorization", "Bearer " + accessToken)
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .bodyValue(memberData)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  public void deleteMember(String memberId, String targetMemberId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    webClient.delete()
        .uri("/v2.0/api/members/" + targetMemberId)
        .header("Authorization", "Bearer " + accessToken)
        .retrieve()
        .toBodilessEntity()
        .block();
  }

  // --- Group Management ---
  public Map<String, Object> getGroups(String memberId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/groups")
            .queryParam("include_member", "true")
            .queryParam("include_field", "true")
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  public Map<String, Object> createGroup(String memberId, Map<String, Object> groupData) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    return webClient.post()
        .uri("/v2.0/api/groups")
        .header("Authorization", "Bearer " + accessToken)
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .bodyValue(groupData)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  public Map<String, Object> updateGroup(String memberId, String groupId, Map<String, Object> groupData) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    return webClient.patch()
        .uri("/v2.0/api/groups/" + groupId)
        .header("Authorization", "Bearer " + accessToken)
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .bodyValue(groupData)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  public void deleteGroup(String memberId, String groupId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    Map<String, Object> body = new HashMap<>();
    body.put("group_ids", java.util.Collections.singletonList(groupId));

    webClient.method(org.springframework.http.HttpMethod.DELETE)
        .uri("/v2.0/api/groups")
        .header("Authorization", "Bearer " + accessToken)
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .retrieve()
        .toBodilessEntity()
        .block();
  }

  public Map<String, Object> getAccessToken(String memberId) {
    long executionTime = System.currentTimeMillis();

    // Match Python script: Base64 encode the API Key
    String base64ApiKey = Base64.getEncoder().encodeToString(apiKey.getBytes(StandardCharsets.UTF_8));

    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("execution_time", String.valueOf(executionTime));
    requestBody.put("member_id", memberId);

    try {
      // Match Python script headers
      Map<String, Object> response = webClient.post()
          .uri("/v2.0/api_auth/access_token")
          .header("eformsign_signature", "Bearer " + secretKey) // Secret key directly
          .header("Authorization", "Bearer " + base64ApiKey) // Base64 encoded API Key
          .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
          .bodyValue(requestBody)
          .retrieve()
          .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
          })
          .block();

      if (response == null || !response.containsKey("oauth_token")) {
        throw new RuntimeException("Failed to retrieve access token");
      }

      Map<String, Object> oauthToken = (Map<String, Object>) response.get("oauth_token");
      // Return the full map, not just the string
      return oauthToken;
    } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
      log.error("API Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
      throw new RuntimeException("API Call Failed: " + e.getResponseBodyAsString(), e);
    }
  }

  public Map<String, Object> createDocumentFromTemplate(String memberId, String templateId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    Map<String, Object> documentData = new HashMap<>();
    documentData.put("document_name", "Test Document Created by API");
    // Add other fields if necessary, e.g. recipients

    Map<String, Object> body = new HashMap<>();
    body.put("document", documentData);

    return webClient.post()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/documents")
            .queryParam("template_id", templateId)
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  public void deleteTemplate(String memberId, String templateId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    webClient.method(org.springframework.http.HttpMethod.DELETE)
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/forms/" + templateId)
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .header("Content-Type", "application/json")
        .retrieve()
        .bodyToMono(Void.class)
        .block();
  }
}
