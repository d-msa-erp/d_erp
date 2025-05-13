package kr.co.d_erp.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class controller_init {
	@GetMapping("/test.do")
	public String test() {
		return "/bom.html";
	}
}
