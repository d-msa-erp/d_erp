package kr.co.d_erp.service;


import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.repository.oracle.SalesRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalesService {
		
	private final SalesRepository salesRepository;
	
	
	
	public Page<SalesView> getSalesOrders(String orderType, String sortBy, String sortDirection, int page) {
	    Sort.Direction direction = Sort.Direction.fromString(sortDirection);
	    Pageable pageable = PageRequest.of(page, 10, Sort.by(direction, sortBy)); 

	    return salesRepository.findByOrderType(orderType, pageable);
	}
	
	public Page<SalesView> getPurchaseOrders(String orderType, String sortBy, String sortDirection, int page) {
	    Sort.Direction direction = Sort.Direction.fromString(sortDirection);
	    Pageable pageable = PageRequest.of(page, 10, Sort.by(direction, sortBy)); // 페이지당 10개
	    return salesRepository.findByOrderType(orderType, pageable);
	}
    
	public Page<SalesView> searchItems(String searchTerm, String dateType, String startDateStr, String endDateStr, int page) {
	    Pageable pageable = PageRequest.of(page, 10);
	    LocalDate startDate = null;
	    LocalDate endDate = null;
	    try {
	        if (startDateStr != null && !startDateStr.isBlank()) {
	            startDate = LocalDate.parse(startDateStr); // yyyy-MM-dd 형식일 것
	        }
	        if (endDateStr != null && !endDateStr.isBlank()) {
	            endDate = LocalDate.parse(endDateStr);
	        }
	    } catch (DateTimeParseException e) {
	        throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다. yyyy-MM-dd 형식이어야 합니다.");
	    }
	    return salesRepository.searchWithDate(searchTerm, dateType, startDate, endDate, pageable);
	}
	
	
	 public byte[] generateExcelforPurchase() throws IOException {
		 	List<SalesView> salesList = salesRepository.findByOrderType("P");
	        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	        try (Workbook workbook = new XSSFWorkbook()) {
	            Sheet sheet = workbook.createSheet("주문목록");

	            // 헤더 작성
	            Row header = sheet.createRow(0);
	            header.createCell(0).setCellValue("주문번호");
	            header.createCell(1).setCellValue("품목코드");
	            header.createCell(2).setCellValue("품목명");
	            header.createCell(3).setCellValue("거래처");
	            header.createCell(4).setCellValue("수량");
	            header.createCell(5).setCellValue("총액");
	            header.createCell(6).setCellValue("발주일");
	            header.createCell(7).setCellValue("납기일");

	            // 데이터 작성
	            int rowIdx = 1;
	            for (SalesView sale : salesList) {
	                Row row = sheet.createRow(rowIdx++);
	                row.createCell(0).setCellValue(sale.getOrderCode());
	                row.createCell(1).setCellValue(sale.getItemCode());
	                row.createCell(2).setCellValue(sale.getItemName());
	                row.createCell(3).setCellValue(sale.getCustomerName());
	                row.createCell(4).setCellValue(sale.getQuantity().toString());
	                row.createCell(5).setCellValue(sale.getTotalPrice());
	                row.createCell(6).setCellValue(sale.getOrderDate().format(formatter));
	                row.createCell(7).setCellValue(sale.getDeliveryDate().format(formatter));
	            }

	            // 엑셀 데이터를 바이트 배열로 반환
	            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
	                workbook.write(out);
	                return out.toByteArray();
	            }
	        }
	    }
	 
	 public byte[] generateExcelforSale() throws IOException {
			List<SalesView> salesList = salesRepository.findByOrderType("S");
	        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	        try (Workbook workbook = new XSSFWorkbook()) {
	            Sheet sheet = workbook.createSheet("주문목록");

	            // 헤더 작성
	            Row header = sheet.createRow(0);
	            header.createCell(0).setCellValue("주문번호");
	            header.createCell(1).setCellValue("품목코드");
	            header.createCell(2).setCellValue("품목명");
	            header.createCell(3).setCellValue("거래처");
	            header.createCell(4).setCellValue("수량");
	            header.createCell(5).setCellValue("총액");
	            header.createCell(6).setCellValue("착수일");
	            header.createCell(7).setCellValue("납기일");
	            header.createCell(8).setCellValue("주문상태");

	            // 데이터 작성
	            int rowIdx = 1;
	            for (SalesView sale : salesList) {
	                Row row = sheet.createRow(rowIdx++);
	                row.createCell(0).setCellValue(sale.getOrderCode());
	                row.createCell(1).setCellValue(sale.getItemCode());
	                row.createCell(2).setCellValue(sale.getItemName());
	                row.createCell(3).setCellValue(sale.getCustomerName());
	                row.createCell(4).setCellValue(sale.getQuantity().toString());
	                row.createCell(5).setCellValue(sale.getTotalPrice());
	                row.createCell(6).setCellValue(sale.getOrderDate().format(formatter));
	                row.createCell(7).setCellValue(sale.getDeliveryDate().format(formatter));
	                row.createCell(8).setCellValue(sale.getOrderStatus().equals("S1") ? "출고대기" : "출고완료");
	            }

	            // 엑셀 데이터를 바이트 배열로 반환
	            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
	                workbook.write(out);
	                return out.toByteArray();
	            }
	        }
	    }
}
