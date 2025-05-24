package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerForSelectionDto {
    private Long custIdx;
    private String custNm;
    private String custCd;
    // 필요시 다른 필드 추가 가능
}