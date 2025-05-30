package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.StockDto;
import kr.co.d_erp.dtos.StockRequestDto;
import kr.co.d_erp.dtos.UnitDto;
import kr.co.d_erp.dtos.WhmstDto;
import kr.co.d_erp.service.StockService;
import lombok.RequiredArgsConstructor;

/**
 * 재고 관리 REST API 컨트롤러
 * 재고 조회, 등록, 수정 및 관련 기준 정보 조회 기능을 제공합니다.
 */
@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

	private final StockService stockService;

	/**
	 * 재고 목록을 페이징하여 조회합니다.
	 * @param itemFlagFilter 품목 구분 필터 (자재/제품)
	 * @param searchKeyword 검색어
	 * @param pageable 페이징 정보 (기본 사이즈: 10)
	 * @return 페이징된 재고 목록
	 */
	@GetMapping
	public ResponseEntity<Page<StockDto>> getItems(
			@RequestParam(required = false) String itemFlagFilter,
			@RequestParam(required = false) String searchKeyword,
			@PageableDefault(size = 10) Pageable pageable) {

		Page<StockDto> itemsPage = stockService.getInventoryList(itemFlagFilter, searchKeyword, pageable);
		return ResponseEntity.ok().body(itemsPage);
	}

	/**
	 * 단위 목록을 조회합니다.
	 * @return 모든 단위 목록
	 */
	@GetMapping("/unit")
	public ResponseEntity<List<UnitDto>> getAllUnitsApi() {
		List<UnitDto> units = stockService.getAllUnits();
		return ResponseEntity.ok(units);
	}

	/**
	 * 사업 유형별 거래처 목록을 조회합니다.
	 * @param bizFlag 사업 유형 구분
	 * @return 해당 사업 유형의 거래처 목록
	 */
	@GetMapping("/cust")
	public ResponseEntity<List<CustomerDTO>> getCustomersByBizFlagApi(
			@RequestParam(name = "bizFlag") String bizFlag) {
		List<CustomerDTO> customers = stockService.getCustomersByBizFlag(bizFlag);
		return ResponseEntity.ok(customers);
	}

	/**
	 * 새로운 재고 품목을 등록합니다.
	 * @param requestDto 등록할 재고 품목 정보
	 * @return 등록된 재고 품목 정보
	 */
	@PostMapping
	public ResponseEntity<StockDto> createStockItem(@RequestBody StockRequestDto requestDto) {
		StockDto createdStockDto = stockService.createStockItem(requestDto);
		return ResponseEntity.status(HttpStatus.CREATED).body(createdStockDto);
	}

	/**
	 * 기존 재고 품목 정보를 수정합니다.
	 * @param itemIdx 수정할 품목 ID
	 * @param requestDto 수정할 재고 품목 정보
	 * @return 수정된 재고 품목 정보
	 */
	@PutMapping("/{itemIdx}")
	public ResponseEntity<StockDto> updateStockItem(
			@PathVariable Long itemIdx,
			@RequestBody StockRequestDto requestDto) {
		StockDto updatedStockDto = stockService.updateStockItem(itemIdx, requestDto);
		return ResponseEntity.ok(updatedStockDto);
	}

	/**
	 * 모든 창고 목록을 조회합니다.
	 * @return 모든 창고 목록
	 */
	@GetMapping("/wh")
	public ResponseEntity<List<WhmstDto>> getAllWarehousesApi() {
		List<WhmstDto> warehouses = stockService.getAllWarehouses();
		return ResponseEntity.ok(warehouses);
	}
}