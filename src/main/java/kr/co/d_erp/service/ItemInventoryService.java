package kr.co.d_erp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import kr.co.d_erp.domain.ItemInventoryView;
import kr.co.d_erp.dtos.ItemInventorySummaryDto;
import kr.co.d_erp.repository.oracle.ItemInventoryViewRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemInventoryService {

    private final ItemInventoryViewRepository itemInventoryViewRepository;

    public List<ItemInventoryView> getInventoryByItemFlag(String itemFlag) {
        return itemInventoryViewRepository.findByItemFlag(itemFlag);
    }

    public List<ItemInventoryView> getLowInventoryItems() {
        List<ItemInventoryView> all = itemInventoryViewRepository.findAll();
        return all.stream()
                  .filter(i -> i.getStockQty() < i.getOptimalInv())
                  .toList();
    }
    
    public List<ItemInventorySummaryDto> getShortageRawMaterials() {
        return itemInventoryViewRepository.findItemsBelowOptimalInventory();
    }
    
    public Long getTotalStockQty(Long itemIdx) {
        Long total = itemInventoryViewRepository.getTotalStockQtyByItemIdx(itemIdx);
        return total != null ? total : 0L;
    }
}
