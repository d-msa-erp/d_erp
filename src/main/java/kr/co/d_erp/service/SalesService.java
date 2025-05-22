package kr.co.d_erp.service;

import java.util.List;

import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.repository.oracle.SalesRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalesService {
		
	private final SalesRepository salesRepository;
	
	public List<SalesView> getSalesOrders() {
	    return salesRepository.findByOrderTypeOrderByDeliveryDateAsc("S");
	}
}
