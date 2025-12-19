package com.eformsign.common.entity;

import com.eformsign.common.type.MemberRole;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "members")
public class Member {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String loginId;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MemberRole role;

  @CreatedDate
  @Column(updatable = false)
  private LocalDateTime createdAt;

  @Builder
  public Member(String loginId, String password, String name, MemberRole role) {
    this.loginId = loginId;
    this.password = password;
    this.name = name;
    this.role = role;
  }
}
