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

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    
    @PutMapping("/update")
    public ResponseEntity<String> updateOrder(@RequestBody OrderDto dto) {
        try {
            orderService.updateOrderAndTransaction(dto);
            return ResponseEntity.ok("주문 수정 성공");
        } catch (Exception e) {
        	e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("주문 수정 실패: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteOrder(@RequestBody List<Long> orderIdxList) {
        orderService.deleteOrderAndRelatedData(orderIdxList);
        return ResponseEntity.ok().build();
    }
    
}