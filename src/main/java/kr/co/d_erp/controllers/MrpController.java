package kr.co.d_erp.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.dtos.BomItemDetailDto;
import kr.co.d_erp.dtos.MrpFirstDto;
import kr.co.d_erp.dtos.MrpSecondDto;
import kr.co.d_erp.service.MrpService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mrp")
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 만들어줍니다.
public class MrpController {

    private final MrpService mrpService;
    
    @GetMapping("/orders")
    public ResponseEntity<Page<MrpFirstDto>> getMrpTargetOrders( // 반환 타입 변경
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) String searchKeyword,
            @PageableDefault(sort = "orderIdx", direction = Sort.Direction.DESC, size = 10) Pageable pageable) {
        
        Page<MrpFirstDto> orderSummaries = mrpService.findMrpTargetOrders(orderType, searchKeyword, pageable);
        return ResponseEntity.ok(orderSummaries);
    }

    @GetMapping("/results")
    public ResponseEntity<Page<MrpSecondDto>> getMrpResults(
            @RequestParam Long orderIdx,
            @PageableDefault(sort = "mrpIdx", direction = Sort.Direction.ASC, size = 10) Pageable pageable) {
        Page<MrpSecondDto> mrpResults = mrpService.findMrpResults(orderIdx, pageable);
        return ResponseEntity.ok(mrpResults);
    }

    @GetMapping("/{itemIdx}")
    public ResponseEntity<BomItemDetailDto> getBomComponentsForMrp(@PathVariable Long itemIdx) {
        BomItemDetailDto bomDetails = mrpService.getBomDetailsForMrp(itemIdx);
        if (bomDetails == null || (bomDetails.getComponents() == null && bomDetails.getItemNm() == null) ) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(bomDetails);
    }
}