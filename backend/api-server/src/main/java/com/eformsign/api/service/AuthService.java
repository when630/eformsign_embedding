package com.eformsign.api.service;

import com.eformsign.api.repository.MemberRepository;
import com.eformsign.common.entity.Member;
import com.eformsign.common.type.MemberRole;
import com.eformsign.common.util.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final MemberRepository memberRepository;
  private final JwtProvider jwtProvider;

  @Value("${app.admin.id}")
  private String adminId;

  @Value("${app.admin.password}")
  private String adminPassword;

  @Transactional(readOnly = true)
  public String login(String loginId, String password) {
    // 1. Check Config-based Admin
    if (adminId.equals(loginId) && adminPassword.equals(password)) {
      return jwtProvider.createToken(loginId, MemberRole.MANAGER);
    }

    // 2. Check DB-based Member
    Member member = memberRepository.findByLoginId(loginId)
        .orElseThrow(() -> new IllegalArgumentException("Invalid ID or Password"));

    if (!member.getPassword().equals(password)) {
      throw new IllegalArgumentException("Invalid ID or Password");
    }

    return jwtProvider.createToken(member.getLoginId(), MemberRole.MEMBER);
  }
}
