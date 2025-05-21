// src/main/java/kr/co/d_erp/controllers/controller_init.java
package kr.co.d_erp.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.HttpSession; // HttpSession import 추가
import kr.co.d_erp.domain.Login;

@Controller
public class controller_init {



//	@GetMapping("/") // 초기 진입점 또는 메인 페이지
//	public String main(HttpSession session) { // HttpSession을 매개변수로 받음
//		// 세션에 로그인 정보(loggedInUser)가 있는지 확인
//		/* 우선은.......... 주석......로그인 리다이렉션
//		if (session.getAttribute("loggedInUser") == null) {
//			// 로그인 정보가 없으면 로그인 페이지로 리다이렉트
//			return "redirect:/login"; // LoginController의 @GetMapping("/login")으로 리다이렉트
//		}
//		// 로그인 정보가 있으면 메인 페이지로 이동
//		 */
//		return "/main.html";
//	}
//	
	
	@GetMapping("/") // 초기 진입점 또는 메인 페이지
	public String main(HttpSession session, Model model) { // Model 매개변수 추가
		// 세션에 로그인 정보(loggedInUser)가 있는지 확인
		Login loggedInUser = (Login) session.getAttribute("loggedInUser");

		if (loggedInUser == null) {
            System.out.println("===== 세션 정보 확인 (controller_init / 접근 시) =====");
            System.out.println("세션에 loggedInUser 없음. 로그인 페이지로 리다이렉트합니다.");
            System.out.println("=======================================");
			return "redirect:/login"; // 로그인 정보가 없으면 로그인 페이지로 리다이렉트
		}

		// 로그인 정보가 있으면 Model에 사용자 정보를 추가하여 템플릿으로 전달
		model.addAttribute("userNm", loggedInUser); // <<<--- 이 줄이 반드시 추가되어야 합니다!
        System.out.println("===== 세션 정보 확인 (controller_init / 접근 시) =====");
        System.out.println("세션 ID: " + session.getId());
        System.out.println("세션에 loggedInUser 존재: " + loggedInUser.getUserId() + ", " + loggedInUser.getUserNm());
        System.out.println("=======================================");

		return "/main.html"; // .html 확장자도 추가
	}
	

	// (나머지 @GetMapping 메서드들은 그대로 유지)
	@GetMapping("/site") // 사업장 관리
	public String site() {
		return "/site.html";
	}

	@GetMapping("/inventory")
	public String inventory() {
		return "/inventory.html";
	}

	@GetMapping("/bom")
	public String bom() {
		return "/bom.html";
	}

	@GetMapping("/warehouse")
	public String warehouse() {
		return "/warehouse.html";
	}

	@GetMapping("/customer")
	public String customer() {
		return "/customer.html";
	}

	@GetMapping("/purchase")
	public String purchase() {
		return "/purchase.html";
	}

	@GetMapping("/sales")
	public String sale() {
		return "/sales.html";
	}

	@GetMapping("/stock")
	public String stock() {
		return "/stock.html";
	}

	@GetMapping("/planning")
	public String planning() {
		return "/production-planning.html";
	}
	@GetMapping("/mrp")
	public String mrp() {
		return "/mrp.html";
	}

	@GetMapping("/pagesettings")
	public String pagesettings() {
		return "/pagesettings.html";
	}
	@GetMapping("/hr")
	public String hr() {
		return "/hr.html";
	}
	
	@GetMapping("/inbound")
	public String inbound() {
		return "/inbound.html";
	}

	@GetMapping("/outbound")
	public String outbound() {
		return "/outbound.html";
	}
//	
//	@GetMapping("/mypage")
//	public String mypage() {
//		return "/mypage.html";
//	}
}