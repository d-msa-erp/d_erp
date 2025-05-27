package kr.co.d_erp.controllers;

import java.util.List;

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

import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.dtos.WhmstDto;
import kr.co.d_erp.dtos.WarehouseInventoryDetailDto; // 창고 재고 상세 DTO import
import kr.co.d_erp.service.WhmstService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WhmstController {

	private final WhmstService whmstService;

	/**
	 * 창고 목록 조회 API
	 * 
	 * @param sortBy        정렬 기준
	 * @param sortDirection 정렬 방향
	 * @param keyword       검색어
	 * @return 창고 DTO 목록
	 */
	@GetMapping
	public ResponseEntity<List<WhmstDto>> getWarehouses(@RequestParam(defaultValue = "whIdx") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection, @RequestParam(required = false) String keyword) {
		List<WhmstDto> warehouses = whmstService.findAllWarehouses(sortBy, sortDirection, keyword);
		return ResponseEntity.ok(warehouses);
	}

	/**
	 * 단일 창고 상세 조회 API
	 * 
	 * @param whIdx 창고 고유 번호
	 * @return 창고 DTO
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
	 * 신규 창고 등록 API
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
	 * 창고 수정 API
	 * 
	 * @param whIdx    수정할 창고 고유 번호
	 * @param whmstDto 업데이트할 창고 정보 DTO
	 * @return 업데이트된 창고 정보 DTO
	 */
	@PutMapping("/{whIdx}")
	public ResponseEntity<WhmstDto> updateWarehouse(@PathVariable Long whIdx, @RequestBody WhmstDto whmstDto) {
		WhmstDto updatedWhmst = whmstService.updateWhmst(whIdx, whmstDto);
		return ResponseEntity.ok(updatedWhmst);
	}

	/**
	 * 창고 삭제 API
	 * 
	 * @param whIdxes 삭제할 창고 고유 번호 목록
	 * @return 응답 없음 (성공 시)
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteWarehouses(@RequestBody List<Long> whIdxes) {
		whmstService.deleteWhmsts(whIdxes);
		return ResponseEntity.noContent().build();
	}

	/**
	 * 활성 상태인 사용자 목록을 가져오는 API (담당자 드롭다운용)
	 * 
	 * @return 활성 사용자 Entity 목록
	 */
	@GetMapping("/users/active-for-selection")
	public ResponseEntity<List<Usermst>> getActiveUsersForSelection() {
		List<Usermst> activeUsers = whmstService.getActiveUsersForSelection();
		return ResponseEntity.ok(activeUsers);

	}

	// ⭐ 창고 상세 재고 정보 조회 API 추가 ⭐

	/**
	 * 특정 창고의 상세 재고 정보를 조회하는 API (창고 ID로 조회) GET
	 * /api/warehouses/{whIdx}/inventory-details
	 * 
	 * @param whIdx 창고 고유 번호
	 * @return 해당 창고의 재고 상세 정보 DTO 목록
	 */
	@GetMapping("/{whIdx}/inventory-details")
	public ResponseEntity<List<WarehouseInventoryDetailDto>> getWarehouseInventoryDetailsByWhIdx(
			@PathVariable Long whIdx) {
		List<WarehouseInventoryDetailDto> details = whmstService.getWarehouseInventoryDetailsByWhIdx(whIdx);
		if (details.isEmpty()) {
			// 재고가 없거나 창고가 없으면 404 또는 204 반환
			// 여기서는 재고가 없는 경우 빈 리스트를 반환하므로 200 OK with empty list가 적절할 수 있음.
			// 하지만 특정 창고 자체를 찾을 수 없는 경우 404가 더 명확
			return ResponseEntity.ok(details); // 빈 리스트도 OK로 처리
		}
		return ResponseEntity.ok(details);
	}

	/**
	 * 특정 창고의 상세 재고 정보를 조회하는 API (창고 코드로 조회) GET
	 * /api/warehouses/code/{whCd}/inventory-details
	 * 
	 * @param whCd 창고 코드
	 * @return 해당 창고의 재고 상세 정보 DTO 목록
	 */
	@GetMapping("/code/{whCd}/inventory-details")
	public ResponseEntity<List<WarehouseInventoryDetailDto>> getWarehouseInventoryDetailsByWhCd(
			@PathVariable String whCd) {
		List<WarehouseInventoryDetailDto> details = whmstService.getWarehouseInventoryDetailsByWhCd(whCd);
		if (details.isEmpty()) {
			return ResponseEntity.ok(details); // 빈 리스트도 OK로 처리
		}
		return ResponseEntity.ok(details);
	}

	/**
	 * 모든 창고의 상세 재고 정보를 조회하는 API GET /api/warehouses/inventory-details/all
	 * 
	 * @return 모든 창고의 재고 상세 정보 DTO 목록
	 */
	@GetMapping("/inventory-details/all")
	public ResponseEntity<List<WarehouseInventoryDetailDto>> getAllWarehouseInventoryDetails() {
		List<WarehouseInventoryDetailDto> details = whmstService.getAllWarehouseInventoryDetails();
		if (details.isEmpty()) {
			return ResponseEntity.noContent().build(); // 내용 없음
		}
		return ResponseEntity.ok(details);
	}

	// === Datalist용 활성 창고 목록 조회 API (추가된 부분) ===
	/**
	 * Datalist에 사용될 활성 상태의 창고 목록을 조회합니다. JavaScript(`inbound.js`)에서
	 * /api/warehouses/active-for-selection 경로로 호출합니다.
	 * 
	 * @return 활성 창고 WhmstDto 목록
	 */
	@GetMapping("/active-for-selection")
	public ResponseEntity<List<WhmstDto>> getActiveWarehousesForDatalist() {
		List<WhmstDto> warehouses = whmstService.findActiveWarehousesForSelection();
		if (warehouses == null || warehouses.isEmpty()) {
			return ResponseEntity.noContent().build(); // 데이터가 없으면 204 No Content 응답
		}
		return ResponseEntity.ok(warehouses);
	}
}