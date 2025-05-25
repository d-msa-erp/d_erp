package kr.co.d_erp.controllers;

import org.springframework.web.bind.annotation.*;

import kr.co.d_erp.domain.Order;
import kr.co.d_erp.dtos.OrderDto;
import kr.co.d_erp.service.OrderService;

import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/save")
    public ResponseEntity<Order> createOrder(@RequestBody OrderDto dto) {
        Order savedOrder = orderService.saveOrder(dto);
        return ResponseEntity.ok(savedOrder);
    }
}