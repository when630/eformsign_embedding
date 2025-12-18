package com.eformsign.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableJpaAuditing
@EntityScan(basePackages = "com.eformsign.common.entity")
@ComponentScan(basePackages = { "com.eformsign.api", "com.eformsign.common" })
public class ApiServerApplication {

  public static void main(String[] args) {
    SpringApplication.run(ApiServerApplication.class, args);
  }

}
