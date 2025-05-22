package kr.co.d_erp.controllers;

import jakarta.servlet.http.HttpSession;
import kr.co.d_erp.domain.Login;
import kr.co.d_erp.dtos.MyPageDto;
import kr.co.d_erp.service.MyPageService; // 새로 만든 MyPageService 주입
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/mypage") // /mypage 경로로 들어오는 요청을 처리
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService; // MyPageService 주입

    /**
     * 마이페이지 화면을 보여주는 GET 요청 처리
     * 세션에서 로그인된 사용자 ID를 가져와 DB에서 최신 사용자 정보를 조회하여 모델에 추가합니다.
     */
    @GetMapping
    public String showMyPage(HttpSession session, Model model) {
        Login loggedInUser = (Login) session.getAttribute("loggedInUser");

        if (loggedInUser == null) {
            // 세션에 사용자 정보가 없으면 로그인 페이지로 리다이렉트
            return "redirect:/login";
        }

        // 세션의 userId를 사용하여 DB에서 최신 사용자 정보를 가져옵니다.
        // MyPageDto 형태로 받습니다.
        myPageService.getUserInfoByUserId(loggedInUser.getUserId())
                .ifPresentOrElse(
                    MyPageDto -> model.addAttribute("user", MyPageDto),
                    () -> {
                        // DB에서도 사용자를 찾을 수 없으면 세션을 무효화하고 로그인 페이지로 리다이렉트
                        session.invalidate();
                        model.addAttribute("errorMessage", "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
                    }
                );

        return "/mypage.html"; // 마이페이지 템플릿 경로
    }

    /**
     * 사용자 정보 업데이트를 처리하는 POST 요청
     * 폼에서 제출된 데이터(MyPageDto)를 받아 서비스 계층으로 전달하여 업데이트합니다.
     */
    @PostMapping("/update")
    public String updateUserInfo(@ModelAttribute MyPageDto user, // DTO를 모델 어트리뷰트로 받음
                                 HttpSession session,
                                 RedirectAttributes redirectAttributes) {
        Login loggedInUser = (Login) session.getAttribute("loggedInUser");

        // 1. 로그인 여부 및 권한 확인
        if (loggedInUser == null || !loggedInUser.getUserId().equals(user.getUserId())) {
            redirectAttributes.addFlashAttribute("errorMessage", "잘못된 접근입니다. 다시 로그인해주세요.");
            session.invalidate(); // 세션 무효화
            return "redirect:/login";
        }

        try {
            // DTO에 userIdx를 직접 설정 (세션의 userIdx를 사용하는 것이 안전)
            user.setUserIdx(loggedInUser.getUserIdx());

            MyPageDto updatedUserDto = myPageService.updateUserInfo(user);
            // 세션 정보도 업데이트된 최신 정보로 갱신 (화면에 바로 반영되도록)
            // 주의: 세션에는 Login 엔티티가 저장되어 있으므로,
            // MyPageDto를 Login 엔티티로 변환하여 다시 세션에 저장하거나
            // 필요한 필드만 직접 업데이트해야 합니다. 여기서는 간략하게 Login 객체로 변환하여 저장합니다.
            // (실제 Login 객체를 업데이트된 DTO 필드들로 채워서 저장하는 로직이 더 안전합니다)
            loggedInUser.setUserNm(updatedUserDto.getUserNm());
            loggedInUser.setUserEmail(updatedUserDto.getUserEMail());
            loggedInUser.setUserTel(updatedUserDto.getUserTel());
            loggedInUser.setUserHp(updatedUserDto.getUserHp());
            loggedInUser.setUserDept(updatedUserDto.getUserDept());
            loggedInUser.setUserPosition(updatedUserDto.getUserPosition());
            session.setAttribute("loggedInUser", loggedInUser); // 세션 업데이트

            redirectAttributes.addFlashAttribute("successMessage", "정보가 성공적으로 업데이트되었습니다.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "정보 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            e.printStackTrace(); // 개발 중에는 스택 트레이스 출력
        }
        return "redirect:/mypage"; // 업데이트 후 마이페이지로 리다이렉트
    }

    /**
     * 비밀번호 변경을 처리하는 POST 요청
     * (현재 비밀번호 확인 필드는 프론트엔드에서 처리하고, 여기서는 새 비밀번호만 받습니다.)
     */
    @PostMapping("/updatePassword")
    public String updatePassword(@RequestParam("newPassword") String newPassword,
                                 @RequestParam("confirmPassword") String confirmPassword, // 확인 비밀번호도 받음
                                 HttpSession session,
                                 RedirectAttributes redirectAttributes) {
        Login loggedInUser = (Login) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }

        // 새 비밀번호와 확인 비밀번호 일치 여부 확인
        if (!newPassword.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("errorMessage", "새 비밀번호가 일치하지 않습니다.");
            return "redirect:/mypage";
        }

        try {
            // 실제 비밀번호 암호화 로직을 여기에 추가해야 합니다.
            myPageService.updatePW(loggedInUser.getUserId(), newPassword);
            redirectAttributes.addFlashAttribute("successMessage", "비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해주세요.");
            session.invalidate(); // 세션 무효화 (비밀번호 변경 후 재로그인 유도)
            return "redirect:/login?logout=true";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "비밀번호 변경 중 오류가 발생했습니다: " + e.getMessage());
            e.printStackTrace();
        }
        return "redirect:/mypage";
    }
}