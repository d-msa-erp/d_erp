package kr.co.d_erp.config;

import kr.co.d_erp.interceptor.LoginChkInterceptor;
import lombok.RequiredArgsConstructor; // Lombok 사용 시 추가 (생성자 자동 생성)
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor // final 필드에 대한 생성자를 만들어 자동으로 주입합니다. (Lombok)
public class WebMvcConfig implements WebMvcConfigurer {

    // Spring Bean으로 등록된 LoginChkInterceptor를 주입받습니다.
    private final LoginChkInterceptor loginChkInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 주입받은 loginChkInterceptor 인스턴스를 등록합니다.
        registry.addInterceptor(loginChkInterceptor)
                .order(1) // 실행 순서 지정
                .addPathPatterns("/**") // 모든 경로("/**")에 대해 인터셉터를 적용합니다.
                .excludePathPatterns( // ★★ 인터셉터 적용에서 제외할 경로 (로그인/정적자원/에러 등) ★★
                        "/login",         // 로그인 페이지
                        "/loginchk",      // 로그인 처리
                        "/logout",        // 로그아웃 처리
                        "/css/**",        // CSS 파일
                        "/js/**",         // JavaScript 파일
                        "/images/**",     // 이미지 파일
                        "/webjars/**",    // Webjars (Bootstrap 등)
                        "/error",         // Spring Boot 기본 에러 페이지
                        "/api/**"         // API (필요시 제외, 또는 별도 인터셉터/Security 적용)
                        // ★★ 권한 검사가 필요한 /main, /bom, /hr 등은 여기서 반드시 제거! ★★
                );
    }
}