package com.eformsign.api.controller;

import com.eformsign.api.config.auth.LoginUser;
import com.eformsign.api.service.EformsignService;
import com.eformsign.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/eformsign")
@RequiredArgsConstructor
public class EformsignController {

  private final EformsignService eformsignService;

  @GetMapping("/token")
  public ApiResponse<Map<String, Object>> getToken(@LoginUser String userId) {
    // userId is the loginId (e.g. email or username)
    // eformsign api requires member_id. We assume userId maps to member_id.
    Map<String, Object> tokenInfo = eformsignService.generateToken(userId);
    return ApiResponse.success(tokenInfo);
  }

  @GetMapping("/templates")
  public ApiResponse<Map<String, Object>> getTemplates(@LoginUser String userId) {
    // userId maps to member_id
    return ApiResponse.success(eformsignService.getTemplates(userId));
  }

  @GetMapping("/documents")
  public ApiResponse<Map<String, Object>> getDocuments(
      @LoginUser String userId,
      @org.springframework.web.bind.annotation.RequestParam(required = false) String type) {
    return ApiResponse.success(eformsignService.getDocuments(userId, type));
  }

  @org.springframework.web.bind.annotation.PostMapping("/documents")
  public ApiResponse<Map<String, Object>> createDocument(@LoginUser String userId,
      @org.springframework.web.bind.annotation.RequestBody Map<String, String> body) {
    String templateId = body.get("templateId");
    return ApiResponse.success(eformsignService.createDocumentFromTemplate(userId, templateId));
  }

  // --- Template Management ---
  @org.springframework.web.bind.annotation.PostMapping("/templates/{templateId}/duplicate")
  public ApiResponse<Map<String, Object>> duplicateTemplate(@LoginUser String userId,
      @org.springframework.web.bind.annotation.PathVariable String templateId) {
    return ApiResponse.success(eformsignService.duplicateTemplate(userId, templateId));
  }

  @org.springframework.web.bind.annotation.DeleteMapping("/templates/{templateId}")
  public ApiResponse<Void> deleteTemplate(@LoginUser String userId,
      @org.springframework.web.bind.annotation.PathVariable String templateId) {
    eformsignService.deleteTemplate(userId, templateId);
    return ApiResponse.success(null);
  }

  // --- Member Management ---
  @GetMapping("/company/members")
  public ApiResponse<Map<String, Object>> getMembers(@LoginUser String userId) {
    return ApiResponse.success(eformsignService.getMembers(userId));
  }

  @org.springframework.web.bind.annotation.PostMapping("/company/members")
  public ApiResponse<Map<String, Object>> createMember(@LoginUser String userId,
      @org.springframework.web.bind.annotation.RequestBody Map<String, Object> body) {
    return ApiResponse.success(eformsignService.createMember(userId, body));
  }

  @org.springframework.web.bind.annotation.PatchMapping("/company/members/{targetMemberId}")
  public ApiResponse<Map<String, Object>> updateMember(@LoginUser String userId,
      @org.springframework.web.bind.annotation.PathVariable String targetMemberId,
      @org.springframework.web.bind.annotation.RequestBody Map<String, Object> body) {
    return ApiResponse.success(eformsignService.updateMember(userId, targetMemberId, body));
  }

  @org.springframework.web.bind.annotation.DeleteMapping("/company/members/{targetMemberId}")
  public ApiResponse<Void> deleteMember(@LoginUser String userId,
      @org.springframework.web.bind.annotation.PathVariable String targetMemberId) {
    eformsignService.deleteMember(userId, targetMemberId);
    return ApiResponse.success(null);
  }

  // --- Group Management ---
  @GetMapping("/company/groups")
  public ApiResponse<Map<String, Object>> getGroups(@LoginUser String userId) {
    return ApiResponse.success(eformsignService.getGroups(userId));
  }

  @org.springframework.web.bind.annotation.PostMapping("/company/groups")
  public ApiResponse<Map<String, Object>> createGroup(@LoginUser String userId,
      @org.springframework.web.bind.annotation.RequestBody Map<String, Object> body) {
    return ApiResponse.success(eformsignService.createGroup(userId, body));
  }

  @org.springframework.web.bind.annotation.PatchMapping("/company/groups/{groupId}")
  public ApiResponse<Map<String, Object>> updateGroup(@LoginUser String userId,
      @org.springframework.web.bind.annotation.PathVariable String groupId,
      @org.springframework.web.bind.annotation.RequestBody Map<String, Object> body) {
    return ApiResponse.success(eformsignService.updateGroup(userId, groupId, body));
  }

  @org.springframework.web.bind.annotation.DeleteMapping("/company/groups/{groupId}")
  public ApiResponse<Void> deleteGroup(@LoginUser String userId,
      @org.springframework.web.bind.annotation.PathVariable String groupId) {
    eformsignService.deleteGroup(userId, groupId);
    return ApiResponse.success(null);
  }
}
