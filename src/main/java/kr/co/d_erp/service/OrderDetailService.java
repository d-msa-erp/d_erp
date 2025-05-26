package kr.co.d_erp.service;

import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.OrderDetailView;
import kr.co.d_erp.repository.oracle.OrderDetailViewRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderDetailService {

    private final OrderDetailViewRepository orderDetailViewRepository;

    public OrderDetailView getOrderDetail(Long orderIdx) {
        return orderDetailViewRepository.findById(orderIdx)
                .orElseThrow(() -> new NoSuchElementException("주문 정보를 찾을 수 없습니다."));
    }
}
