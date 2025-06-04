package kr.co.d_erp.service;

import kr.co.d_erp.dtos.SeonikItemDto;
import kr.co.d_erp.dtos.CustomerDTO;    // 제공된 DTO 사용
import kr.co.d_erp.dtos.CategoryDto;   // 제공된 DTO 사용
import kr.co.d_erp.dtos.UnitDto;       // 제공된 DTO 사용

import java.io.IOException;
import java.util.List;

public interface SeonikItemService {

    // 품목 기본 CRUD
    List<SeonikItemDto> getAllItems();
    List<SeonikItemDto> getItemsByFlag(String itemFlag);
    void createItem(SeonikItemDto dto);
    void updateItem(Long itemIdx, SeonikItemDto dto);
    void deleteItem(Long itemIdx);

    // 모달 옵션 데이터 조회를 위한 메소드
    List<CustomerDTO> getAllCustomerOptions(String bizFlag);
    List<CategoryDto> getParentItemCategoryOptions();
    List<CategoryDto> getChildItemCategoryOptions(Long parentCategoryIdx);
    List<UnitDto> getAllUnitOptions();
    
    List<SeonikItemDto> getItemsByIdxs(List<Long> itemIdxs); // 엑셀/인쇄용 상세 조회
    byte[] createItemsExcelFile(List<SeonikItemDto> items) throws IOException; // Excel 생성
    
    
    
}