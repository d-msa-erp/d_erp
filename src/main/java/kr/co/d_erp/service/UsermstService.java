package kr.co.d_erp.service;

import kr.co.d_erp.dtos.Usermst;
import kr.co.d_erp.repository.oracle.UsermstRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// import org.springframework.security.crypto.password.PasswordEncoder; // 비밀번호 암호화 시 사용

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 주입
public class UsermstService{

    private final UsermstRepository userMstRepository;
    // private final PasswordEncoder passwordEncoder; // 비밀번호 암호화 시 주입

    public List<Usermst> findAllUsers(String sortBy, String sortDirection, String keyword) {
        // 정렬 방향 (asc/desc) 문자열을 enum으로 변환
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        // sortBy 문자열로 정렬 객체 생성
        Sort sort = Sort.by(direction, sortBy);

        // keyword를 findAllUsersByKeyword 메서드로 전달
        // keyword가 null이거나 빈 문자열이면 @Query 내에서 모든 결과를 반환하도록 처리됨
        return userMstRepository.findAllUsersByKeyword(keyword, sort);
    }

    /**
     * 사용자 ID로 특정 사용자 조회
     * @param userIdx 사용자 고유 번호
     * @return Optional<UserMst>
     */
    @Transactional(readOnly = true)
    public Optional<Usermst> getUserByIdx(Long userIdx) {
        return userMstRepository.findById(userIdx);
    }


    /**
     * 새로운 사용자 추가
     * @param userMst 추가할 사용자 정보
     * @return 저장된 사용자 정보 (ID 포함)
     */
    @Transactional
    public Usermst addUser(Usermst userMst) {
        // ID, 이메일 등 Unique 필드 중복 검사 (선택 사항, DB 제약조건으로도 처리됨)
        if (userMstRepository.findByUserId(userMst.getUserId()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 ID입니다: " + userMst.getUserId());
        }
        if (userMstRepository.findByUserEmail(userMst.getUserEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + userMst.getUserEmail());
        }

        // 비밀번호 암호화 (실제 운영 시 필수)
        // userMst.setUserPswd(passwordEncoder.encode(userMst.getUserPswd()));

        // USER_ROLE, USER_STATUS 기본값 설정 (엔티티의 @PrePersist 또는 여기서 처리)
        if (userMst.getUserRole() == null || userMst.getUserRole().isEmpty()) {
            userMst.setUserRole("01"); // 기본값
        }
        if (userMst.getUserStatus() == null || userMst.getUserStatus().isEmpty()) {
            userMst.setUserStatus("01"); // 기본값
        }

        return userMstRepository.save(userMst);
    }

    /**
     * 사용자 정보 수정
     * @param userIdx 수정할 사용자의 고유 번호
     * @param userDetails 수정할 사용자 정보
     * @return 수정된 사용자 정보
     */
    @Transactional
    public Usermst updateUser(Long userIdx, Usermst userDetails) {
        Usermst existingUser = userMstRepository.findById(userIdx)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. ID: " + userIdx));

        // USER_ID는 일반적으로 변경하지 않음. 필요하다면 로직 추가.
        // existingUser.setUserId(userDetails.getUserId());

        // 비밀번호 변경 로직은 별도로 처리하거나, 값이 있을 때만 변경
        if (userDetails.getUserPswd() != null && !userDetails.getUserPswd().isEmpty()) {
            // existingUser.setUserPswd(passwordEncoder.encode(userDetails.getUserPswd()));
            existingUser.setUserPswd(userDetails.getUserPswd()); // 암호화 없이 저장 (데모용)
        }

        existingUser.setUserNm(userDetails.getUserNm());

        // 이메일 변경 시 중복 검사
        if (!existingUser.getUserEmail().equals(userDetails.getUserEmail())) {
            if (userMstRepository.findByUserEmail(userDetails.getUserEmail()).isPresent()) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + userDetails.getUserEmail());
            }
            existingUser.setUserEmail(userDetails.getUserEmail());
        }

        existingUser.setUserTel(userDetails.getUserTel());
        existingUser.setUserHp(userDetails.getUserHp());
        existingUser.setUserDept(userDetails.getUserDept());
        existingUser.setUserPosition(userDetails.getUserPosition());
        // HIRE_DT는 일반적으로 수정하지 않음. 필요하다면 로직 추가.
        // existingUser.setHireDt(userDetails.getHireDt());
        existingUser.setRetireDt(userDetails.getRetireDt());
        existingUser.setUserRole(userDetails.getUserRole());
        existingUser.setUserStatus(userDetails.getUserStatus());

        return userMstRepository.save(existingUser);
    }

    /**
     * 여러 사용자 ID를 받아 해당 사용자들을 삭제합니다.
     * 이 작업은 하나의 트랜잭션으로 묶여 원자성을 보장합니다.
     *
     * @param userIdxs 삭제할 사용자 ID 목록
     * @throws IllegalArgumentException userIdxs 목록이 null이거나 비어있을 경우
     */
    @Transactional // 여러 삭제 작업이 하나의 트랜잭션으로 묶이도록 보장
    public void deleteUsers(List<Long> userIdxs) {
        if (userIdxs == null || userIdxs.isEmpty()) {
            throw new IllegalArgumentException("삭제할 사용자 ID 목록이 비어 있습니다.");
        }

        // Spring Data JPA의 deleteAllById 메서드를 사용하여 효율적으로 여러 항목 삭제
        userMstRepository.deleteAllById(userIdxs);
    }
}