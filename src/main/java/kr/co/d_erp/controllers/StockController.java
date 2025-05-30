package kr.co.d_erp.controllers;


import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;

import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.StockDto;
import kr.co.d_erp.dtos.StockForResponseDto;
import kr.co.d_erp.dtos.StockRequestDto;
import kr.co.d_erp.dtos.UnitDto;
import kr.co.d_erp.dtos.WhmstDto;
import kr.co.d_erp.service.StockService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

	private final StockService stockService;
	
	
	 //TB_ITEMMST 데이터 조회
	@GetMapping("/item-basics") // 요청 경로 예시: /api/stocks/item-basics
	public ResponseEntity<List<StockForResponseDto>> getAllItemForStockApi() {
	    List<StockForResponseDto> items = stockService.getAllItemForStock();
	    return ResponseEntity.ok(items);
	}
	
	 //재고 조회
	 @GetMapping
	 public ResponseEntity<Page<StockDto>> getItems(
	            @RequestParam(required = false) String itemFlagFilter, // 품목 구분 (자재/품목)
	            @RequestParam(required = false) String searchKeyword,   // 검색어 (JS에서는 searchKeyword로 보낼 수 있음)
	            @PageableDefault(size = 10) Pageable pageable) { // 정렬은 프론트에서 처리하거나, 여기서 기본 정렬 지정 가능

	        // JavaScript에서 searchKeyword로 보낸다면 여기서 CsearchItem으로 받도록 통일
	        Page<StockDto> itemsPage = stockService.getInventoryList(itemFlagFilter, searchKeyword, pageable);
	        
	        return ResponseEntity.ok().body(itemsPage);
	    }
	 
	 //단위 목록
	 @GetMapping("/unit") // 요청 경로: /api/stocks/unit
	    public ResponseEntity<List<UnitDto>> getAllUnitsApi() {
	        List<UnitDto> units = stockService.getAllUnits();
	        return ResponseEntity.ok(units);
	    }
	 
	 //매입처 목록
	 @GetMapping("/cust") // 요청 경로: /api/stocks/cust
	    public ResponseEntity<List<CustomerDTO>> getCustomersByBizFlagApi(
	            @RequestParam(name = "bizFlag") String bizFlag) {
	        List<CustomerDTO> customers = stockService.getCustomersByBizFlag(bizFlag);
	        return ResponseEntity.ok(customers);
	    }
	 
		
		  @PostMapping 
		  public ResponseEntity<StockDto> createStockItem(@RequestBody StockRequestDto requestDto) { 
			  StockDto createdStockDto = stockService.createInventoryDirectly(requestDto); 
			  return ResponseEntity.status(HttpStatus.CREATED).body(createdStockDto); 
		 }
		  
		  @PutMapping("/{invIdx}") // 요청 경로 예: /api/stocks/101 public
		  ResponseEntity<StockDto> updateStockItem(@PathVariable Long invIdx, // URL 경로에서 itemIdx 값을 추출
				  @RequestBody StockRequestDto requestDto) { // 요청 본문에서 수정 데이터를 추출 StockDto
		  StockDto updatedStockDto = stockService.updateStockItem(invIdx, requestDto); 
		  return ResponseEntity.ok(updatedStockDto); 
		  }
		 
	 
	 @GetMapping("/wh") // 요청 경로: /api/stocks/wh
	    public ResponseEntity<List<WhmstDto>> getAllWarehousesApi() {
	        List<WhmstDto> warehouses = stockService.getAllWarehouses();
	        return ResponseEntity.ok(warehouses);
	    }
	 
	 @DeleteMapping("/delete") // 또는 @PostMapping("/inventories/delete-batch")
	    public ResponseEntity<String> deleteInventories(@RequestBody List<Long> invIdxs) {
	        try {
	            stockService.deleteInventories(invIdxs);
	            return ResponseEntity.ok(invIdxs.size() + "개의 재고 항목이 삭제되었습니다.");
	        } catch (IllegalArgumentException e) {
	            return ResponseEntity.badRequest().body(e.getMessage());
	        } catch (Exception e) {
	            // Log aPÍ error
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("재고 삭제 중 오류가 발생했습니다.");
	        }
	    }
	 
	 
	    //엑셀 다운로드
	    @GetMapping("/excel")
	    public ResponseEntity<byte[]> downloadExcel(
	            @RequestParam(value = "CsearchCat", required = false, defaultValue = "") String CsearchCat,
	            @RequestParam(value = "CsearchItem", required = false, defaultValue = "") String CsearchItem) {
	        try {
	            byte[] excelContent = stockService.createExcelFile(CsearchCat, CsearchItem);
	            String fileName = "재고_리스트_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";
	            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString()).replaceAll("\\+", "%20");

	            HttpHeaders headers = new HttpHeaders();
	            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
	            headers.setContentDispositionFormData("attachment", encodedFileName);
	            headers.setContentLength(excelContent.length);

	            return new ResponseEntity<>(excelContent, headers, HttpStatus.OK);
	        } catch (IOException e) {
	            e.printStackTrace(); // 로깅 필요
	            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
	        }
	    }
}
