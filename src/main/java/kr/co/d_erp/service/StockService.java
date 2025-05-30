package kr.co.d_erp.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.StockDto;
import kr.co.d_erp.dtos.StockForResponseDto;
import kr.co.d_erp.dtos.StockInvRequestDto;
import kr.co.d_erp.dtos.StockRequestDto;
import kr.co.d_erp.dtos.UnitDto;
import kr.co.d_erp.dtos.WhmstDto;

public interface StockService {
	Page<StockDto> getInventoryList(String itemFlagFilter, String searchKeyword, Pageable pageable);
	
	List<StockForResponseDto> getAllItemForStock();
	
	void deleteInventories(List<Long> invIdxs);
	
    // 드롭다운 조회용
    List<UnitDto> getAllUnits();
    List<CustomerDTO> getCustomersByBizFlag(String bizFlag);
    List<WhmstDto> getAllWarehouses();
    
    // 신규 등록 모달의 품목 선택 datalist용 (품목 마스터 정보 기반)
    List<StockInvRequestDto> getAllItemsForStockRegistration();
    
    // 신규 재고 직접 등록 (TB_INVENTORY에만)
    StockDto createInventoryDirectly(StockRequestDto requestDto);

    // 재고 정보 수정 (TB_INVENTORY 직접 수정, 필요시 TB_ITEMMST도)
    StockDto updateStockItem(Long invIdx, StockRequestDto requestDto); // 식별자를 invIdx로 사용

    // 재고 직접 삭제 (TB_INVENTORY에서만)
    void deleteInventoriesByInvIdxs(List<Long> invIdxs); // invIdx 리스트로 삭제

    byte[] createExcelFile(String itemFlagFilter, String searchKeyword) throws IOException;
}
