package kr.co.d_erp.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.ItemInventoryView;
import kr.co.d_erp.domain.MrpLackView;
import kr.co.d_erp.dtos.ItemInventorySummaryDto;
import kr.co.d_erp.dtos.LowInventoryDto;
import kr.co.d_erp.repository.oracle.ItemInventoryViewRepository;
import kr.co.d_erp.repository.oracle.MrpLackViewRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemInventoryService {

    private final ItemInventoryViewRepository itemInventoryViewRepository;
    private final MrpLackViewRepository mrpLackViewRepository;
    
    public List<ItemInventoryView> getInventoryByItemFlag(String itemFlag) {
        return itemInventoryViewRepository.findByItemFlag(itemFlag);
    }

    public List<ItemInventoryView> getLowInventoryItems() {
        List<ItemInventoryView> all = itemInventoryViewRepository.findAll();
        return all.stream()
                  .filter(i -> i.getStockQty() < i.getOptimalInv())
                  .toList();
    }
    
    /*
    public List<ItemInventorySummaryDto> getShortageRawMaterials() {
        return itemInventoryViewRepository.findItemsBelowOptimalInventory();
    }
    */
    
    public Long getTotalStockQty(Long itemIdx) {
        Long total = itemInventoryViewRepository.getTotalStockQtyByItemIdx(itemIdx);
        return total != null ? total : 0L;
    }

    public List<LowInventoryDto> getIntegratedLowInventoryItems() {
        List<ItemInventorySummaryDto> lowBasic = itemInventoryViewRepository.findItemsBelowOptimalInventory();
        List<MrpLackView> lowMrp = mrpLackViewRepository.findAllLackMaterials();

        // MRP item 코드 목록 수집
        Set<String> mrpItemCds = lowMrp.stream()
            .map(MrpLackView::getMaterialItemCd)
            .collect(Collectors.toSet());

        // MRP → DTO 변환
        Map<String, List<MrpLackView>> mrpGrouped = lowMrp.stream()
        	    .collect(Collectors.groupingBy(MrpLackView::getMaterialItemCd));

        	List<LowInventoryDto> mrpDtos = mrpGrouped.entrySet().stream()
        	    .map(entry -> {
        	        String itemCd = entry.getKey();
        	        List<MrpLackView> group = entry.getValue();
        	        MrpLackView first = group.get(0); // 이름, 재고는 대표값 기준

        	        long totalRequiredQty = group.stream()
        	            .mapToLong(m -> m.getRequiredQty() + (m.getMaterialOptimalInv() != null ? m.getMaterialOptimalInv() : 0L))
        	            .sum();

        	        return new LowInventoryDto(
        	            "[MRP] " + first.getMaterialItemNm(),
        	            itemCd,
        	            first.getMaterialStockQty() != null ? first.getMaterialStockQty() : 0L,
        	            totalRequiredQty,
        	            "필요",
        	            first.getItemCost() != null ? first.getItemCost() : 0L
        	        );
        	    })
        	    .toList();

        // 정기 항목 중, MRP에 포함되지 않은 것만
        List<LowInventoryDto> baseDtos = lowBasic.stream()
            .filter(i -> !mrpItemCds.contains(i.getItemCd()))
            .map(i -> new LowInventoryDto(
                "[정기] " + i.getItemNm(),
                i.getItemCd(),
                i.getTotalStockQty(),
                i.getOptimalInv(),
                "적정",
                i.getItemCost() != null ? i.getItemCost().longValue() : 0L
            ))
            .collect(Collectors.toList());

        List<LowInventoryDto> result = new ArrayList<>();
        result.addAll(baseDtos);
        result.addAll(mrpDtos);
        return result;
    }
}
