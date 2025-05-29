package kr.co.d_erp.service;


import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.repository.oracle.SalesRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalesService {
		
	private final SalesRepository salesRepository;
	
	public Page<SalesView> getSalesOrders(String orderType, String sortBy, String sortDirection, int page) {
	    Sort.Direction direction = Sort.Direction.fromString(sortDirection);
	    Pageable pageable = PageRequest.of(page, 10, Sort.by(direction, sortBy)); 

	    return salesRepository.findByOrderType(orderType, pageable);
	}
	
	public Page<SalesView> getPurchaseOrders(String orderType, String sortBy, String sortDirection, int page) {
	    Sort.Direction direction = Sort.Direction.fromString(sortDirection);
	    Pageable pageable = PageRequest.of(page, 10, Sort.by(direction, sortBy)); // 페이지당 10개
	    return salesRepository.findByOrderType(orderType, pageable);
	}
    
	public Page<SalesView> searchItems(String searchTerm, String dateType, String startDateStr, String endDateStr, int page) {
	    Pageable pageable = PageRequest.of(page, 10);
	    LocalDate startDate = null;
	    LocalDate endDate = null;
	    try {
	        if (startDateStr != null && !startDateStr.isBlank()) {
	            startDate = LocalDate.parse(startDateStr); // yyyy-MM-dd 형식일 것
	        }
	        if (endDateStr != null && !endDateStr.isBlank()) {
	            endDate = LocalDate.parse(endDateStr);
	        }
	    } catch (DateTimeParseException e) {
	        throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다. yyyy-MM-dd 형식이어야 합니다.");
	    }
	    return salesRepository.searchWithDate(searchTerm, dateType, startDate, endDate, pageable);
	}
}
