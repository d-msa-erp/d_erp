package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ItemInventorySummaryDto {
    private Long itemIdx;
    private String itemCd;
    private String itemNm;
    private Long totalStockQty;
    private Long optimalInv;

    public boolean isBelowOptimal() {
        return totalStockQty != null && optimalInv != null && totalStockQty < optimalInv;
    }
}
