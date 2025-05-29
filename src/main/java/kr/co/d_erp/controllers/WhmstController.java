package kr.co.d_erp.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

import jakarta.validation.Valid;
import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.StockTransferRequestDto;
import kr.co.d_erp.dtos.WhmstDto;
import kr.co.d_erp.dtos.WarehouseInventoryDetailDto;
import kr.co.d_erp.service.WhmstService;
import lombok.RequiredArgsConstructor;

/**
 * 창고 관리 REST API 컨트롤러
 * 창고 CRUD, 재고 조회, 창고간 재고 이동 등의 기능을 제공합니다.
 */
@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WhmstController {

	private final WhmstService whmstService;

	/**
	 * 창고간 재고 이동을 처리합니다.
	 * 
	 * @param fromWhIdx 출발 창고 ID
	 * @param request 창고 이동 요청 정보 (목적지 창고 ID, 이동할 재고 목록 등)
	 * @return 이동 처리 결과 메시지
	 */
	@PostMapping("/{fromWhIdx}/transfer-stock")
	public ResponseEntity<Map<String, String>> transferStock(
			@PathVariable Long fromWhIdx,
			@RequestBody @Valid StockTransferRequestDto request) {

		Map<String, String> response = new HashMap<>();

		try {
			// 기본 유효성 검사
			if (fromWhIdx == null || request.getToWhIdx() == null) {
				response.put("message", "창고 정보가 올바르지 않습니다");
				response.put("status", "error");
				return ResponseEntity.badRequest().body(response);
			}

			if (request.getItems() == null || request.getItems().isEmpty()) {
				response.put("message", "이동할 재고가 선택되지 않았습니다");
				response.put("status", "error");
				return ResponseEntity.badRequest().body(response);
			}

			// 창고 이동 처리
			String result = whmstService.transferStock(fromWhIdx, request);

			response.put("message", result != null ? result : "창고 이동이 완료되었습니다");
			response.put("status", "success");
			return ResponseEntity.ok(response);

		} catch (RuntimeException e) {
			response.put("message", "창고 이동 처리 중 오류가 발생했습니다: " + e.getMessage());
			response.put("status", "error");
			return ResponseEntity.badRequest().body(response);
		} catch (Exception e) {
			response.put("message", "서버 오류가 발생했습니다: " + e.getMessage());
			response.put("status", "error");
			return ResponseEntity.status(500).body(response);
		}
	}

	/**
	 * 창고 목록을 페이징하여 조회합니다.
	 * 
	 * @param page 페이지 번호 (1부터 시작, 기본값: 1)
	 * @param size 페이지 크기 (기본값: 10)
	 * @param sortBy 정렬 기준 컬럼 (기본값: whIdx)
	 * @param sortDirection 정렬 방향 (asc/desc, 기본값: asc)
	 * @param keyword 검색어 (창고 코드, 창고명 등으로 검색)
	 * @return 페이징된 창고 DTO 목록
	 */
	@GetMapping
	public ResponseEntity<PageDto<WhmstDto>> getWarehouses(
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(defaultValue = "whIdx") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection,
			@RequestParam(required = false) String keyword) {

		PageDto<WhmstDto> warehouses = whmstService.findAllWarehouses(page, size, sortBy, sortDirection, keyword);
		return ResponseEntity.ok(warehouses);
	}

	/**
	 * 특정 창고의 상세 정보를 조회합니다.
	 * 
	 * @param whIdx 창고 고유 번호
	 * @return 창고 상세 정보 DTO
	 */
	@GetMapping("/{whIdx}")
	public ResponseEntity<WhmstDto> getWarehouseById(@PathVariable Long whIdx) {
		WhmstDto warehouse = whmstService.getWhmstById(whIdx);
		if (warehouse == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(warehouse);
	}

	/**
	 * 신규 창고를 등록합니다.
	 * 
	 * @param whmstDto 등록할 창고 정보 DTO
	 * @return 등록된 창고 정보 DTO
	 */
	@PostMapping
	public ResponseEntity<WhmstDto> createWarehouse(@RequestBody WhmstDto whmstDto) {
		WhmstDto createdWhmst = whmstService.createWhmst(whmstDto);
		return ResponseEntity.ok(createdWhmst);
	}

	/**
	 * 기존 창고 정보를 수정합니다.
	 * 
	 * @param whIdx 수정할 창고 고유 번호
	 * @param whmstDto 업데이트할 창고 정보 DTO
	 * @return 업데이트된 창고 정보 DTO
	 */
	@PutMapping("/{whIdx}")
	public ResponseEntity<WhmstDto> updateWarehouse(@PathVariable Long whIdx, @RequestBody WhmstDto whmstDto) {
		WhmstDto updatedWhmst = whmstService.updateWhmst(whIdx, whmstDto);
		return ResponseEntity.ok(updatedWhmst);
	}

	/**
	 * 선택한 창고들을 일괄 삭제합니다.
	 * 
	 * @param whIdxes 삭제할 창고 고유 번호 목록
	 * @return 204 No Content (성공 시)
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteWarehouses(@RequestBody List<Long> whIdxes) {
		whmstService.deleteWhmsts(whIdxes);
		return ResponseEntity.noContent().build();
	}

	/**
	 * 활성 상태인 사용자 목록을 조회합니다 (담당자 선택용).
	 * 
	 * @return 활성 사용자 엔티티 목록
	 */
	@GetMapping("/users/active-for-selection")
	public ResponseEntity<List<Usermst>> getActiveUsersForSelection() {
		List<Usermst> activeUsers = whmstService.getActiveUsersForSelection();
		return ResponseEntity.ok(activeUsers);
	}

	/**
	 * 특정 창고의 재고 상세 정보를 조회합니다 (창고 ID로 조회).
	 * 
	 * @param whIdx 창고 고유 번호
	 * @return 해당 창고의 재고 상세 정보 DTO 목록
	 */
	@GetMapping("/{whIdx}/inventory-details")
	public ResponseEntity<List<WarehouseInventoryDetailDto>> getWarehouseInventoryDetailsByWhIdx(
			@PathVariable Long whIdx) {
		List<WarehouseInventoryDetailDto> details = whmstService.getWarehouseInventoryDetailsByWhIdx(whIdx);
		return ResponseEntity.ok(details);
	}

	/**
	 * 특정 창고의 재고 상세 정보를 조회합니다 (창고 코드로 조회).
	 * 
	 * @param whCd 창고 코드
	 * @return 해당 창고의 재고 상세 정보 DTO 목록
	 */
	@GetMapping("/code/{whCd}/inventory-details")
	public ResponseEntity<List<WarehouseInventoryDetailDto>> getWarehouseInventoryDetailsByWhCd(
			@PathVariable String whCd) {
		List<WarehouseInventoryDetailDto> details = whmstService.getWarehouseInventoryDetailsByWhCd(whCd);
		return ResponseEntity.ok(details);
	}

	/**
	 * 모든 창고의 재고 상세 정보를 조회합니다.
	 * 
	 * @return 모든 창고의 재고 상세 정보 DTO 목록
	 */
	@GetMapping("/inventory-details/all")
	public ResponseEntity<List<WarehouseInventoryDetailDto>> getAllWarehouseInventoryDetails() {
		List<WarehouseInventoryDetailDto> details = whmstService.getAllWarehouseInventoryDetails();
		if (details.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(details);
	}

	/**
	 * 활성 상태의 창고 목록을 조회합니다 (드롭다운/선택용).
	 * 
	 * @return 활성 창고 DTO 목록
	 */
	@GetMapping("/active-for-selection")
	public ResponseEntity<List<WhmstDto>> getActiveWarehousesForSelection() {
		List<WhmstDto> warehouses = whmstService.findActiveWarehousesForSelection();
		if (warehouses == null || warehouses.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(warehouses);
	}
}