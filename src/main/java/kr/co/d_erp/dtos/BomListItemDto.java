package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BomListItemDto {
    private Long bomIdx;
    private Long subItemIdx;
    private String subItemCd;
    private String subItemNm;
    private BigDecimal useQty;
    private String unitNm;
    private String itemFlag; // 하위 품목의 Flag
    private Integer seqNo;
    private BigDecimal lossRt;
    private BigDecimal itemPrice;
    private String remark; // 하위 품목의 비고
    private BigDecimal subItemMasterCost; // 하위품목 마스터 원가
    private BigDecimal subQty;	//희원 추가(하위품목 재고)
}