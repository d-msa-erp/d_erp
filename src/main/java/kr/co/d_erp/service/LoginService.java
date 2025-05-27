package kr.co.d_erp.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.Login;
import kr.co.d_erp.models.PasswordHandler; // ✅ PasswordHandler import
import kr.co.d_erp.repository.oracle.LoginRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoginService {

	private final LoginRepository loginRepository;
	private final PasswordHandler passwordHandler; 

	public Optional<Login> authenticate(String userId, String userPswd) {
		Optional<Login> userOptional = loginRepository.findByUserId(userId);

		if (userOptional.isPresent()) {
			Login user = userOptional.get();
			String encodedPassword = user.getUserPswd();

			// 암호화해서 비교
			if (passwordHandler.matches(userPswd, encodedPassword)) {
				return Optional.of(user);
			}
		}
		return Optional.empty(); // 인증 실패
	}
}
