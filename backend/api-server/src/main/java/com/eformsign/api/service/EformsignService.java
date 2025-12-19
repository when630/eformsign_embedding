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

    Map<String, Object> response = webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/forms")
            .queryParam("member_id", memberId)
            .queryParam("limit", "1000") // Fetch up to 1000
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .header("Content-Type", "application/json")
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();

    return response;
  }

  public Map<String, Object> getDocuments(String memberId, String type, String documentName, String templateId,
      Integer page, Integer limit) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    Map<String, Object> body = new HashMap<>();
    String typeCode = (type != null && !type.isEmpty()) ? type : "01"; // Default to 01 (Todo) or 04 (All)

    int pageNum = (page != null && page > 0) ? page : 1;
    int limitNum = (limit != null && limit > 0) ? limit : 20;
    int skip = (pageNum - 1) * limitNum;

    body.put("type", typeCode);
    body.put("limit", String.valueOf(limitNum));
    body.put("skip", String.valueOf(skip));

    List<String> templateIds = new ArrayList<>();

    if (templateId != null && !templateId.isEmpty()) {
      templateIds.add(templateId);
    } else if (documentName != null && !documentName.isEmpty()) {
      // Try lookup by name
      try {
        // We need to fetch all templates to find the ID, so pass null/null for simple
        // fetch if this method was recursive,
        // but here getTemplates is now paginated.
        // For lookup, we probably want *all* templates.
        // Let's call the raw API or passed large limit.
        // For safety, let's just make a private internal method for fetching all or use
        // a large limit here.
        Map<String, Object> templatesResponse = getTemplates(memberId);
        List<Map<String, Object>> forms = (List<Map<String, Object>>) templatesResponse.get("forms"); // The
                                                                                                      // paginateListResult
                                                                                                      // puts generic
                                                                                                      // list in
                                                                                                      // "forms"? No,
                                                                                                      // paginateListResult
                                                                                                      // returns
                                                                                                      // consistent
                                                                                                      // structure.
        // Wait, paginateListResult will return { "forms": [...], "total_count": ... }
        // so this is fine.

        if (forms != null) {
          for (Map<String, Object> form : forms) {
            String formName = (String) form.get("form_name");
            if (documentName.equals(formName)) {
              templateIds.add((String) form.get("form_id"));
            }
          }
        }
      } catch (Exception e) {
        log.warn("Failed to lookup template ID for name: " + documentName, e);
      }
    }

    body.put("template_ids", templateIds.toArray(new String[0]));

    if (documentName != null && !documentName.isEmpty() && templateIds.isEmpty()) {
      body.put("title", documentName);
    } else {
      body.put("title", "");
    }

    body.put("content", "");
    body.put("title_and_content", "");
    body.put("return_fields", java.util.Arrays.asList("신청자명", "신청일", "일간"));

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

  public Map<String, Object> getDocument(String memberId, String documentId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");

    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/documents/" + documentId)
            .queryParam("include_fields", "true")
            .queryParam("include_histories", "true")
            .queryParam("include_previous_status", "true")
            .queryParam("include_next_status", "true")
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .header("Content-Type", "application/json")
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();
  }

  // --- Template Management ---
  public Map<String, Object> duplicateTemplate(String memberId, String templateId) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
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
  public Map<String, Object> getMembers(String memberId, Integer page, Integer limit) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    Map<String, Object> response = webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/members")
            .queryParam("include_fields", "true")
            .queryParam("limit", "1000") // Fetch up to 1000
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();

    return paginateListResult(response, "members", page, limit);
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
  public Map<String, Object> getGroups(String memberId, Integer page, Integer limit) {
    String accessToken = (String) getAccessToken(memberId).get("access_token");
    Map<String, Object> response = webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/v2.0/api/groups")
            .queryParam("include_member", "true")
            .queryParam("include_field", "true")
            .queryParam("limit", "1000") // Fetch up to 1000
            .build())
        .header("Authorization", "Bearer " + accessToken)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
        })
        .block();

    return paginateListResult(response, "groups", page, limit);
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

  // --- Helper Methods ---
  private Map<String, Object> paginateListResult(Map<String, Object> response, String listKey, Integer page,
      Integer limit) {
    Map<String, Object> result = new HashMap<>();
    List<?> fullList = new ArrayList<>();

    // Extract list
    if (response != null) {
      if (response.containsKey(listKey)) {
        Object obj = response.get(listKey);
        if (obj instanceof List) {
          fullList = (List<?>) obj;
        }
      } else if (response.containsKey("data")) {
        // Some APIs wrap it in data? No, usually root or data property.
        // Let's assume response IS the data map from Eformsign usually.
        // Actually most eformsign APIs return { "api_status":..., "list_key": [...] }
        // OR they return wrapping "data" struct like the token one?
        // From getTemplates usage: response.data.data?.forms.
        // The API calls here return the raw Map from WebClient.
      }
    }

    // If the response itself is the list (unlikely) or contained in key
    // Check if fullList is empty and response has it differently
    // The existing getTemplates code did: response.data.data?.forms... on frontend.
    // Backend returns what WebClient returns.
    // Let's rely on standard keys: "forms", "members", "groups".

    int total = fullList.size();
    int pageNum = (page != null && page > 0) ? page : 1;
    int limitNum = (limit != null && limit > 0) ? limit : 20;
    int fromIndex = (pageNum - 1) * limitNum;

    List<?> pagedList = new ArrayList<>();
    if (fromIndex < total) {
      pagedList = fullList.subList(fromIndex, Math.min(fromIndex + limitNum, total));
    }

    result.put(listKey, pagedList);
    result.put("total_count", total);
    // Preserve other top-level keys if needed?
    // Ideally yes, but for now just list and total logic is key.
    return result;
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
