package kr.co.d_erp.service;

import java.time.LocalDateTime; // LocalDateTime 임포트 (여전히 필요)
import java.time.format.DateTimeFormatter; // 필요시 사용 (현재 DTO가 LocalDateTime이므로, 이 서비스에서는 필요 없음)
import java.util.Optional;

import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.Login; // Login 엔티티
import kr.co.d_erp.dtos.MyPageDto; // MyPage DTO
import kr.co.d_erp.repository.oracle.LoginRepository; // Login 엔티티를 다루는 JpaRepository
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 로그를 위해 추가

@Service
@RequiredArgsConstructor
@Slf4j
public class MyPageServiceImpl implements MyPageService {

    private final LoginRepository loginRepository;
    
    // DTO의 userHireDt, userRetireDt가 LocalDateTime이므로,
    // 서비스 단에서 String으로 포매팅할 필요가 없어졌습니다.
    // 하지만 HTML에서 특정 String 포맷으로 보여주기 위해서는
    // HTML에서 #temporals 유틸리티를 사용해야 합니다.
    // private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"); // 이제 이 변수는 이 메서드에서 직접적으로 사용되지 않습니다.

    @Override
    public Optional<MyPageDto> getUserInfoByUserId(String userId) {
        log.info("Attempting to retrieve user info for userId: {}", userId);
        return loginRepository.findByUserId(userId)
                .map(login -> {
                    MyPageDto dto = new MyPageDto();
                    dto.setUserIdx(login.getUserIdx());
                    dto.setUserId(login.getUserId());
                    dto.setUserNm(login.getUserNm());
                    dto.setUserEMail(login.getUserEmail()); 
                    dto.setUserTel(login.getUserTel());
                    dto.setUserHp(login.getUserHp());
                    dto.setUserDept(login.getUserDept());
                    dto.setUserPosition(login.getUserPosition());
                    
                    // LocalDateTime 객체를 MyPageDto의 LocalDateTime 필드에 직접 할당
                    dto.setUserHireDt(login.getUserHireDt());
                    dto.setUserRetireDt(login.getUserRetireDt());
                    
                    dto.setUserRole(login.getUserRole());
                    dto.setUserStatus(login.getUserStatus());
                    log.info("Successfully mapped user info to MyPageDto for userId: {}", userId);
                    return dto;
                });
    }

    @Override
    public MyPageDto updateUserInfo(MyPageDto myPageDto) {
        log.info("Attempting to update user info for userId: {}", myPageDto.getUserId());
        Login existingUser = loginRepository.findByUserId(myPageDto.getUserId())
                                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + myPageDto.getUserId()));

        existingUser.setUserNm(myPageDto.getUserNm());
        existingUser.setUserEmail(myPageDto.getUserEMail()); 
        existingUser.setUserTel(myPageDto.getUserTel());
        existingUser.setUserHp(myPageDto.getUserHp());
        
        // DTO의 LocalDateTime 필드는 "수정불가"이므로 여기서는 업데이트하지 않습니다.
        // 만약 DTO를 통해 날짜를 업데이트해야 한다면,
        // myPageDto.getUserHireDt()를 그대로 existingUser.setUserHireDt()에 할당하면 됩니다.
        // existingUser.setUserHireDt(myPageDto.getUserHireDt());
        // existingUser.setUserRetireDt(myPageDto.getUserRetireDt());

        Login updatedLogin = loginRepository.save(existingUser);
        log.info("User info updated successfully for userId: {}", updatedLogin.getUserId());

        // 업데이트된 정보를 담은 DTO를 반환 (최신 상태를 반영)
        MyPageDto updatedDto = new MyPageDto();
        updatedDto.setUserIdx(updatedLogin.getUserIdx());
        updatedDto.setUserId(updatedLogin.getUserId());
        updatedDto.setUserNm(updatedLogin.getUserNm());
        updatedDto.setUserEMail(updatedLogin.getUserEmail());
        updatedDto.setUserTel(updatedLogin.getUserTel());
        updatedDto.setUserHp(updatedLogin.getUserHp());
        updatedDto.setUserDept(updatedLogin.getUserDept());
        updatedDto.setUserPosition(updatedLogin.getUserPosition());
        
        // 업데이트된 Login 엔티티의 LocalDateTime 필드를 DTO에 직접 할당
        updatedDto.setUserHireDt(updatedLogin.getUserHireDt());
        updatedDto.setUserRetireDt(updatedLogin.getUserRetireDt());
        
        updatedDto.setUserRole(updatedLogin.getUserRole());
        updatedDto.setUserStatus(updatedLogin.getUserStatus());
        return updatedDto;
    }
    
    @Override
    public void updatePW(String userId, String newPW) {
        log.info("Attempting to update password for userId: {}", userId);
        Optional<Login> userOptional = loginRepository.findByUserId(userId);
        if (userOptional.isPresent()) {
            Login user = userOptional.get();
            // TODO: 비밀번호는 반드시 암호화해야 합니다!
            // 예: user.setUserPswd(passwordEncoder.encode(newPW));
            user.setUserPswd(newPW); // 현재는 평문으로 저장 (개발 단계에서만 사용)
            loginRepository.save(user);
            log.info("Password updated successfully for userId: {}", userId);
        } else {
            log.warn("User not found for password update: {}", userId);
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId);
        }
    }
}