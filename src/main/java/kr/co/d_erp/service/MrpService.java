package kr.co.d_erp.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import kr.co.d_erp.dtos.MrpSecondDto;

public interface MrpService {
	
	Page<MrpSecondDto> findMrpResults(Long orderId, Pageable pageable);

	Page<MrpSecondDto> findMrpTargetOrders(String orderTypeFilter, String searchKeyword, Pageable pageable);
}

