package kr.co.d_erp.models;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;


// 비밀번호 암호화 및 검증을 담당하는 핸들러 클래스
@Component
public class PasswordHandler {
    
    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
    
    /**
     * 비밀번호 암호화
     * @param rawPassword 평문 비밀번호
     * @return 암호화된 비밀번호
     * @throws IllegalArgumentException 비밀번호가 null이거나 빈 문자열인 경우
     */
    public String encode(String rawPassword) {
        validatePassword(rawPassword);
        return passwordEncoder.encode(rawPassword);
    }
    
    /**
     * 비밀번호 검증
     * @param rawPassword 평문 비밀번호
     * @param encodedPassword 암호화된 비밀번호
     * @return 일치 여부
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    /**
     * 비밀번호가 암호화되었는지 확인
     * @param password 확인할 비밀번호
     * @return 암호화 여부
     */
    public boolean isEncoded(String password) {
        return password != null && password.startsWith("$2a$");
    }
    
    /**
     * 비밀번호 유효성 검증
     * @param password 검증할 비밀번호
     * @throws IllegalArgumentException 유효하지 않은 비밀번호인 경우
     */
    private void validatePassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호는 필수입니다");
        }
        if (password.length() < 4) {
            throw new IllegalArgumentException("비밀번호는 최소 4자 이상이어야 합니다");
        }
        if (password.length() > 50) {
            throw new IllegalArgumentException("비밀번호는 최대 50자까지 가능합니다");
        }
    }
    
    /**
     * 비밀번호 변경 검증 및 암호화
     * @param currentEncodedPassword 현재 암호화된 비밀번호
     * @param oldPassword 기존 평문 비밀번호
     * @param newPassword 새 평문 비밀번호
     * @return 새로 암호화된 비밀번호
     * @throws IllegalArgumentException 기존 비밀번호가 일치하지 않는 경우
     */
    public String changePassword(String currentEncodedPassword, String oldPassword, String newPassword) {
        if (!matches(oldPassword, currentEncodedPassword)) {
            throw new IllegalArgumentException("기존 비밀번호가 일치하지 않습니다");
        }
        return encode(newPassword);
    }
    
    /**
     * 임시 비밀번호 생성
     * @param length 생성할 비밀번호 길이
     * @return 임시 비밀번호 (평문)
     */
    public String generateTemporaryPassword(int length) {
        if (length < 4 || length > 20) {
            throw new IllegalArgumentException("임시 비밀번호 길이는 4-20자 사이여야 합니다");
        }
        
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        StringBuilder password = new StringBuilder();
        
        for (int i = 0; i < length; i++) {
            password.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        
        return password.toString();
    }
}