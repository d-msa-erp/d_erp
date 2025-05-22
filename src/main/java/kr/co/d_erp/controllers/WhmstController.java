package kr.co.d_erp.controllers; // 패키지 이름이 controllers로 되어 있다면 이대로 유지

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
import kr.co.d_erp.dtos.WhmstDto; // WhmstDto import
import kr.co.d_erp.service.WhmstService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WhmstController {

    private final WhmstService whmstService;

    /**
     * 창고 목록 조회 API
     * @param sortBy 정렬 기준
     * @param sortDirection 정렬 방향
     * @param keyword 검색어
     * @return 창고 DTO 목록
     */
    @GetMapping
    public ResponseEntity<List<WhmstDto>> getWarehouses(
            @RequestParam(defaultValue = "whIdx") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @RequestParam(required = false) String keyword) {
        List<WhmstDto> warehouses = whmstService.findAllWarehouses(sortBy, sortDirection, keyword);
        return ResponseEntity.ok(warehouses);
    }

    /**
     * 단일 창고 상세 조회 API
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
     * 창고 삭제 API
     * @param whIdxes 삭제할 창고 고유 번호 목록
     * @return 응답 없음 (성공 시)
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteWarehouses(@RequestBody List<Long> whIdxes) {
        whmstService.deleteWhmsts(whIdxes);
        return ResponseEntity.noContent().build();
    }

    // ⭐ 추가: 활성 사용자 목록을 가져오는 API (담당자 드롭다운용) ⭐
    // 이 API는 UsermstController에 두는 것이 더 적절할 수 있습니다.
    // 현재는 WhmstService에서 가져오도록 가정하여 WhmstController에 추가합니다.
    @GetMapping("/users/active-for-selection")
    public ResponseEntity<List<Usermst>> getActiveUsersForSelection() {
        List<Usermst> activeUsers = whmstService.getActiveUsersForSelection();
        return ResponseEntity.ok(activeUsers);
    }
}