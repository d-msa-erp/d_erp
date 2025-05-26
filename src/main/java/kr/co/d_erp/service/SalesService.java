package kr.co.d_erp.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.repository.oracle.SalesRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalesService {
		
	private final SalesRepository salesRepository;
	
    public List<SalesView> getSalesOrders(String orderType, String sortBy, String sortDirection) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);  // 정렬 방향 (asc 또는 desc)
        Sort sort = Sort.by(direction, sortBy);  // 정렬 기준과 방향 설정

        return salesRepository.findByOrderType(orderType, sort);  // Repository에서 데이터를 정렬하여 반환
    }
	
    public List<SalesView> getPurchaseOrders(String orderType, String sortBy, String sortDirection) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);  // 정렬 방향 (asc 또는 desc)
        Sort sort = Sort.by(direction, sortBy);  // 정렬 기준과 방향 설정

        return salesRepository.findByOrderType(orderType, sort);  // Repository에서 데이터를 정렬하여 반환
    }
    
    public List<SalesView> searchItems(String searchTerm) {
        return salesRepository.searchItems(searchTerm);
    }
}
