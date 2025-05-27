package kr.co.d_erp.controllers;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.service.MrpService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mrp")
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 만들어줍니다.
public class MrpController {

    private final MrpService mrpService; // ★★★ MrpService 인스턴스 필드 선언 및 final로 지정

    // getItemStockQuantity 메서드
    // API 경로를 좀 더 명확하게 변경하는 것을 권장합니다. (예: /stock-quantity/{itemIdx})
    @GetMapping("/stockcheck/{itemIdx}") // 예시 경로 수정
    public ResponseEntity<Map<String, Object>> getItemStockQuantity(@PathVariable Long itemIdx) {
        // ★★★ 주입된 mrpService 인스턴스를 통해 메서드 호출 ★★★
        Long stockQty = mrpService.getCurrentStockByItemIdx(itemIdx); 

        Map<String, Object> response = new HashMap<>();
        response.put("itemIdx", itemIdx);
        response.put("stockQty", stockQty);

        return ResponseEntity.ok(response);
    }
    
    // ... 다른 MRP 관련 컨트롤러 메서드들 ...
}