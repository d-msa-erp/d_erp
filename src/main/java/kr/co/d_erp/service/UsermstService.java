package kr.co.d_erp.service;

import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.UserSelectDto;
import kr.co.d_erp.models.PasswordHandler;
import kr.co.d_erp.repository.oracle.UsermstRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 주입
public class UsermstService {

    private final UsermstRepository userMstRepository;
    private final PasswordHandler passwordHandler; // 비밀번호 암호화 핸들러

    public List<Usermst> findAllUsers(String sortBy, String sortDirection, String keyword) {
        // 정렬 방향 (asc/desc) 문자열을 enum으로 변환
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        // sortBy 문자열로 정렬 객체 생성
        Sort sort = Sort.by(direction, sortBy);

        // keyword를 findAllUsersByKeyword 메서드로 전달
        // keyword가 null이거나 빈 문자열이면 @Query 내에서 모든 결과를 반환하도록 처리됨
        List<Usermst> users = userMstRepository.findAllUsersByKeyword(keyword, sort);
        
        // 각 사용자 엔티티에 PasswordHandler 주입
        users.forEach(user -> user.setPasswordHandler(passwordHandler));
        
        return users;
    }

    /**
     * 페이징을 지원하는 사용자 목록 조회
     * 
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @param sortBy 정렬 기준 필드
     * @param sortDirection 정렬 방향 (asc/desc)
     * @param keyword 검색 키워드
     * @return PageDto<Usermst>
     */
    public PageDto<Usermst> findAllUsersWithPaging(int page, int size, String sortBy, String sortDirection, String keyword) {
        // 정렬 방향 변환
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Sort sort = Sort.by(direction, sortBy);
        
        // Pageable 객체 생성
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // 페이징 조회
        Page<Usermst> pageResult = userMstRepository.findAllUsersByKeywordWithPaging(keyword, pageable);
        
        // 각 사용자 엔티티에 PasswordHandler 주입
        List<Usermst> users = pageResult.getContent();
        users.forEach(user -> user.setPasswordHandler(passwordHandler));
        
        // PageDto로 변환하여 반환
        return new PageDto<>(pageResult, users);
    }

    /**
     * 사용자 ID로 특정 사용자 조회
     * 
     * @param userIdx 사용자 고유 번호
     * @return Optional<Usermst>
     */
    @Transactional(readOnly = true)
    public Optional<Usermst> getUserByIdx(Long userIdx) {
        Optional<Usermst> userOpt = userMstRepository.findById(userIdx);
        
        // PasswordHandler 주입
        userOpt.ifPresent(user -> user.setPasswordHandler(passwordHandler));
        
        return userOpt;
    }

    /**
     * 사용자 ID로 특정 사용자 조회 (로그인용)
     * 
     * @param userId 사용자 ID
     * @return Optional<Usermst>
     */
    @Transactional(readOnly = true)
    public Optional<Usermst> getUserByUserId(String userId) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        // PasswordHandler 주입
        userOpt.ifPresent(user -> user.setPasswordHandler(passwordHandler));
        
