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
import jakarta.validation.ValidationException;
import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.StockTransferRequestDto;
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
     * 창고간 재고 이동 API
     * 
     * @param fromWhIdx 출발 창고 ID
     * @param request 창고 이동 요청 정보
     * @return 이동 처리 결과
     */
	@PostMapping("/{fromWhIdx}/transfer-stock")
	public ResponseEntity<Map<String, String>> transferStock(
	        @PathVariable Long fromWhIdx, 
	        @RequestBody @Valid StockTransferRequestDto request) {
	    
	    System.out.println("=== 창고 이동 요청 시작 ===");
	    System.out.println("fromWhIdx: " + fromWhIdx);
	    System.out.println("toWhIdx: " + request.getToWhIdx());
	    System.out.println("items count: " + (request.getItems() != null ? request.getItems().size() : 0));
	    
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
	        
	        // 서비스 호출을 try-catch로 감싸서 트랜잭션 예외 처리
	        String result;
	        try {
	            result = whmstService.transferStock(fromWhIdx, request);
	        } catch (RuntimeException e) {
	            System.out.println("서비스에서 RuntimeException 발생: " + e.getMessage());
	            e.printStackTrace();
	            
	            response.put("message", "창고 이동 처리 중 오류가 발생했습니다: " + e.getMessage());
	            response.put("status", "error");
	            return ResponseEntity.badRequest().body(response);
	        }
	        
	        response.put("message", result != null ? result : "창고 이동이 완료되었습니다");
	        response.put("status", "success");
	        return ResponseEntity.ok(response);
	        
	    } catch (Exception e) {
	        System.out.println("컨트롤러에서 예외 발생: " + e.getClass().getSimpleName() + " - " + e.getMessage());
	        e.printStackTrace();
	        
	        response.put("message", "서버 오류가 발생했습니다: " + e.getMessage());
	        response.put("status", "error");
	        return ResponseEntity.status(500).body(response);
	    }
	}
	
	/**
	 * 창고 목록 조회 API (페이징 지원)
	 * 
	 * @param page          페이지 번호 (1부터 시작, 기본값: 1)
	 * @param size          페이지 크기 (기본값: 10)
	 * @param sortBy        정렬 기준
	 * @param sortDirection 정렬 방향
	 * @param keyword       검색어
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