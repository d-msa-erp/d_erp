package kr.co.d_erp.controllers;

import org.springframework.web.bind.annotation.*;

import kr.co.d_erp.domain.Order;
import kr.co.d_erp.domain.OrderDetailView;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.OrderDto;
import kr.co.d_erp.dtos.OrderResponseDto;
import kr.co.d_erp.service.InvTransactionService;
import kr.co.d_erp.service.OrderDetailService;
import kr.co.d_erp.service.OrderService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderDetailService orderDetailService;

    public OrderController(OrderService orderService, OrderDetailService orderDetailService) {
        this.orderService = orderService;
		this.orderDetailService = orderDetailService;
    }

    @PostMapping("/save")
    public  ResponseEntity<?> saveOrder(@RequestBody OrderDto dto) {
    	OrderResponseDto result = orderService.saveOrder(dto); 
    	return ResponseEntity.ok(result);
    }
    
    @GetMapping("/detail/{orderIdx}")
    public ResponseEntity<OrderDetailView> getOrder(@PathVariable Long orderIdx) {
        OrderDetailView detail = orderDetailService.getOrderDetail(orderIdx);
        return ResponseEntity.ok(detail);
    }
    
}