package kr.co.d_erp.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.StockDto;
import kr.co.d_erp.dtos.StockRequestDto;
import kr.co.d_erp.dtos.UnitDto;
import kr.co.d_erp.dtos.WhmstDto;

public interface StockService {
	Page<StockDto> getInventoryList(String itemFlagFilter, String searchKeyword, Pageable pageable);
	
    // 단위 목록 조회 메소드 추가
    List<UnitDto> getAllUnits();
    
    // bizFlag에 따른 거래처 목록 조회 메소드 추가
    List<CustomerDTO> getCustomersByBizFlag(String bizFlag);
    
    List<WhmstDto> getAllWarehouses();
    
    StockDto createStockItem(StockRequestDto requestDto);
    StockDto updateStockItem(Long itemIdx, StockRequestDto requestDto);
}
