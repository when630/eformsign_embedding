package com.eformsign.api.controller;

import com.eformsign.api.config.auth.ManagerOnly;
import com.eformsign.api.service.MemberService;
import com.eformsign.common.dto.ApiResponse;
import com.eformsign.common.entity.Member;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

  private final MemberService memberService;

  @ManagerOnly
  @PostMapping
  public ApiResponse<Long> createMember(@RequestBody CreateMemberRequest request) {
    Member member = memberService.createMember(request.getLoginId(), request.getPassword(), request.getName());
    return ApiResponse.success(member.getId());
  }

  @ManagerOnly
  @GetMapping
  public ApiResponse<List<MemberDto>> getMembers() {
    List<Member> members = memberService.getAllMembers();
    List<MemberDto> dtos = members.stream()
        .map(m -> new MemberDto(m.getId(), m.getLoginId(), m.getName(), m.getRole().name()))
        .toList();
    return ApiResponse.success(dtos);
  }

  @GetMapping("/me")
  public ApiResponse<MemberDto> getMe(@com.eformsign.api.config.auth.LoginUser String loginId) {
    Member member = memberService.getMemberByLoginId(loginId);
    return ApiResponse
        .success(new MemberDto(member.getId(), member.getLoginId(), member.getName(), member.getRole().name()));
  }

  @Data
  public static class CreateMemberRequest {
    private String loginId;
    private String password;
    private String name;
  }

  @Data
  public static class MemberDto {
    private Long id;
    private String loginId;
    private String name;
    private String role;

    public MemberDto(Long id, String loginId, String name, String role) {
      this.id = id;
      this.loginId = loginId;
      this.name = name;
      this.role = role;
    }
  }
}
