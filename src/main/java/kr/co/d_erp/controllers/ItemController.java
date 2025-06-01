package kr.co.d_erp.controllers; // 사용자 실제 컨트롤러 패키지 경로로 수정하세요.

import kr.co.d_erp.domain.ItemInventoryView;
import kr.co.d_erp.dtos.ItemForSelectionDto;
import kr.co.d_erp.service.ItemInventoryService;
import kr.co.d_erp.service.ItemJpaService; // 새로 만든 JPA 기반 서비스
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/items") // JavaScript에서 호출하는 경로와 일치시킵니다.
@RequiredArgsConstructor
public class ItemController { // 또는 ItemApiController

    private final ItemJpaService itemJpaService; // 새로운 JPA 서비스 주입
    private final ItemInventoryService itemInventoryService; // 품목에 따른 재고 조회를 위해 추가 -민섭
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
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

    // 발주 품목(원자재)만 조회 -민섭
    @GetMapping("/purchase-itemlist")
    public  ResponseEntity<List<ItemForSelectionDto>> getActiveItemsForPurchase(){
    	List<ItemForSelectionDto> activeItems = itemJpaService.findActiveItems("01");
    	return ResponseEntity.ok(activeItems);
    }
}