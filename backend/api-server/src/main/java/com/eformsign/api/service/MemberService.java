package com.eformsign.api.service;

import com.eformsign.api.repository.MemberRepository;
import com.eformsign.common.entity.Member;
import com.eformsign.common.type.MemberRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

  private final MemberRepository memberRepository;

  @org.springframework.beans.factory.annotation.Value("${app.admin.id}")
  private String adminId;

  // Ideally we would inject password too to verify if needed, but
  // getMemberByLoginId assumes auth is done

  @Transactional
  public Member createMember(String loginId, String password, String name) {
    if (memberRepository.findByLoginId(loginId).isPresent()) {
      throw new IllegalArgumentException("Login ID already exists");
    }

    Member member = Member.builder()
        .loginId(loginId)
        .password(password) // In real app, use PasswordEncoder
        .name(name)
        .role(MemberRole.MEMBER)
        .build();

    return memberRepository.save(member);
  }

  @Transactional(readOnly = true)
  public List<Member> getAllMembers() {
    return memberRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Member getMemberByLoginId(String loginId) {
    if (adminId.equals(loginId)) {
      return Member.builder()
          .loginId(adminId)
          .name("Administrator")
          .role(MemberRole.MANAGER)
          .password("") // Password not needed for display
          .build();
    }
    return memberRepository.findByLoginId(loginId)
        .orElseThrow(() -> new IllegalArgumentException("Member not found"));
  }
}
