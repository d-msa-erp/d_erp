package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LowInventoryDto {
    private String itemNm;
    private String itemCd;
    private Long totalStockQty;
    private Long requiredQty;
}
