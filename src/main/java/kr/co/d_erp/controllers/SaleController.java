package kr.co.d_erp.controllers;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.service.SalesService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")  // 기본 경로
@RequiredArgsConstructor
public class SaleController {

	private final SalesService salesService;

	// 판매 조회 (S)
	@GetMapping("/sales")
	public Page<SalesView> getSalesOrders(
	        @RequestParam(defaultValue = "S") String orderType,
	        @RequestParam(defaultValue = "deliveryDate") String sortBy,
	        @RequestParam(defaultValue = "asc") String sortDirection,
	        @RequestParam(defaultValue = "0") int page // ✅ 페이지 파라미터 추가
	) {
	    return salesService.getSalesOrders(orderType, sortBy, sortDirection, page);
	}

	// 구매 발주 (P)
	@GetMapping("/purchases")
	public Page<SalesView> getPurchaseOrders(
	        @RequestParam(defaultValue = "P") String orderType,
	        @RequestParam(defaultValue = "deliveryDate") String sortBy,
	        @RequestParam(defaultValue = "asc") String sortDirection,
	        @RequestParam(defaultValue = "0") int page
	) {
	    return salesService.getPurchaseOrders(orderType, sortBy, sortDirection, page);
	}
	
	
	@GetMapping("/purchase/excel")
	public ResponseEntity<byte[]> exportPurchaseExcel() throws IOException {
	    byte[] excelData = salesService.generateExcelforPurchase();

	    return ResponseEntity.ok()
	        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=purchase-data.xlsx")
	        .contentType(MediaType.APPLICATION_OCTET_STREAM)
	        .body(excelData);
	}
	
	@GetMapping("/sale/excel")
	public ResponseEntity<byte[]> exportSaleExcel() throws IOException {
		byte[] excelData = salesService.generateExcelforSale();
		
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales-data.xlsx")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(excelData);
	}
	

	// 품목 검색 (검색 결과도 많을 수 있으므로 페이징 적용)
	@GetMapping("/search")
	public Page<SalesView> searchItems(
		    @RequestParam String searchTerm,
		    @RequestParam(defaultValue = "deliveryDate") String dateType,
		    @RequestParam(required = false) String startDate,
		    @RequestParam(required = false) String endDate,
		    @RequestParam(defaultValue = "0") int page
	) {
	    return salesService.searchItems(searchTerm, dateType, startDate, endDate, page);
	}
    
    
    @GetMapping("/getno")
    public Map<String, Object> getOrderNo() {
        int randomOrderNo = (int)(Math.random() * 90000000) + 10000000;

        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", randomOrderNo);
        return result;
    }
}