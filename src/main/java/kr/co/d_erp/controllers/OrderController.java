package kr.co.d_erp.controllers;

import org.springframework.web.bind.annotation.*;

import kr.co.d_erp.domain.Order;
import kr.co.d_erp.domain.OrderDetailView;
import kr.co.d_erp.dtos.OrderDto;
import kr.co.d_erp.service.OrderDetailService;
import kr.co.d_erp.service.OrderService;

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
    public ResponseEntity<Order> createOrder(@RequestBody OrderDto dto) {
        Order savedOrder = orderService.saveOrder(dto);
        return ResponseEntity.ok(savedOrder);
    }
    
    @GetMapping("/detail/{orderIdx}")
    public ResponseEntity<OrderDetailView> getOrder(@PathVariable Long orderIdx) {
        OrderDetailView detail = orderDetailService.getOrderDetail(orderIdx);
        return ResponseEntity.ok(detail);
    }
    
}