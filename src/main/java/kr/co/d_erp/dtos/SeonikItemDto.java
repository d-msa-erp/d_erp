package kr.co.d_erp.dtos;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class SeonikItemDto {

    private Long itemIdx;
    private String itemCd;
    private String itemNm;
    private String itemFlag;

    private Long itemCat1Idx;    // TB_ITEM_CAT.CAT_IDX는 NUMBER이므로 Long으로 매핑
    private String itemCat1Nm;

    private Long itemCat2Idx;    // TB_ITEM_CAT.CAT_IDX는 NUMBER이므로 Long으로 매핑
    private String itemCat2Nm;

    private Long custIdx;
    private String custNm;

    private String itemSpec;

    private Integer unitIdx; // Unit 엔티티 ID 타입(Integer)과 일치 (UnitDto, UnitRepository 기준)
    private String unitNm;

    private Integer itemCost;
    private BigDecimal optimalInv;
    private BigDecimal cycleTime;
    private String remark;
    private BigDecimal currentStockQty; // 현재고량 필드 (NUMBER(12,2) 이므로 BigDecimal)

    // SeonikItemRepository JPQL에서 사용할 생성자
    public SeonikItemDto(
            Long itemIdx, String itemCd, String itemNm, String itemFlag,
            Long itemCat1Idx, String itemCat1Nm, Long itemCat2Idx, String itemCat2Nm,
            Long custIdx, String custNm, String itemSpec,
            Integer unitIdx, // Integer 타입 (Unit.unitIdx 타입과 일치)
            String unitNm, Integer itemCost, BigDecimal optimalInv,
            BigDecimal cycleTime, String remark, BigDecimal currentStockQty
    ) {
        this.itemIdx = itemIdx;
        this.itemCd = itemCd;
        this.itemNm = itemNm;
        this.itemFlag = itemFlag;
        this.itemCat1Idx = itemCat1Idx;
        this.itemCat1Nm = itemCat1Nm;
        this.itemCat2Idx = itemCat2Idx;
        this.itemCat2Nm = itemCat2Nm;
        this.custIdx = custIdx;
        this.custNm = custNm;
        this.itemSpec = itemSpec;
        this.unitIdx = unitIdx;
        this.unitNm = unitNm;
        this.itemCost = itemCost;
        this.optimalInv = optimalInv;
        this.cycleTime = cycleTime;
        this.remark = remark;
        this.currentStockQty = (currentStockQty != null) ? currentStockQty : BigDecimal.ZERO;
    }
}