package kr.co.d_erp.config; // 패키지 경로를 프로젝트에 맞게 확인하세요.

import kr.co.d_erp.interceptor.LoginChkInterceptor; // 생성한 인터셉터 import
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // 이 클래스가 Spring의 설정 클래스임을 나타냅니다.
public class WebMvcConfig implements WebMvcConfigurer { // WebMvcConfigurer를 구현하여 웹 MVC 설정을 커스터마이징합니다.

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // LoginCheckInterceptor 인스턴스를 생성하여 등록합니다.
        registry.addInterceptor(new LoginChkInterceptor())
                .order(1) // 인터셉터의 실행 순서를 지정합니다. (낮은 숫자가 먼저 실행)
                          // 여러 인터셉터가 있을 경우 유용합니다.
                .addPathPatterns("/**") // 모든 경로("/**")에 대해 인터셉터를 적용합니다.
                                        // 즉, 모든 HTTP 요청이 이 인터셉터를 거치게 됩니다.
                .excludePathPatterns( // 이 패턴에 해당하는 경로들은 인터셉터 적용에서 제외합니다.
                                      // 로그인 없이 접근해야 하는 페이지들입니다.
                        "/", // 메인 페이지 (controller_init의 "/" 매핑을 통해 로그인 여부 확인)
                        "/login", // 로그인 페이지 자체
                        "/loginchk", // 로그인 처리 (POST 요청)
                        "/logout", // 로그아웃 처리
                        "/css/**", // CSS 파일 (모든 하위 경로 포함)
                        "/js/**", // JavaScript 파일 (모든 하위 경로 포함)
                        "/images/**", // 이미지 파일 (모든 하위 경로 포함)
                        "/error", // Spring Boot 기본 에러 페이지
                        "/api/**", // API 요청 경로는 별도로 인증/권한 처리를 할 가능성이 높으므로 제외
                                  // (SiteController와 같은 @RestController는 보통 JWT 등 다른 인증 방식 사용)
                     // ******************************************************
                        // 개발 중인 모든 페이지들을 인터셉터에서 제외합니다.
                        // controller_init.java의 모든 @GetMapping 경로들을 추가
                        "/main",
                        "/site",
                        "/inventory",
                        "/bom",
                        "/warehouse",
                        "/customer",
                        "/purchase",
                        "/sales",
                        "/stock",
                        "/planning",
                        "/mrp",
                        "/pagesettings",
                        "/hr",
                        "/inbound",
                        "/outbound"
                        
                        // ******************************************************
                );
    }
}