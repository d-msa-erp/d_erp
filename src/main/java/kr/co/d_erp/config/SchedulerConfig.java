package kr.co.d_erp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 스케줄링 기능을 활성화하는 설정 클래스
 * 사원 매일 퇴사처리 스케줄링 사용했음 -나영
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {
    // @EnableScheduling 어노테이션으로 스케줄링 기능 활성화
    // 별도 설정이 필요하지 않으면 빈 클래스로 둘 수 있음
}