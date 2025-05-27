package kr.co.d_erp.dtos;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BomUpdateRequestDto {
    // 상위 품목의 수정될 수 있는 정보
    private BigDecimal parentCycleTime;
    private String parentRemark;

    // 하위 구성품 리스트
    private List<BomDtlRequestDto> components;
}