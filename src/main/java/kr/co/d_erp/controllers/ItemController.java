package kr.co.d_erp.controllers;

// Spring Framework 관련
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

// Servlet 관련
import jakarta.servlet.http.HttpServletResponse;

// Java 기본 라이브러리
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// Apache POI (엑셀 처리용)
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.hibernate.Hibernate;

// Lombok
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 프로젝트 내부 클래스
import kr.co.d_erp.dtos.*;
import kr.co.d_erp.domain.Itemmst;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.service.ItemService;
import kr.co.d_erp.repository.oracle.InventoryRepository;

@Controller
@RequestMapping("/api/items")
@RequiredArgsConstructor
@Slf4j
public class ItemController {
    
    private final ItemmstRepository itemmstRepository;
    private final InventoryRepository inventoryRepository;
    private final ItemService itemService;

    /**
     * 품목 목록 조회 (페이징, 정렬, 검색)
     */
    @GetMapping("list")
    @ResponseBody
    public ResponseEntity<PageDto<ItemDto>> getItemList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "itemNm") String sort,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String searchCat,
            @RequestParam(required = false) String searchItem,
            @RequestParam(required = false) String itemCat1,
            @RequestParam(required = false) String itemCat2) {
        
        try {
            // 정렬 방향 설정
            Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC;
            
            // 정렬 필드 매핑
            String sortField = mapSortField(sort);
            Sort sortObj = Sort.by(sortDirection, sortField);
            
            // 페이지 요청 생성
            Pageable pageable = PageRequest.of(page, size, sortObj);
            
            // 검색 조건 처리
            String finalSearchCat = mapSearchCategory(searchCat);
            String finalSearchItem = (searchItem != null && !searchItem.trim().isEmpty()) 
                ? searchItem.trim() 
                : null;
            
            log.info("품목 목록 조회 - page: {}, size: {}, sort: {}, direction: {}, searchCat: {}, searchItem: {}", 
                    page, size, sort, direction, finalSearchCat, finalSearchItem);
            
            // 데이터 조회
            Page<Itemmst> itemPage;
            if (finalSearchItem != null || itemCat1 != null || itemCat2 != null) {
                itemPage = itemmstRepository.findWithJoinsAndSearch(finalSearchCat, finalSearchItem, pageable);
            } else {
                itemPage = itemmstRepository.findAllWithJoins(pageable);
            }
            
            // DTO 변환 시 재고량도 함께 조회 (성능 최적화)
            List<Long> itemIds = itemPage.getContent().stream()
                    .map(Itemmst::getItemIdx)
                    .toList();
            
            Map<Long, BigDecimal> stockQtyMap = getStockQtyMap(itemIds);
            
            List<ItemDto> itemDtos = itemPage.getContent().stream()
                    .map(item -> convertItemToDtoWithStock(item, stockQtyMap))
                    .toList();
            
            PageDto<ItemDto> result = new PageDto<>(itemPage, itemDtos);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("품목 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 품목 상세 조회
     */
    @GetMapping("/{itemIdx}")
    @ResponseBody
    public ResponseEntity<ItemDto> getItemDetail(@PathVariable Long itemIdx) {
        try {
            Optional<Itemmst> itemOpt = itemmstRepository.findByItemIdx(itemIdx);
            
            if (itemOpt.isPresent()) {
                ItemDto itemDto = convertItemToDto(itemOpt.get());
                return ResponseEntity.ok(itemDto);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            log.error("품목 상세 조회 실패 - itemIdx: {}", itemIdx, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 품목별 현재고량 조회 API
     */
    @GetMapping("{itemIdx}/stock")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getItemStock(@PathVariable Long itemIdx) {
        try {
            BigDecimal stockQty = inventoryRepository.getTotalStockByItemIdx(itemIdx);
            
            Map<String, Object> result = new HashMap<>();
            result.put("itemIdx", itemIdx);
            result.put("stockQty", stockQty != null ? stockQty.intValue() : 0);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("품목 재고량 조회 실패 - itemIdx: {}", itemIdx, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 품목 삭제
     */
    @DeleteMapping("delete")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteItems(@RequestBody List<Long> itemIds) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (itemIds == null || itemIds.isEmpty()) {
                result.put("success", false);
                result.put("message", "삭제할 품목을 선택해주세요.");
                return ResponseEntity.badRequest().body(result);
            }
            
            log.info("품목 삭제 요청 - itemIds: {}", itemIds);
            
            // 삭제 전 존재 여부 확인
            List<Itemmst> existingItems = itemmstRepository.findAllById(itemIds);
            if (existingItems.size() != itemIds.size()) {
                result.put("success", false);
                result.put("message", "일부 품목을 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(result);
            }
            
            // 삭제 실행
            itemmstRepository.deleteAllById(itemIds);
            
            result.put("success", true);
            result.put("message", "선택한 품목이 삭제되었습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("품목 삭제 실패", e);
            result.put("success", false);
            result.put("message", "삭제 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    /**
     * 엑셀 다운로드
     */
    @PostMapping("download-excel-details")
    @ResponseBody
    public ResponseEntity<Resource> downloadSelectedItemDetailsAsExcel(@RequestBody List<Long> itemIds) {
        try {
            if (itemIds == null || itemIds.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // 선택된 품목들의 상세 정보 조회
            List<Itemmst> items = itemmstRepository.findAllById(itemIds);
            
            // 엑셀 파일 생성
            ByteArrayOutputStream outputStream = createItemExcel(items);
            
            String fileName = "품목상세정보_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
            
        } catch (Exception e) {
            log.error("품목 엑셀 다운로드 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 거래처 목록 조회
     */
    @GetMapping("customers")
    @ResponseBody
    public ResponseEntity<List<CustomerForItemDto>> getCustomers() {
        try {
            List<CustomerForItemDto> customers = itemmstRepository.findAllCustomers();
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            log.error("거래처 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 대분류 목록 조회
     */
    @GetMapping("categories/parent")
    @ResponseBody
    public ResponseEntity<List<CatDto>> getParentCategories() {
        try {
            List<CatDto> categories = itemmstRepository.findAllParentCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("대분류 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 소분류 목록 조회
     */
    @GetMapping("categories/children/{parentIdx}")
    @ResponseBody
    public ResponseEntity<List<CatDto>> getChildCategories(@PathVariable Long parentIdx) {
        try {
            List<CatDto> categories = itemmstRepository.findChildCategoriesByParentIdx(parentIdx);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("소분류 목록 조회 실패 - parentIdx: {}", parentIdx, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 단위 목록 조회
     */
    @GetMapping("units")
    @ResponseBody
    public ResponseEntity<List<UnitForItemDto>> getUnits() {
        try {
            List<UnitForItemDto> units = itemmstRepository.findAllUnits();
            return ResponseEntity.ok(units);
        } catch (Exception e) {
            log.error("단위 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== 헬퍼 메서드들 ==========

    /**
     * 정렬 필드 매핑
     */
    private String mapSortField(String sort) {
        return switch (sort) {
            case "itemNm" -> "itemNm";
            case "itemCd" -> "itemCd";
            case "itemCat1Nm" -> "CatDto1.catNm";
            case "itemCat2Nm" -> "CatDto2.catNm";
            case "custNm" -> "CustomerForItemDto.custNm";
            case "unitNm" -> "UnitForItemDto.unitNm";
            case "itemCost" -> "itemCost";
            case "qty" -> "itemNm"; // 재고량은 계산 필드이므로 품목명으로 대체
            default -> "itemNm";
        };
    }

    /**
     * 검색 카테고리 매핑
     */
    private String mapSearchCategory(String searchCat) {
        if (searchCat == null || searchCat.trim().isEmpty()) {
            return null;
        }
        
        return switch (searchCat.trim()) {
            case "ItemName" -> "ItemName";
            case "itemCd" -> "itemCd";
            case "custNm" -> "custNm";
            case "itemBigCat" -> "itemBigCat";
            case "itemSmallCat" -> "itemSmallCat";
            default -> null;
        };
    }

    /**
     * 품목별 재고량 맵 조회 (성능 최적화)
     */
    private Map<Long, BigDecimal> getStockQtyMap(List<Long> itemIds) {
        if (itemIds.isEmpty()) {
            return new HashMap<>();
        }
        
        List<Object[]> stockData = inventoryRepository.sumStockQtyByItemIds(itemIds);
        Map<Long, BigDecimal> stockQtyMap = new HashMap<>();
        
        for (Object[] data : stockData) {
            Long itemIdx = (Long) data[0];
            BigDecimal stockQty = (BigDecimal) data[1];
            stockQtyMap.put(itemIdx, stockQty);
        }
        
        return stockQtyMap;
    }

 // ItemController.java - convertItemToDto 메서드를 다음과 같이 수정하세요

    /**
     * Itemmst Entity를 ItemDto로 변환 (Hibernate Proxy 문제 해결)
     */
    private ItemDto convertItemToDto(Itemmst item) {
        ItemDto dto = new ItemDto();
        
        // 기본 필드 설정
        dto.setItemIdx(item.getItemIdx());
        dto.setItemCd(item.getItemCd());
        dto.setItemNm(item.getItemNm());
        dto.setItemSpec(item.getItemSpec());
        dto.setItemFlag(item.getItemFlag());
        dto.setItemCost(item.getItemCost());
        dto.setOptimalInv(item.getOptimalInv());
        dto.setRemark(item.getRemark());
        
        // 연관관계 데이터 안전하게 매핑 (Hibernate.unproxy 사용)
        if (item.getCustomerForItemDto() != null) {
            CustomerForItemDto customer = (CustomerForItemDto) Hibernate.unproxy(item.getCustomerForItemDto());
            // 새 CustomerForItemDto 객체 생성하여 필요한 필드만 복사
            CustomerForItemDto customerDto = new CustomerForItemDto();
            customerDto.setCustIdx(customer.getCustIdx());
            customerDto.setCustNm(customer.getCustNm());
            dto.setCustomerForItemDto(customerDto);
        }
        
        if (item.getCatDto1() != null) {
            CatDto cat1 = (CatDto) Hibernate.unproxy(item.getCatDto1());
            CatDto cat1Dto = new CatDto();
            cat1Dto.setCatIdx(cat1.getCatIdx());
            cat1Dto.setCatNm(cat1.getCatNm());
            dto.setCatDto1(cat1Dto);
        }
        
        if (item.getCatDto2() != null) {
            CatDto cat2 = (CatDto) Hibernate.unproxy(item.getCatDto2());
            CatDto cat2Dto = new CatDto();
            cat2Dto.setCatIdx(cat2.getCatIdx());
            cat2Dto.setCatNm(cat2.getCatNm());
            dto.setCatDto2(cat2Dto);
        }
        
        if (item.getUnitForItemDto() != null) {
            UnitForItemDto unit = (UnitForItemDto) Hibernate.unproxy(item.getUnitForItemDto());
            UnitForItemDto unitDto = new UnitForItemDto();
            unitDto.setUnitIdx(unit.getUnitIdx());
            unitDto.setUnitNm(unit.getUnitNm());
            dto.setUnitForItemDto(unitDto);
        }
        
        return dto;
    }

    /**
     * Itemmst Entity를 ItemDto로 변환 (재고량 포함)
     */
    private ItemDto convertItemToDtoWithStock(Itemmst item, Map<Long, BigDecimal> stockQtyMap) {
        ItemDto dto = convertItemToDto(item);
        
        // 재고량 설정 (맵에서 조회)
        BigDecimal stockQty = stockQtyMap.getOrDefault(item.getItemIdx(), BigDecimal.ZERO);
        // ItemDto에 currentQty 필드가 있다면 설정
        // dto.setCurrentQty(stockQty.intValue());
        
        return dto;
    }

    /**
     * 현재고량 계산
     */
    private int calculateCurrentQty(Itemmst item) {
        BigDecimal stockQty = inventoryRepository.getTotalStockByItemIdx(item.getItemIdx());
        return stockQty != null ? stockQty.intValue() : 0;
    }

    /**
     * 엑셀 파일 생성
     */
    private ByteArrayOutputStream createItemExcel(List<Itemmst> items) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("품목 상세 정보");
        
        // 헤더 스타일
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);
        
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        
        // 데이터 스타일
        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);
        
        // 헤더 생성
        Row headerRow = sheet.createRow(0);
        String[] headers = {"품목코드", "품목명", "분류", "규격", "대분류", "소분류", "거래처", "단위", "단가", "적정재고", "현재고", "비고"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // 데이터 생성
        int rowNum = 1;
        for (Itemmst item : items) {
            Row row = sheet.createRow(rowNum++);
            
            int colNum = 0;
            
            // 품목코드
            Cell cell = row.createCell(colNum++);
            cell.setCellValue(item.getItemCd() != null ? item.getItemCd() : "");
            cell.setCellStyle(dataStyle);
            
            // 품목명
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getItemNm() != null ? item.getItemNm() : "");
            cell.setCellStyle(dataStyle);
            
            // 분류 (자재/품목)
            cell = row.createCell(colNum++);
            String flagName = "";
            if ("01".equals(item.getItemFlag())) flagName = "자재";
            else if ("02".equals(item.getItemFlag())) flagName = "품목";
            cell.setCellValue(flagName);
            cell.setCellStyle(dataStyle);
            
            // 규격
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getItemSpec() != null ? item.getItemSpec() : "");
            cell.setCellStyle(dataStyle);
            
            // 대분류
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getCatDto1() != null ? item.getCatDto1().getCatNm() : "");
            cell.setCellStyle(dataStyle);
            
            // 소분류
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getCatDto2() != null ? item.getCatDto2().getCatNm() : "");
            cell.setCellStyle(dataStyle);
            
            // 거래처
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getCustomerForItemDto() != null ? item.getCustomerForItemDto().getCustNm() : "");
            cell.setCellStyle(dataStyle);
            
            // 단위
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getUnitForItemDto() != null ? item.getUnitForItemDto().getUnitNm() : "");
            cell.setCellStyle(dataStyle);
            
            // 단가
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getItemCost() != null ? item.getItemCost() : 0);
            cell.setCellStyle(dataStyle);
            
            // 적정재고
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getOptimalInv() != null ? item.getOptimalInv() : 0);
            cell.setCellStyle(dataStyle);
            
            // 현재고 (별도 Repository에서 조회)
            cell = row.createCell(colNum++);
            int currentQty = calculateCurrentQty(item);
            cell.setCellValue(currentQty);
            cell.setCellStyle(dataStyle);
            
            // 비고
            cell = row.createCell(colNum++);
            cell.setCellValue(item.getRemark() != null ? item.getRemark() : "");
            cell.setCellStyle(dataStyle);
        }
        
        // 컬럼 너비 자동 조정
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream;
    }
    
    /**
     * Datalist용 활성 품목 목록 조회 API입니다.
     * 특정 거래처 ID(custIdx)가 제공되면 해당 거래처의 품목만, 없으면 전체 (활성) 품목을 반환합니다.
     * JavaScript(`inbound.js`)에서 /api/items/active-for-selection 경로로 호출됩니다.
     * @param custIdx 거래처 ID (선택 사항)
     * @return ItemForSelectionDto 리스트
     */
    @GetMapping("/active-for-selection")
    public ResponseEntity<List<ItemForSelectionDto>> getActiveItemsForSelection(
            @RequestParam(name = "custIdx", required = false) Long custIdx
    ) {
        List<ItemForSelectionDto> items = itemService.findActiveItemsForSelection(custIdx);

        if (items == null || items.isEmpty()) {
            // 데이터가 없을 경우 HTTP 204 No Content 응답
            return ResponseEntity.noContent().build();
        }
        // 데이터가 있으면 HTTP 200 OK 와 함께 품목 목록 반환
        return ResponseEntity.ok(items);
    }

    // 발주 품목(원자재)만 조회 -민섭
    @GetMapping("/purchase-itemlist")
    public  ResponseEntity<List<ItemForSelectionDto>> getActiveItemsForPurchase(){
    	List<ItemForSelectionDto> activeItems = itemService.findActiveItems("01");
    	return ResponseEntity.ok(activeItems);
    }
}