        return userOpt;
    }

    /**
     * 로그인 인증
     * 
     * @param userId 사용자 ID
     * @param rawPassword 평문 비밀번호
     * @return 인증 성공 여부
     */
    @Transactional(readOnly = true)
    public boolean authenticateUser(String userId, String rawPassword) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        if (userOpt.isEmpty()) {
            return false;
        }
        
        Usermst user = userOpt.get();
        
        // 사용자 상태 확인 (활성 상태만 로그인 허용)
        if (!"01".equals(user.getUserStatus())) {
            return false;
        }
        
        // PasswordHandler 주입 후 비밀번호 검증
        user.setPasswordHandler(passwordHandler);
        return user.checkPassword(rawPassword);
    }

    /**
     * 새로운 사용자 추가
     * 
     * @param userMst 추가할 사용자 정보
     * @return 저장된 사용자 정보 (ID 포함)
     */
    @Transactional
    public Usermst addUser(Usermst userMst) {
        // ID, 이메일 등 Unique 필드 중복 검사
        if (userMstRepository.findByUserId(userMst.getUserId()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 ID입니다: " + userMst.getUserId());
        }
        if (userMstRepository.findByUserEmail(userMst.getUserEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + userMst.getUserEmail());
        }

        // PasswordHandler 주입
        userMst.setPasswordHandler(passwordHandler);
        
        // 비밀번호 암호화 처리
        if (userMst.getUserPswd() != null && !userMst.getUserPswd().isEmpty()) {
            // 현재 비밀번호가 이미 암호화되어 있는지 확인
            if (!userMst.isPasswordEncoded()) {
                userMst.setRawPassword(userMst.getUserPswd()); // 평문 비밀번호를 암호화해서 저장
            }
        } else {
            throw new IllegalArgumentException("비밀번호는 필수입니다");
        }

        // USER_ROLE, USER_STATUS 기본값 설정 (엔티티의 @PrePersist에서도 처리됨)
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
     * 
     * @param 수정할 사용자의 고유 번호
     * @param userDetails 수정할 사용자 정보
     * @return 수정된 사용자 정보
     */
    @Transactional
    public Usermst updateUser(Long userIdx, Usermst userDetails) {
        Usermst existingUser = userMstRepository.findById(userIdx)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. ID: " + userIdx));

        // PasswordHandler 주입
        existingUser.setPasswordHandler(passwordHandler);

        // 비밀번호 변경 로직 - 값이 있을 때만 변경
        if (userDetails.getUserPswd() != null && !userDetails.getUserPswd().isEmpty()) {
            // 새로운 비밀번호가 이미 암호화되어 있는지 확인
            if (passwordHandler.isEncoded(userDetails.getUserPswd())) {
                // 이미 암호화된 비밀번호라면 그대로 설정
                existingUser.setUserPswd(userDetails.getUserPswd());
            } else {
                // 평문 비밀번호라면 암호화해서 설정
                existingUser.setRawPassword(userDetails.getUserPswd());
            }
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
        existingUser.setRetireDt(userDetails.getRetireDt());
        existingUser.setUserRole(userDetails.getUserRole());
        existingUser.setUserStatus(userDetails.getUserStatus());

        return userMstRepository.save(existingUser);
    }

    /**
     * 비밀번호 변경 (사용자가 직접 변경)
     * 
     * @param userId      사용자 ID
     * @param oldPassword 기존 비밀번호
     * @param newPassword 새 비밀번호
     */
    @Transactional
    public void changeUserPassword(String userId, String oldPassword, String newPassword) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId);
        }
        
        Usermst user = userOpt.get();
        
        // PasswordHandler 주입 후 비밀번호 변경
        user.setPasswordHandler(passwordHandler);
        user.changePassword(oldPassword, newPassword);
        
        userMstRepository.save(user);
    }

    /**
     * 관리자용 비밀번호 리셋
     * 
     * @param userId 사용자 ID
     * @return 임시 비밀번호 (평문)
     */
    @Transactional
    public String resetUserPassword(String userId) {
        Optional<Usermst> userOpt = userMstRepository.findByUserId(userId);
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId);
        }
        
        Usermst user = userOpt.get();
        
        // 임시 비밀번호 생성
        String tempPassword = passwordHandler.generateTemporaryPassword(8);
        
        // PasswordHandler 주입 후 비밀번호 리셋
        user.setPasswordHandler(passwordHandler);
        user.resetPassword(tempPassword);
        
        userMstRepository.save(user);
        
        return tempPassword; // 임시 비밀번호 반환 (메일/SMS 발송 등에 사용)
    }

    /**
     * 여러 사용자 ID를 받아 해당 사용자들을 삭제합니다. 이 작업은 하나의 트랜잭션으로 묶여 원자성을 보장합니다.
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

    // 창고 담당자 셀렉트에 사용
    // USER_STATUS가 '01'인 사용자들의 USER_IDX, USER_ID, USER_NM만 가져오는 메소드
    public List<UserSelectDto> getActiveUsersForSelection() {
        return userMstRepository.findByUserStatus("01").stream() // '01' 상태인 사용자만 필터링
                .map(user -> new UserSelectDto(user.getUserIdx(), user.getUserId(), user.getUserNm())) // DTO로 변환
                .collect(Collectors.toList());
    }

    /**
     * 비밀번호 암호화만 수행 (유틸리티 메서드)
     */
    public String encodePassword(String rawPassword) {
        return passwordHandler.encode(rawPassword);
    }

    /**
     * 비밀번호 검증만 수행 (유틸리티 메서드)
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordHandler.matches(rawPassword, encodedPassword);
    }
}