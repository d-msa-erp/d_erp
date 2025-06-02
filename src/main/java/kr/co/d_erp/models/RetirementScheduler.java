package kr.co.d_erp.models;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.repository.oracle.UsermstRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 퇴사일 자동 처리 스케줄러
 * 매일 오전 9시에 퇴사일이 된 사원들을 자동으로 퇴사 처리합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RetirementScheduler {

    private final UsermstRepository userMstRepository;

    /**
     * 매일 오전 2시에 퇴사일이 된 사원들을 퇴사 처리
     * cron 표현식: "0 0 2 * * *" = 초(0) 분(0) 시(2) 일(*) 월(*) 요일(*)
     */
    @Scheduled(cron = "0 0 2 * * *") // 새벽 2시
    @Transactional
    public void processRetirements() {
        LocalDate today = LocalDate.now();
        log.info("퇴사일 자동 처리 시작 - 날짜: {}", today);

        try {
            // 퇴사일이 오늘이거나 과거이면서 재직상태가 퇴사가 아닌 사원들 조회
            List<Usermst> usersToRetire = userMstRepository.findUsersToRetire(today);
            
            if (usersToRetire.isEmpty()) {
                log.info("퇴사 처리할 사원이 없습니다.");
                return;
            }

            int processedCount = 0;
            for (Usermst user : usersToRetire) {
                String originalStatus = user.getUserStatus();
                user.setUserStatus("02"); // 퇴사로 변경
                userMstRepository.save(user);
                
                log.info("사원 퇴사 처리 완료 - ID: {}, 이름: {}, 퇴사일: {}, 이전 상태: {} -> 퇴사", 
                    user.getUserId(), user.getUserNm(), user.getRetireDt(), originalStatus);
                processedCount++;
            }

            log.info("퇴사일 자동 처리 완료 - 처리된 사원 수: {}", processedCount);

        } catch (Exception e) {
            log.error("퇴사일 자동 처리 중 오류 발생", e);
        }
    }

    /**
     * 수동 실행용 메서드 (관리자가 필요시 호출)
     */
    public void manualProcessRetirements() {
        log.info("퇴사일 수동 처리 실행");
        processRetirements();
    }
}