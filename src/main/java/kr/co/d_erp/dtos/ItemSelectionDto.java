package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemSelectionDto {
    private Long itemIdx;
    private String itemCd;
    private String itemNm;
    private String itemSpec; // 규격
    private String unitNm;   // 단위명
    // 필요하다면 itemFlag도 포함할 수 있습니다.
    private BigDecimal itemCost; //원가 계산용
}