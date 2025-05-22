package kr.co.d_erp.interceptor; // 패키지 경로를 프로젝트에 맞게 확인하세요.

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView; // 이 import는 사용하지 않아도 됩니다.

public class LoginChkInterceptor implements HandlerInterceptor {

    // preHandle: 컨트롤러(핸들러) 실행 전에 호출됩니다.
    // 여기서 로그인 여부를 확인하고, 필요한 경우 리다이렉트합니다.
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI(); // 현재 요청의 URI (예: /main, /site 등)
        HttpSession session = request.getSession(false); // 세션이 없으면 새로 생성하지 않음 (true는 새로 생성)

        System.out.println("인터셉터 작동: 요청 URI = " + requestURI);

        // --- 로그인 검사를 제외할 경로 목록 (White List) ---
        // 이 경로들은 로그인 여부와 상관없이 접근을 허용합니다.
        // 1. 로그인 관련 페이지: 로그인 페이지, 로그인 처리
        // 2. 정적 자원: CSS, JS, 이미지 등 (아래 WebMvcConfig에서 한번 더 제외하지만, 여기에 명시하면 명확)
        // 3. 에러 페이지 등
        if (requestURI.equals("/login") || // 로그인 화면
            requestURI.equals("/loginchk") || // 로그인 처리 POST 요청
            requestURI.equals("/logout") || // 로그아웃 처리
            requestURI.startsWith("/css/") ||
            requestURI.startsWith("/js/") ||
            requestURI.startsWith("/images/") ||
            requestURI.equals("/error") || // 에러 페이지 (Spring Boot 기본)
            requestURI.equals("/favicon.ico")) {
            System.out.println("인터셉터 제외: " + requestURI);
            return true; // 요청 처리 계속 진행
        }

        // --- 로그인 검사 로직 ---
        // 세션에 "loggedInUser" 속성이 있는지 확인하여 로그인 여부 판단
        if (session == null || session.getAttribute("loggedInUser") == null) {
            System.out.println("미인증 사용자 접근 시도: " + requestURI);
            // 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
            // /login?error=true 파라미터를 추가하여 로그인 페이지에서 오류 메시지를 표시할 수 있습니다.
            response.sendRedirect("/login?error=unauthorized");
            return false; // 더 이상 요청 처리 진행 안 함 (컨트롤러로 넘어가지 않음)
        }

        // 로그인되어 있으면 요청 처리 계속 진행 (컨트롤러로 넘어감)
        System.out.println("인증된 사용자 요청: " + requestURI);
        return true;
    }

    // postHandle: 컨트롤러 실행 후, 뷰 렌더링 전에 호출됩니다.
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        // 이 예시에서는 특별히 할 작업이 없으므로 비워둡니다.
    }

    // afterCompletion: 뷰 렌더링이 완료된 후 (요청 처리가 완전히 끝난 후) 호출됩니다.
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 이 예시에서는 특별히 할 작업이 없으므로 비워둡니다.
    }
}