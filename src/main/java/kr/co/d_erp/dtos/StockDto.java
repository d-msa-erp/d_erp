package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockDto {
    private Long itemIdx;
    private String itemNm;
    private String itemCd;
    private Double itemCost;
    private String unitNm;
    private BigDecimal qty;        // 현재고량
    private BigDecimal inv;        // 적정재고 (optimalInv)
    private Long optimalInv;
    private Long whIdx;
    private String whNm;
    private String itemSpec;
    private String custNm;
    private String userNm;
    private String userTel;
    private String userMail;
    private String reMark;
    private String itemFlag;
    
    private Long custIdxForItem;
    private Integer unitIdx;
    private Long invIdx;
}
