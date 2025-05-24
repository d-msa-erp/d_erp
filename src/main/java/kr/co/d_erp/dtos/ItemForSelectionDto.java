package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemForSelectionDto {
    private Long itemIdx;
    private String itemNm;
    private String itemCd;
    // 필요시 다른 필드 (예: 규격 - itemSpec) 추가 가능
}