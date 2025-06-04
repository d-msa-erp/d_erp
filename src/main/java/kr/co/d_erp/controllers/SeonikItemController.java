package kr.co.d_erp.controllers;

import kr.co.d_erp.dtos.*; // SeonikItemDto, CustomerDTO, CategoryDto, UnitDto 등
import kr.co.d_erp.service.SeonikItemService;
import lombok.RequiredArgsConstructor; // 생성자 주입용
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 생성
public class SeonikItemController {

    private final SeonikItemService seonikItemService;

    // --- 품목 CRUD 엔드포인트 ---
    @GetMapping("/api/items2")
    public List<SeonikItemDto> getAllItems() {
        return seonikItemService.getAllItems();
    }

    @GetMapping("/api/items2/flag/{itemFlag}")
    public List<SeonikItemDto> getItemsByFlag(@PathVariable String itemFlag) {
        return seonikItemService.getItemsByFlag(itemFlag);
    }

    @PostMapping("/api/items2")
    public ResponseEntity<String> createItem(@RequestBody SeonikItemDto dto) {
        seonikItemService.createItem(dto);
        return ResponseEntity.ok("등록 완료");
    }

    @PutMapping("/api/items2/{itemIdx}")
    public ResponseEntity<String> updateItem(@PathVariable Long itemIdx, @RequestBody SeonikItemDto dto) {
        seonikItemService.updateItem(itemIdx, dto);
        return ResponseEntity.ok("수정 완료");
    }

    @DeleteMapping("/api/items2/{itemIdx}")
    public ResponseEntity<String> deleteItem(@PathVariable Long itemIdx) {
        seonikItemService.deleteItem(itemIdx);
        return ResponseEntity.ok("삭제 완료");
    }

    // --- 모달 옵션 로드를 위한 엔드포인트들 ---
    @GetMapping("/api/data/customers")
    public List<CustomerDTO> getCustomerOptions(@RequestParam(defaultValue = "01") String bizFlag) {
        // DDL의 TB_CUSTMST.BIZ_FLAG ('01', '02', '03') 값 중 유효한 기본값 사용
        return seonikItemService.getAllCustomerOptions(bizFlag);
    }

    @GetMapping("/api/data/item-categories/parents")
    public List<CategoryDto> getParentItemCategoryOptions() { // CategoryDto 반환
        return seonikItemService.getParentItemCategoryOptions();
    }

    @GetMapping("/api/data/item-categories/children/{parentIdx}")
    public List<CategoryDto> getChildItemCategoryOptions(@PathVariable Long parentIdx) { // CategoryDto 반환
        // ItemCatRepository 메소드 파라미터가 Long이므로 PathVariable도 Long
        return seonikItemService.getChildItemCategoryOptions(parentIdx);
    }

    @GetMapping("/api/data/units")
    public List<UnitDto> getUnitOptions() { // UnitDto 반환
        return seonikItemService.getAllUnitOptions();
    }
}