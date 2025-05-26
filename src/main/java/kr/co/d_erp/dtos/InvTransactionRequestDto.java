package kr.co.d_erp.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvTransactionRequestDto {
    // 수정 시에만 사용 (invTransIdx는 URL 경로에서 받으므로 DTO에서는 없어도 무방)
    // private Long invTransIdx;

    private String invTransCode; // 신규 등록 시 "자동 생성"이거나 비어있으면 자동 생성

    @NotBlank(message = "거래 유형은 필수입니다.")
    private String transType;    // 'R' 또는 'S'. inbound.js에서는 'R'로 고정

    private Long orderIdx;       // 관련 주문 IDX (선택 사항)

    @NotNull(message = "창고는 필수입니다.")
    private Long whIdx;

    @NotNull(message = "거래일자는 필수입니다.")
    private LocalDate transDate;

    @NotNull(message = "거래 수량은 필수입니다.")
    @Positive(message = "거래 수량은 0보다 커야 합니다.")
    private BigDecimal transQty;

    @NotNull(message = "단가는 필수입니다.")
    @PositiveOrZero(message = "단가는 0 이상이어야 합니다.")
    private BigDecimal unitPrice;

    @NotBlank(message = "거래 상태는 필수입니다.")
    private String transStatus; // 예: R1, R2, R3

    private Long userIdx;       // 담당자 IDX 

    @NotNull(message = "품목은 필수입니다.")
    private Long itemIdx;       

    private Long custIdx;       // 거래처 IDX 

    private String remark;

}