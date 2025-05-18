package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import kr.co.d_erp.daos.CustomerDao;
import kr.co.d_erp.dtos.Customer;

@Controller
public class CustomerController {
	
	
	@Autowired
	CustomerDao CDao;
	
	@GetMapping("/customer")
	public String customer(@RequestParam(name="bizFlag", defaultValue = "01") String bizFlag, Model m) {
		List<Customer> AllList = CDao.ViewAllCustomer(bizFlag);
		
		m.addAttribute("AllList", AllList);
	    m.addAttribute("bizFlag", bizFlag);
		return "/customer.html";
	}
}
