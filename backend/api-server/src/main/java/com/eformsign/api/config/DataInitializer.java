package com.eformsign.api.config;

import com.eformsign.api.service.EformsignService;
import com.eformsign.api.service.MemberService;
import com.eformsign.common.type.MemberRole;
import com.eformsign.common.entity.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

  private final MemberService memberService;
  private final EformsignService eformsignService;

  @Value("${app.admin.id}")
  private String adminId;

  @Value("${app.admin.password}")
  private String adminPassword;

  @Override
  public void run(String... args) throws Exception {
    createAdminAccount();

    // Debug: Test Access Token
    try {
      log.info("Testing Access Token Generation...");
      Map<String, Object> token = eformsignService.getAccessToken(adminId);
      log.info("Access Token Success: {}", token != null);
    } catch (Exception e) {
      log.error("Access Token Failed in DataInitializer", e);
    }

    syncMembersfromEformsign();
  }

  private void createAdminAccount() {
    try {
      if (memberService.getMemberByLoginId(adminId) == null) {
        memberService.createMember(adminId, adminPassword, "Administrator");
        // Force role update if needed (createMember defaults to MEMBER)
        // But MemberService.createMember doesn't return entity with setter?
        // Actually it saves. We can update role via repository if we had access,
        // but MemberService hardcodes MEMBER role in createMember.
        // Ideally we should allow setting role or update it.
        // For now, let's just ensure it exists.
        log.info("Created local admin account: {}", adminId);
      }
    } catch (IllegalArgumentException e) {
      // Exists
    } catch (Exception e) {
      // e.g. "Member not found" thrown by getMemberByLoginId is caught?
      // getMemberByLoginId throws if not found.
      // So we should catch that and create.
      try {
        memberService.createMember(adminId, adminPassword, "Administrator");
        log.info("Created local admin account: {}", adminId);
      } catch (Exception ex) {
        log.error("Failed to create admin account", ex);
      }
    }
  }

  private void syncMembersfromEformsign() {
    log.info("Initializing members from Eformsign API...");
    try {
      // Fetch members from Eformsign (limit 1000 to get all)
      Map<String, Object> response = eformsignService.getMembers(adminId, 1, 1000);

      if (response != null && response.containsKey("members")) {
        List<Map<String, Object>> members = (List<Map<String, Object>>) response.get("members");

        for (Map<String, Object> memberData : members) {
          String memberId = (String) memberData.get("id"); // ID or email
          String name = (String) memberData.get("name");

          if (memberId != null) {
            try {
              // Use email/id as loginId, default password "password"
              // Name fallback to memberId if null
              memberService.createMember(memberId, "password", name != null ? name : memberId);
              log.info("Synced member: {}", memberId);
            } catch (IllegalArgumentException e) {
              // Already exists, ignore
            } catch (Exception e) {
              log.error("Failed to sync member: " + memberId, e);
            }
          }
        }
        log.info("Member synchronization completed. Total processed: {}", members.size());
      } else {
        log.warn("No 'members' key in Eformsign API response or response is null");
      }

    } catch (Exception e) {
      log.error(
          "Failed to initialize members from Eformsign. (This might be due to permissions or API issues. Local admin should still work.)",
          e);
    }
  }
}
