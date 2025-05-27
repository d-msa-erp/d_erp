package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BomSummaryDto {

    private Long itemIdx;       // 품목 IDX (상세 조회 시 사용)
    private String pitemCd;     // 품목 코드
    private String pitemNm;     // 품목 명
    private String catNm;       // 대분류명
    private String punitNm;     // 단위명
    private BigDecimal ptotalRawMaterialCost; // 총 원가 (여기서는 0 또는 임시값)

    // 네이티브 쿼리 결과를 받기 위한 생성자
    public BomSummaryDto(Number itemIdx, String pitemCd, String pitemNm, String catNm, String punitNm, Number ptotalRawMaterialCost) {
        this.itemIdx = (itemIdx != null) ? itemIdx.longValue() : null;
        this.pitemCd = pitemCd;
        this.pitemNm = pitemNm;
        this.catNm = catNm;
        this.punitNm = punitNm;
        this.ptotalRawMaterialCost = (ptotalRawMaterialCost != null) ? new BigDecimal(ptotalRawMaterialCost.toString()) : BigDecimal.ZERO;
    }
}