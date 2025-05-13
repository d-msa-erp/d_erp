package kr.co.d_erp.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class controller_init {
	@GetMapping("/login.do")
	public String login() {
		return "/login.html";
	}
	
	@GetMapping("/")
	public String site() {
		return "/site.html";
	}
	
	@GetMapping("/bom")
	public String bom() {
		return "/bom.html";
	}
	
	@GetMapping("/customer")
	public String customer() {
		return "/customer.html";
	}
	
	@GetMapping("/purchase")
	public String purchase() {
		return "/purchase.html";
	}
	
	@GetMapping("/sale")
	public String sale() {
		return "/sale.html";
	}
	
	@GetMapping("/shipping")
	public String shipping() {
		return "/shipping.html";
	}
	
	
	@GetMapping("/test")
	public String test() {
		return "/test.html";
	}
	

}
