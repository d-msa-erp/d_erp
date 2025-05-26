package kr.co.d_erp.service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
	
import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.Order;
import kr.co.d_erp.dtos.OrderDto;
import kr.co.d_erp.repository.oracle.OrderRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Order saveOrder(OrderDto dto) {
        Order order = new Order();

        order.setOrderCode(dto.getOrderCode());
        order.setOrderType(dto.getOrderType());
        order.setOrderDate(dto.getOrderDate());
        order.setCustIdx(dto.getCustIdx());
        order.setItemIdx(dto.getItemIdx());
        order.setOrderQty(dto.getOrderQty());
        order.setUnitPrice(dto.getUnitPrice());
        order.setDeliveryDate(dto.getDeliveryDate());
        order.setOrderStatus(dto.getOrderStatus());
        order.setUserIdx(dto.getUserIdx());
        order.setRemark(dto.getRemark());
        
        Object result = orderRepository.oracleTodayRaw(); 
        
        
        // Null 체크
        if (dto.getOrderQty() != null && dto.getUnitPrice() != null) {
            order.setTotalAmount(dto.getUnitPrice() * dto.getOrderQty());
        } else {
            throw new IllegalArgumentException("단가 또는 수량이 null입니다.");
        }
        
        Timestamp dbNow = orderRepository.oracleTodayRaw();
        order.setCreatedDate(dbNow.toLocalDateTime());

        return orderRepository.save(order);
    }
    
    
}