package kr.co.d_erp.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.Login;
import kr.co.d_erp.repository.oracle.LoginRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoginService {
	private final LoginRepository loginRepository;
	
	 public Optional<Login> authenticate(String userId, String userPswd) {
	        Optional<Login> userOptional = loginRepository.findByUserId(userId);

	        if (userOptional.isPresent()) {
	            Login user = userOptional.get();
	            // 현재는 평문 비밀번호를 직접 비교합니다.
	            if (userPswd.equals(user.getUserPswd())) { // 평문 비밀번호 비교
	                return Optional.of(user); // 인증 성공 시 엔티티 그대로 반환
	            }
	        }
	        return Optional.empty(); // 인증 실패
	    }
}
