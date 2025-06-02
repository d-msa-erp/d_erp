package kr.co.d_erp.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.domain.ItemInventoryView;
import kr.co.d_erp.dtos.ItemInventorySummaryDto;
import kr.co.d_erp.repository.oracle.ItemInventoryViewRepository;
import kr.co.d_erp.service.ItemInventoryService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class ItemInventoryViewController {
	
	private final ItemInventoryService service;
	
	@GetMapping("/qty")
	public List<ItemInventoryView> getInventoryByItemFlag(@RequestParam(defaultValue = "01") String itemFlag) {
        return service.getInventoryByItemFlag(itemFlag);   
    }
	
	@GetMapping("/qty-low")
	public List<ItemInventorySummaryDto> getQtyLowItems() {
	    return service.getShortageRawMaterials();
	}
	
	@GetMapping("/total-stock")
    public ResponseEntity<Long> getTotalStock(@RequestParam("itemIdx") Long itemIdx) {
        Long totalStock = service.getTotalStockQty(itemIdx);
        return ResponseEntity.ok(totalStock);
    }
}
