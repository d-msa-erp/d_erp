package kr.co.d_erp.controllers; // 사용자 실제 컨트롤러 패키지 경로로 수정하세요.

import kr.co.d_erp.dtos.ItemForSelectionDto;
import kr.co.d_erp.service.ItemJpaService; // 새로 만든 JPA 기반 서비스
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/items") // JavaScript에서 호출하는 경로와 일치시킵니다.
@RequiredArgsConstructor
public class ItemController { // 또는 ItemApiController

    private final ItemJpaService itemJpaService; // 새로운 JPA 서비스 주입

    /**
     * Datalist용 활성 품목 목록 조회 API입니다.
     * 특정 거래처 ID(custIdx)가 제공되면 해당 거래처의 품목만, 없으면 전체 (활성) 품목을 반환합니다.
     * JavaScript(`inbound.js`)에서 /api/items/active-for-selection 경로로 호출됩니다.
     * @param custIdx 거래처 ID (선택 사항)
     * @return ItemForSelectionDto 리스트
     */
    @GetMapping("/active-for-selection")
    public ResponseEntity<List<ItemForSelectionDto>> getActiveItemsForSelection(
            @RequestParam(name = "custIdx", required = false) Long custIdx
    ) {
        List<ItemForSelectionDto> items = itemJpaService.findActiveItemsForSelection(custIdx);

        if (items == null || items.isEmpty()) {
            // 데이터가 없을 경우 HTTP 204 No Content 응답
            return ResponseEntity.noContent().build();
        }
        // 데이터가 있으면 HTTP 200 OK 와 함께 품목 목록 반환
        return ResponseEntity.ok(items);
    }

    // 만약 이 컨트롤러에서 다른 품목 관련 API (예: CRUD)를 추가하고 싶다면 여기에 메소드를 추가할 수 있습니다.
    // 그 경우, 해당 기능들이 MyBatis 기반의 기존 ItemService를 사용해야 한다면,
    // 이 컨트롤러에 기존 ItemService도 함께 주입받도록 설계할 수 있습니다.
    // 예:
    // private final ItemService myBatisItemService;
    // public ItemController(ItemJpaService itemJpaService, ItemService myBatisItemService) {
    //     this.itemJpaService = itemJpaService;
    //     this.mybatisItemService = mybatisItemService;
    // }
}