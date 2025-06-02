package kr.co.d_erp.controllers;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
	
	@GetMapping("/printsales")
	public List<SalesView> findSalesOrder(@RequestParam("id") List<Long> orderIdx) {
	    return salesService.findSlaesOrders(orderIdx);
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
	public ResponseEntity<byte[]> exportPurchaseExcel(@RequestParam List<Long> id) throws IOException {
	    byte[] excelData = salesService.generateExcelforPurchase(id);

	    String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
	    String fileName = "Purchase_" + timeStamp + ".xlsx";
	    String encodedFilename = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
	                                       .replaceAll("\\+", "%20");

	    HttpHeaders headers = new HttpHeaders();
	    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
	    headers.add(HttpHeaders.CONTENT_DISPOSITION,
	        "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename
	    );

	    return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
	}
	
	@GetMapping("/sale/excel")
	public ResponseEntity<byte[]> exportSaleExcel(@RequestParam List<Long> id) throws IOException {
		byte[] excelData = salesService.generateExcelforSale(id);
		
		String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
	    String fileName = "Sale_" + timeStamp + ".xlsx";
	    String encodedFilename = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
	                                       .replaceAll("\\+", "%20");

	    HttpHeaders headers = new HttpHeaders();
	    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
	    headers.add(HttpHeaders.CONTENT_DISPOSITION,
	        "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename
	    );

	    return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
	}
	

	// 품목 검색 (검색 결과도 많을 수 있으므로 페이징 적용)
	@GetMapping("/search")
	public Page<SalesView> searchSales(
		    @RequestParam(required = false) String searchTerm,
		    @RequestParam(required = false) String dateType,
		    @RequestParam(required = false) String startDate,
		    @RequestParam(required = false) String endDate,
		    @RequestParam(required = false) String transStatus,
		    @RequestParam(defaultValue = "0") int page) {
		return salesService.searchItems(searchTerm, dateType, startDate, endDate, transStatus, page);
	}
    
    
    @GetMapping("/getno")
    public Map<String, Object> getOrderNo() {
        int randomOrderNo = (int)(Math.random() * 90000000) + 10000000;

        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", randomOrderNo);
        return result;
    }
}