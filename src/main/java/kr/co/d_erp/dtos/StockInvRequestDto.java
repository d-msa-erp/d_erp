package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockInvRequestDto {
    private Long originalInvTransIdx; // 참조한 원본 입고 거래 ID (구분을 위해)
    private LocalDate transDate;      // 원본 입고일자

    private Long itemIdx;        // 품목 ID
    private String itemCd;       // 품목 코드
    private String itemNm;       // 품목명
    private String itemSpec;     // 규격 (from ItemMst)
    private String itemFlag;     // 품목 구분 (from ItemMst)

    private Long unitIdx;        // 입고 당시 단위 ID (또는 ItemMst의 기본 단위 ID)
    private String unitNm;       // 입고 당시 단위명 (또는 ItemMst의 기본 단위명)

    private Long custIdx;        // 입고 당시 거래처(매입처) ID
    private String custNm;       // 입고 당시 거래처(매입처)명

    private BigDecimal unitPrice;  // 입고 당시 단가 (모달의 '단가' 기본값으로 사용 가능)

    // ItemMst의 현재 정보 (참고용)
    private BigDecimal currentItemCost; // 품목 마스터의 현재 원가
    private BigDecimal optimalInv;    // 품목 마스터의 현재 적정 재고
}
