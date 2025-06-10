package kr.co.d_erp.interceptor; // 패키지 경로는 기존과 동일하게 유지

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import kr.co.d_erp.domain.Login; // 세션에 저장된 사용자 정보 클래스 (경로 확인!)
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.PrintWriter; // PrintWriter 추가
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Component
public class LoginChkInterceptor implements HandlerInterceptor {

    // 역할별 접근 가능 URL 패턴 (prefix 기준)
    private static final Map<String, Set<String>> permissionMap = new HashMap<>();

    static {
        // 기준정보관리
        permissionMap.put("/site", new HashSet<>(Arrays.asList("01","02"))); // 사업장 관리
        permissionMap.put("/customer", new HashSet<>(Arrays.asList("01","02", "03", "04"))); // 거래처 관리
        permissionMap.put("/inventory", new HashSet<>(Arrays.asList("01","02", "04", "05", "06"))); // 품목 관리 (URL을 /item으로 변경)
        permissionMap.put("/bom", new HashSet<>(Arrays.asList("01","02", "05"))); // BOM 관리
        permissionMap.put("/warehouse", new HashSet<>(Arrays.asList("01","02", "06"))); // 창고 관리

        // 구매/영업관리
        permissionMap.put("/purchase", new HashSet<>(Arrays.asList("01","02", "04"))); // 발주 관리
        permissionMap.put("/sales", new HashSet<>(Arrays.asList("01","02", "03"))); // 주문 관리
        permissionMap.put("/outbound", new HashSet<>(Arrays.asList("01","02", "03", "06"))); // 출고 관리
        permissionMap.put("/mrp", new HashSet<>(Arrays.asList("01","02", "04", "05"))); // MRP

        // 자재관리
        permissionMap.put("/inbound", new HashSet<>(Arrays.asList("01","02", "04", "06"))); // 입고 관리
        permissionMap.put("/stock", new HashSet<>(Arrays.asList("01","02", "06"))); // 재고 관리 (URL을 /stock으로 변경)

        // 생산관리
        permissionMap.put("/planning", new HashSet<>(Arrays.asList("01","02", "05"))); // 생산 계획

        // 인사관리
        permissionMap.put("/hr", new HashSet<>(Arrays.asList("01","02", "07"))); // 사원관리
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String contextPath = request.getContextPath();
        String requestURI = request.getRequestURI();
        String requestPath = requestURI.substring(contextPath.length());

        HttpSession session = request.getSession(false);

        //system.out.println("Interceptor: 요청 경로 = " + requestPath);

        if (isWhiteListed(requestPath)) {
            //system.out.println("Interceptor 제외: " + requestPath);
            return true;
        }

        if (session == null || session.getAttribute("loggedInUser") == null) {
            //system.out.println("미인증 사용자 접근 시도: " + requestPath);
            // ★★ 미인증 시에는 로그인 페이지로 리디렉션 ★★
            response.sendRedirect(contextPath + "/login?error=unauthorized");
            return false;
        }

        Login user = (Login) session.getAttribute("loggedInUser");
        String userStatus = user.getUserStatus();
        String userRole = user.getUserRole();

        //system.out.println("Interceptor: Role=" + userRole + ", Status=" + userStatus);

        if (!"01".equals(userStatus)) {
            //system.out.println("Interceptor: 비활성 사용자(" + userStatus + ") 접근 시도. 접근 거부.");
            // ★★ 상태 비활성 시에는 경고창 후 로그인 페이지로 (또는 다른 처리) ★★
            sendAlertAndRedirect(response, "계정이 활성 상태가 아닙니다. 관리자에게 문의하세요.", contextPath + "/login?error=status");
            return false;
        }

        if (requestPath.equals("/") || requestPath.startsWith("/main") || requestPath.startsWith("/mypage")) {
             //system.out.println("Interceptor: 메인/마이페이지 접근 허용.");
             return true;
        }

        if (checkPermission(userRole, requestPath)) {
            //system.out.println("Interceptor: 권한 확인됨. 접근 허용.");
            return true;
        } else {
            //system.out.println("Interceptor: 권한 없음 (" + userRole + "). 접근 거부.");
            // ★★ 권한 없을 시 경고창 + 이전 페이지로 이동 ★★
            sendAlertAndBack(response, "권한이 없습니다. 인사관리에 문의하세요.");
            return false; // 요청 중단
        }
    }

    /**
     * 요청 URI가 로그인/권한 검사를 제외할 대상인지 확인합니다.
     */
    private boolean isWhiteListed(String requestPath) {
        return requestPath.equals("/login") ||
               requestPath.equals("/loginchk") ||
               requestPath.equals("/logout") ||
               requestPath.startsWith("/css/") ||
               requestPath.startsWith("/js/") ||
               requestPath.startsWith("/images/") ||
               requestPath.startsWith("/webjars/") ||
               requestPath.equals("/error") ||
               requestPath.startsWith("/api/");
    }

    /**
     * 사용자의 역할과 요청 URI를 기반으로 접근 권한을 확인합니다.
     */
    private boolean checkPermission(String userRole, String requestPath) {
        if (userRole == null) {
            return false;
        }

        for (Map.Entry<String, Set<String>> entry : permissionMap.entrySet()) {
            String pathPrefix = entry.getKey();
            Set<String> allowedRoles = entry.getValue();

            if (requestPath.startsWith(pathPrefix)) {
                return allowedRoles.contains(userRole);
            }
        }
        //system.out.println("Interceptor: URI '" + requestPath + "'에 대한 권한 설정이 없습니다. 접근 거부.");
        return false;
    }

    /**
     * 클라이언트에게 JavaScript alert를 보내고 이전 페이지로 이동시킵니다.
     * @param response HttpServletResponse 객체
     * @param message  경고창에 표시할 메시지
     * @throws Exception
     */
    private void sendAlertAndBack(HttpServletResponse response, String message) throws Exception {
        response.setContentType("text/html; charset=UTF-8"); // Content-Type 설정 (한글 깨짐 방지)
        PrintWriter out = response.getWriter();
        out.println("<script type='text/javascript'>");
        out.println("alert('" + message + "');");
        out.println("history.back();"); // 이전 페이지로 이동
        out.println("</script>");
        out.flush(); // 버퍼 비우기
    }

    /**
     * 클라이언트에게 JavaScript alert를 보내고 지정된 URL로 리디렉션합니다.
     * @param response HttpServletResponse 객체
     * @param message  경고창에 표시할 메시지
     * @param redirectUrl 리디렉션할 URL
     * @throws Exception
     */
    private void sendAlertAndRedirect(HttpServletResponse response, String message, String redirectUrl) throws Exception {
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<script type='text/javascript'>");
        out.println("alert('" + message + "');");
        out.println("location.href='" + redirectUrl + "';"); // 지정된 URL로 이동
        out.println("</script>");
        out.flush();
    }


    // postHandle 및 afterCompletion
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, org.springframework.web.servlet.ModelAndView modelAndView) throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
    }
}