package kr.co.d_erp.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class controller_init {
	
	@GetMapping("/login.do")//로그인페이지
	public String login() {
		return "/login.html";
	}
	
	@GetMapping("/") //Main페이지
	public String main() {
		return "/main.html";
	}
	@GetMapping("/site") //사업장 관리
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
	
	@GetMapping("/inbound")
	public String inbound() {
		return "/inbound.html";
	}
	@GetMapping("/outbound")
	public String outbound() {
		return "/outbound.html";
	}
	@GetMapping("/mrp")
	public String mrp() {
		return "/mrp.html";
	}
	
	
	@GetMapping("/test")
	public String test() {
		return "/test.html";
	}
	

}
