package kr.co.d_erp.dtos;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BomDtlRequestDto {
    private Long subItemIdx;    // 하위 품목의 ITEM_IDX
    private BigDecimal useQty;
    private BigDecimal lossRate;
    private BigDecimal itemPrice;   // 계산된 라인 금액 (TB_BOMDTL.ITEM_PRICE 에 저장될 값)
    private String remark;
    private Integer seqNo;       // 화면 표시 순서
}