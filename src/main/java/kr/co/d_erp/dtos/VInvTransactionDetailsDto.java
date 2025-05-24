package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Data; // @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VInvTransactionDetailsDto {
    private Long invTransIdx;
    private String invTransCode;
    private String transType;
    private LocalDate transDate;
    private BigDecimal transQty;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount; // 계산되는 필드
    private String transStatus;
    private String invTransRemark;
    private Long orderIdx;

    // 창고 정보
    private Long whIdx;
    private String warehouseCode;
    private String whNm;

    // 담당자 정보
    private Long userIdx;
    private String employeeId;
    private String userNm;

    // 품목 정보
    private Long itemIdx;
    private String itemCd;
    private String itemNm;
    private String itemUnitNm;

    // 거래처 정보
    private Long custIdx;
    private String custCd;
    private String custNm;

    private String orderCode;

    // 총액 계산 로직 (서비스 계층에서 DTO로 변환 시 채워주거나, DTO 자체에 getter로 포함)
    public BigDecimal getTotalAmount() {
        if (this.transQty != null && this.unitPrice != null) {
            return this.transQty.multiply(this.unitPrice);
        }
        return BigDecimal.ZERO;
    }

    // 또는 서비스에서 값을 채워준다면 이 getter는 필요 없을 수 있습니다.
    // public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}