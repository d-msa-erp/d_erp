package kr.co.d_erp.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.service.SalesService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")  // 기본 경로
@RequiredArgsConstructor
public class SaleController {

	private final SalesService salesService;

    // 구매 발주(P)만 조회
    @GetMapping("/sales")
    public List<SalesView> getSalesOrders() {
        return salesService.getSalesOrders();
    }
    
    
    @GetMapping("/getno")
    public Map<String, Object> getOrderNo() {
        int randomOrderNo = (int)(Math.random() * 90000000) + 10000000;

        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", randomOrderNo);
        return result;
    }
}