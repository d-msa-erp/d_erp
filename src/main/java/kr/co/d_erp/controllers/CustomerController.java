package kr.co.d_erp.controllers;

import kr.co.d_erp.domain.Custmst;
import kr.co.d_erp.dtos.CustomerForSelectionDto;
import kr.co.d_erp.service.CustmstService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class CustomerController {

	private final CustmstService custmstService;

	@GetMapping("/api/customer/{bizFlag}")
	public List<Custmst> getCustomers(@PathVariable("bizFlag") String bizFlag,
			@RequestParam(defaultValue = "custNm") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection, @RequestParam(required = false) String keyword) {

		return custmstService.getCustomers(bizFlag, sortBy, sortDirection, keyword);
	}

	// 상세 보기
	@GetMapping("/api/customer/detail/{id}")
	public ResponseEntity<Custmst> getCustomerById(@PathVariable("id") Long id) {
		Optional<Custmst> customer = custmstService.getCustomerById(id);
		return customer.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/api/customer/update/{custIdx}")
	public ResponseEntity<Custmst> updateCustomer(@PathVariable("custIdx") Long custIdx,
			@RequestBody Custmst updatedCust) {

		Custmst savedCust = custmstService.updateCustomer(custIdx, updatedCust);
		return ResponseEntity.ok(savedCust);
	}

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

	@DeleteMapping("/api/customer/delete")
	public ResponseEntity<?> deleteCustomers(@RequestBody List<Long> ids) {
		try {
			ids.forEach(custmstService::deleteCustomer);
			return ResponseEntity.noContent().build();
		} catch (DataIntegrityViolationException e) {
			// 거래처 품목이 남아있는 경우
			if (e.getMessage() != null && e.getMessage().contains("ORA-02292")) {
				return ResponseEntity.status(HttpStatus.CONFLICT).body("품목들을 먼저 삭제해주세요.");
			}
			// 기타 무결성 예외
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 중 오류가 발생했습니다.");
		}
	}

	// Datalist용 거래처 정보 조회 API
	// inbound.js에서 호출하는 경로와 일치시킴: /api/customers/active-for-selection
	@GetMapping("/api/customers/active-for-selection")
	public ResponseEntity<List<CustomerForSelectionDto>> getActiveCustomersForDatalist(
			@RequestParam(name = "bizFlag", defaultValue = "01") String bizFlag // 입고페이지 매입처('01')
	) {
		List<CustomerForSelectionDto> customers = custmstService.findActiveCustomersForSelection(bizFlag);
		if (customers == null || customers.isEmpty()) {
			return ResponseEntity.noContent().build(); // 데이터가 없으면 204 No Content
		}
		return ResponseEntity.ok(customers);
	}
}
