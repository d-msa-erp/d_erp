package kr.co.d_erp.controllers;

import kr.co.d_erp.dtos.Custmst;
import kr.co.d_erp.service.CustmstService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
public class CustomerController {

    @Autowired
    private CustmstService custmstService;

    @GetMapping("/api/customer/{bizFlag}")
    public List<Custmst> getCustomers(@PathVariable("bizFlag") String bizFlag) {
        // bizFlag에 따라 조건 걸어서 서비스 호출
        return custmstService.getCustomersByBizFlag(bizFlag);
    }
    
    // 상세 보기
    @GetMapping("/api/customer/detail/{id}")
    public ResponseEntity<Custmst> getCustomerById(@PathVariable("id") Long id) {
        Optional<Custmst> customer = custmstService.getCustomerById(id);
        return customer.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }
}
