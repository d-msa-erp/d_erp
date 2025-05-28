package kr.co.d_erp.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.dtos.MrpSecondDto;
import kr.co.d_erp.service.MrpService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mrp")
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 만들어줍니다.
public class MrpController {

    private final MrpService mrpService;
    
    @GetMapping("/orders")
    public ResponseEntity<Page<MrpSecondDto>> getMrpTargetOrders(
            @RequestParam(required = false) String orderType, // JS에서 orderType으로 필터링 한다면 파라미터명 일치 필요
            @RequestParam(required = false) String searchKeyword,
            @PageableDefault(sort = "orderIdx", direction = Sort.Direction.DESC, size = 10) Pageable pageable) {
        // 일반적으로 MRP 대상 주문은 특정 주문 유형 (예: 'S' - 판매 주문)을 기준으로 할 수 있습니다.
        // orderType 파라미터를 클라이언트에서 받거나, 여기서 기본값을 설정할 수 있습니다.
        // 예제에서는 클라이언트에서 orderTypeFilter를 넘기지 않으므로, 여기서는 모든 타입을 대상으로 하거나 기본값 사용.
        // 서비스 메소드에는 orderType 파라미터를 전달합니다.
        Page<MrpSecondDto> orderSummaries = mrpService.findMrpTargetOrders(orderType, searchKeyword, pageable);
        return ResponseEntity.ok(orderSummaries);
    }
    
    // MRP 결과 (두 번째 테이블) 조회 API
    @GetMapping("/results")
    public ResponseEntity<Page<MrpSecondDto>> getMrpResults(
            @RequestParam Long orderIdx, // 특정 주문 ID는 필수로 받도록 변경 (선택 사항)
            @PageableDefault(sort = "mrpIdx", direction = Sort.Direction.ASC, size = 10) Pageable pageable) {
        Page<MrpSecondDto> mrpResults = mrpService.findMrpResults(orderIdx, pageable);
        return ResponseEntity.ok(mrpResults);
    }
}