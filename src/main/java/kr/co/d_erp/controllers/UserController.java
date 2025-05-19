package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.annotation.Resource;
import kr.co.d_erp.daos.UserDao;
import kr.co.d_erp.dtos.User;
import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class UserController {
	@Resource(name = "UserDao")
	UserDao userdao;
/*
	@GetMapping("/hr")
	public String getUserPage(Model m) {
		try {
			List<User> users = this.userdao.selectAllUsers();
			m.addAttribute("users", users);
		} catch (Exception e) {
			log.info(e.toString() + "사용자 목록 조회 실패");
		}

		return "/hr.html";
	}

*/
}
