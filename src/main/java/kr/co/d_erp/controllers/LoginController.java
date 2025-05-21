package kr.co.d_erp.controllers;

import java.util.Optional;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import kr.co.d_erp.domain.Login;
import kr.co.d_erp.service.LoginService;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class LoginController {

    private final LoginService loginService;

    // 로그인 페이지를 보여주는 GET 요청 처리
    @GetMapping("/login")
    public String loginPage(@RequestParam(value = "error", required = false) String error,
                            @RequestParam(value = "logout", required = false) String logout,
                            Model model,
                            HttpSession session) {
        if (error != null) {
            model.addAttribute("errorMessage", "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        if (logout != null) {
            model.addAttribute("logoutMessage", "성공적으로 로그아웃되었습니다.");
        }
        if (session.getAttribute("loggedInUser") != null) {
            return "redirect:/main";
        }
    	return "/login.html";
    }

    // 로그인 폼 제출(POST) 요청 처리 (login.html의 form action="/loginchk"에 해당)
    @PostMapping("/loginchk")
    public String loginCheck(@RequestParam("uId") String userId,
                             @RequestParam("uPw") String userPswd,
                             HttpServletRequest request,
                             Model m) {
        Optional<Login> authenticatedUser = loginService.authenticate(userId, userPswd);

        if (authenticatedUser.isPresent()) {
            // 로그인 성공
        	Login user = authenticatedUser.get();
            HttpSession session = request.getSession();
            session.setAttribute("loggedInUser", user);
            session.setMaxInactiveInterval(30 * 60);

            System.out.println("로그인 성공: " + user.getUserId());
       
            return "redirect:/main"; // 리다이렉트
        } else {
            // 로그인 실패
            System.out.println("로그인 실패: " + userId);
            m.addAttribute("errorMessage", "아이디 또는 비밀번호가 올바르지 않습니다.");
            return "/login.html"; // <-- 로그인 실패 시 다시 로그인 페이지로
        }
    }

    // 로그아웃 처리
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate(); // 세션 무효화
        return "redirect:/login?logout=true"; // 리다이렉트
    }

    // 메인 화면을 보여주는 GET 요청 처리
    @GetMapping("/main")
    public String mainPage(HttpSession session, Model m) {
        Login loggedInUser = (Login) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login"; // 세션이 없으면 로그인 페이지로 리다이렉트 (URL이므로 .html 붙이지 않음)
        }
        m.addAttribute("user", loggedInUser);
        return "/main.html"; // <-- 메인 템플릿
    }
}