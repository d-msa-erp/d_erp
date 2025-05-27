package kr.co.d_erp.service;

import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.dtos.InvenDto;
import kr.co.d_erp.repository.oracle.ItemInvenRepository;

public interface MrpService {

	@Transactional(readOnly = true)
	public Long getCurrentStockByItemIdx(Long itemIdx);
}
