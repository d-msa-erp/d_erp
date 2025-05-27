package kr.co.d_erp.controllers;

import kr.co.d_erp.dtos.BomItemDetailDto;
import kr.co.d_erp.dtos.BomSaveRequestDto;
import kr.co.d_erp.dtos.BomSequenceUpdateDto;
import kr.co.d_erp.dtos.BomSummaryDto;
import kr.co.d_erp.dtos.BomUpdateRequestDto;
import kr.co.d_erp.dtos.ItemSelectionDto;
import kr.co.d_erp.service.BomService;
import kr.co.d_erp.service.ItemService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BOM 관련 웹 요청을 처리하는 REST 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/bom") // 이 컨트롤러의 모든 API는 /api/bom 으로 시작합니다.
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 주입 (Lombok)
public class BomController {

    private final BomService bomService; // BomService 주입

    /**
     * BOM 요약 목록 (제품 리스트)을 조회하는 API 입니다.
     * GET /api/bom/summary
     *
     * @return BomSummaryDto 리스트를 포함하는 ResponseEntity
     */
    @GetMapping("/summary")
    public ResponseEntity<List<BomSummaryDto>> getBomSummary() {
        List<BomSummaryDto> summaryList = bomService.getBomSummaryList();
        return ResponseEntity.ok(summaryList); // 200 OK와 함께 리스트 반환
    }

    /**
     * 특정 상위 품목 ID를 기준으로 BOM 상세 정보를 조회하는 API 입니다.
     * GET /api/bom/{parentItemId}
     *
     * @param parentItemId URL 경로에서 받아오는 상위 품목의 IDX 입니다.
     * @return BomItemDetailDto 객체를 포함하거나, 찾지 못한 경우 404 Not Found 를 반환합니다.
     */
    @GetMapping("/{parentItemId}")
    public ResponseEntity<BomItemDetailDto> getBomDetails(@PathVariable Long parentItemId) {
        BomItemDetailDto bomDetails = bomService.getBomDetails(parentItemId);

        // 서비스 결과가 null 이면 404 Not Found 반환
        if (bomDetails == null) {
            return ResponseEntity.notFound().build();
        } else {
            return ResponseEntity.ok(bomDetails); // 데이터가 있으면 200 OK와 함께 반환
        }
    }

    /**
     * 특정 BOM의 하위 품목 순서를 업데이트하는 API 입니다. (구현 필요)
     * PUT /api/bom/{parentItemId}/sequence
     *
     * @param parentItemId URL 경로에서 받아오는 상위 품목의 IDX 입니다.
     * @param updates      요청 본문(Request Body)에서 받아오는 순서 변경 정보 리스트입니다.
     * @return 성공 시 200 OK, 실패 시 다른 상태 코드를 반환할 수 있습니다.
     */
    @PutMapping("/{parentItemId}/sequence")
    public ResponseEntity<Void> updateSequence(
            @PathVariable Long parentItemId,
            @RequestBody List<BomSequenceUpdateDto> updates) {

        boolean success = bomService.updateBomSequence(parentItemId, updates);

        if (success) {
            return ResponseEntity.ok().build(); // 성공 시 200 OK
        } else {
            return ResponseEntity.badRequest().build(); // 실패 시 400 Bad Request (또는 다른 에러 코드)
        }
    }
    
    @GetMapping("/flag/{itemFlag}")
    public ResponseEntity<List<ItemSelectionDto>> getItemsByFlag(@PathVariable String itemFlag) {
        List<ItemSelectionDto> items = bomService.getItemsForSelectionByFlag(itemFlag);
        return ResponseEntity.ok(items);
    }
    //BOM수정
    @PutMapping("/{parentItemId}")
    public ResponseEntity<Void> updateBom(
            @PathVariable Long parentItemId,
            @RequestBody BomUpdateRequestDto bomUpdateRequestDto) {

        // 원본 parentItemId와 DTO 내부의 parent 정보가 일치하는지 등 추가 검증 가능

        boolean success = bomService.updateBom(parentItemId, bomUpdateRequestDto);

        if (success) {
            return ResponseEntity.ok().build(); // 성공 시 200 OK
        } else {
            // 보통 서비스에서 예외를 발생시키고, @ControllerAdvice 등으로 처리하여
            // 더 구체적인 에러 응답(예: 400, 500)을 내보냅니다.
            return ResponseEntity.internalServerError().build(); // 간단히 500 에러로 처리
        }
    }
    
    
    /**
     * 신규 BOM을 등록하는 API 입니다.
     * POST /api/bom/save  <--- 경로 변경
     * @param bomSaveRequestDto 요청 본문에서 받아오는 신규 BOM 정보
     * @return 생성 성공 시 201 Created, 실패 시 에러 상태 코드
     */
    @PostMapping("/save") // <--- 이 부분을 "/save"로 변경
    public ResponseEntity<Void> saveNewBom(@RequestBody BomSaveRequestDto bomSaveRequestDto) {
        try {
            boolean success = bomService.saveNewBom(bomSaveRequestDto); 

            if (success) {
                return ResponseEntity.status(HttpStatus.CREATED).build();
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            System.err.println("BOM 저장 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
}