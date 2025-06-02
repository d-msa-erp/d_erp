package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder	
public class StockRequestDto {

	// 신규 재고 등록 시 사용 (품목 선택)
    private Long itemIdxToRegister; // 선택된 기존 품목의 ID (신규 등록 시에만 사용)
    private String itemCd;        // 품목 코드
    private String itemNm;        // 품목명
    private String itemSpec;      // 규격
    private String itemFlag;      // 품목 구분 ('01': 자재, '02': 제품)
    private Long unitIdx;         // 단위 ID (프론트 payload의 itemUnitId에 해당)
    private Long custIdx;         // 주거래처 ID (매입처 ID)
    private double itemCost;    // 표준 원가
    private Long optimalInv;  // 적정 재고 (프론트 payload의 optimalInv)
    private String remark;        // 비고 (프론트 payload의 remark)
    private Long invIdx; 
    private Long userIdx; // 이 필드가 없다면 추가
    // From TB_INVENTORY
    // 공통 필드 (신규/수정)
    @NotNull(message = "품목 ID는 필수입니다.") // 수정 시에는 itemIdx, 신규 시 itemIdxToRegister 사용 후 itemIdx로 변환
    private Long itemIdx; // PUT 요청 시에는 이 필드를 사용하거나, 경로 변수 사용
    @NotNull(message = "창고 ID는 필수입니다.")
    private Long whIdx;
    @NotNull(message = "수량은 필수입니다.")
    @PositiveOrZero(message = "수량은 0 이상이어야 합니다.") // 0도 가능하게 하려면 (재고 실사 등)
    private BigDecimal qty;


}
