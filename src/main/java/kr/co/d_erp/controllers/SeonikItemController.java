package kr.co.d_erp.controllers;

import kr.co.d_erp.dtos.*; // SeonikItemDto, CustomerDTO, CategoryDto, UnitDto 등
import kr.co.d_erp.service.SeonikItemService;
import lombok.RequiredArgsConstructor; // 생성자 주입용
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;  
import java.io.IOException;
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
    
    @PostMapping("/api/items2/excel-download") // JavaScript에서 호출하는 경로와 일치
    public ResponseEntity<byte[]> downloadItemsAsExcel(@RequestBody List<Long> itemIdxs, HttpServletResponse response) {
        // ✳️ 주의: itemIdxs가 비어있거나 너무 많을 경우에 대한 처리 필요

        // 1. itemIdxs를 사용하여 SeonikItemDto 목록 조회 (서비스 메소드 호출)
        //    (이때, SeonikItemRepository에 List<Long> itemIdxs를 받아 List<SeonikItemDto>를 반환하는 메소드 추가 필요)
        //    또는 서비스에서 각 ID에 대해 조회하거나, 현재는 JPQL에 IN절을 사용하는 것이 좋음.
        //    여기서는 SeonikItemService에 새로운 메소드를 추가한다고 가정합니다.
        List<SeonikItemDto> itemsToExport = seonikItemService.getItemsByIdxs(itemIdxs); // ✳️ 이 메소드를 서비스에 추가해야 함

        // 2. 조회된 DTO 목록을 사용하여 Excel 파일 생성 (Apache POI 등 라이브러리 사용)
        //    이 부분은 별도의 Excel 생성 유틸리티 클래스나 서비스로 분리하는 것이 좋음
        try {
            byte[] excelBytes = seonikItemService.createItemsExcelFile(itemsToExport); // ✳️ 이 메소드를 서비스에 추가해야 함

            String filename = "품목_상세정보_" + java.time.LocalDate.now().toString() + ".xlsx";
            String encodedFilename = java.net.URLEncoder.encode(filename, "UTF-8").replaceAll("\\+", "%20");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", encodedFilename); // 파일명 UTF-8 인코딩

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);

        } catch (IOException e) {
            // 로깅 및 오류 처리
            e.printStackTrace();
            return ResponseEntity.status(500).body(null); // 또는 적절한 오류 응답
        }
    }
    
}