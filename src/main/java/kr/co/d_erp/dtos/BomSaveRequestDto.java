package kr.co.d_erp.dtos;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BomSaveRequestDto {

    private Long parentItemIdx;       // 상위 품목의 IDX (필수)
    private BigDecimal parentCycleTime; // BigDecimal 또는 Double (프론트에서 parseFloat 결과를 보냄)
    private String parentRemark;      // 상위 품목의 비고

    private List<BomComponentSaveDto> components; // 하위 품목 구성 정보 리스트

    @Data
    public static class BomComponentSaveDto {
        private Long subItemIdx;     // 하위 품목(원자재)의 IDX (필수)
        private BigDecimal useQty;   // 소요량 (BigDecimal 또는 Double)
        private BigDecimal lossRate; // 로스율 (%) (BigDecimal 또는 Double)
        private BigDecimal itemPrice;// 단가 (라인금액) (BigDecimal 또는 Double)
        private String remark;       // 하위 품목 비고
        private Integer seqNo;       // 순번 (필수)
    }
}