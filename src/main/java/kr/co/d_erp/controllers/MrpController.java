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
@RequiredArgsConstructor
public class MrpController {

	private final MrpService mrpService;
	
	
	 @GetMapping("/orders")
	    public ResponseEntity<Map<String, Object>> getItemStockQuantity(@PathVariable Long itemIdx) {
	        Long stockQty = mrpService.getCurrentStockByItemIdx(itemIdx); // 서비스 메서드 호출

	        Map<String, Object> response = new HashMap<>();
	        response.put("itemIdx", itemIdx);
	        response.put("stockQty", stockQty);

	        return ResponseEntity.ok(response);
	    }
}
