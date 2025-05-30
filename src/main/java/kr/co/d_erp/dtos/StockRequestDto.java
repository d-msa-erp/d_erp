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
public class StockRequestDto {

	private Long itemIdxToRegi; 
    private String itemCd;        // 품목 코드
    private String itemNm;        // 품목명
    private String itemSpec;      // 규격
    private String itemFlag;      // 품목 구분 ('01': 자재, '02': 제품)
    private Long unitIdx;         // 단위 ID (프론트 payload의 itemUnitId에 해당)
    private Long custIdx;         // 주거래처 ID (매입처 ID)
    private double itemCost;    // 표준 원가
    private Long optimalInv;  // 적정 재고 (프론트 payload의 optimalInv)
    private String remark;        // 비고 (프론트 payload의 remark)

    // From TB_INVENTORY
    private Long whIdx;           // 창고 ID
    private BigDecimal qty;           // 현재고 수량 (초기 수량 또는 변경 수량)

}
