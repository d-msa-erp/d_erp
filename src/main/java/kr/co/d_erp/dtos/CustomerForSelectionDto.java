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
}