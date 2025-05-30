package kr.co.d_erp.controllers;

import kr.co.d_erp.domain.Custmst;
import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.CustomerForSelectionDto;
import kr.co.d_erp.service.CustmstService;
import lombok.RequiredArgsConstructor;


import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class CustomerController {

	private final CustmstService custmstService;

	@GetMapping("/api/customer/{bizFlag}")
	public Page<Custmst> getCustomers(@PathVariable String bizFlag, @RequestParam String sortBy,
			@RequestParam String sortDirection, @RequestParam(required = false) String keyword,
			@RequestParam(defaultValue = "0") int page) {
		return custmstService.getCustomers(bizFlag, sortBy, sortDirection, keyword, page);
	}

	// 상세 보기
	@GetMapping("/api/customer/detail/{id}")
	public ResponseEntity<Custmst> getCustomerById(@PathVariable("id") Long id) {
		Optional<Custmst> customer = custmstService.getCustomerById(id);
		return customer.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
	}

	// 거래처 정보 수정
	@PutMapping("/api/customer/update/{custIdx}")
	public ResponseEntity<Custmst> updateCustomer(@PathVariable("custIdx") Long custIdx,
			@RequestBody Custmst updatedCust) {
		Custmst savedCust = custmstService.updateCustomer(custIdx, updatedCust);
		return ResponseEntity.ok(savedCust);
	}

	// 거래처 등록
	@PostMapping("/api/customer/save")
	public ResponseEntity<?> saveCustomer(@RequestBody Custmst customer) {
		try {
			Custmst savedCustomer = custmstService.saveCustomer(customer);
			return ResponseEntity.ok(savedCustomer);
		} catch (Exception e) {
			System.out.println(e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("등록 중 오류가 발생했습니다.");
		}
	}

	// 거래처 삭제
	@DeleteMapping("/api/customer/delete")
	public ResponseEntity<?> deleteCustomers(@RequestBody List<Long> ids) {
		try {
			ids.forEach(custmstService::deleteCustomer);
			return ResponseEntity.noContent().build();
		} catch (DataIntegrityViolationException e) {
			if (e.getMessage() != null && e.getMessage().contains("ORA-02292")) {
				return ResponseEntity.status(HttpStatus.CONFLICT).body("품목들을 먼저 삭제해주세요.");
			}
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 중 오류가 발생했습니다.");
		}
	}

	// 거래처 이름 목록 받아오기 (bizFlag = 02)
	@GetMapping("/api/customers/names")
	public List<CustomerDTO> getCustomerNames() {
		return custmstService.getCustomerNamesWithCode("02");
	}

	// Datalist용 거래처 정보 조회 API
	@GetMapping("/api/customers/active-for-selection")
	public ResponseEntity<List<CustomerForSelectionDto>> getActiveCustomersForDatalist(
			@RequestParam(name = "bizFlag", defaultValue = "01") String bizFlag) {
		List<CustomerForSelectionDto> customers = custmstService.findActiveCustomersForSelection(bizFlag);
		if (customers == null || customers.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(customers);
	}
	
	@GetMapping("/api/customers/excel")
	public ResponseEntity<byte[]> exportSaleExcel() throws IOException {
		byte[] excelData = custmstService.generateExcel();
		
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales-data.xlsx")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(excelData);
	}
	
	@GetMapping("/api/customers/print")
	public List<Custmst> printCustomers(@RequestParam List<Long> ids) {
	    return custmstService.getCustomersByIds(ids);
	}
}
