package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * 창고 이동할 재고 아이템 정보 DTO
 */
@Data
public class StockTransferItemDto {
    
    /**
     * 품목 ID
     */
    @NotNull(message = "품목 ID는 필수입니다.")
    private Long itemIdx;
    
    /**
     * 이동할 수량
     */
    @NotNull(message = "이동 수량은 필수입니다.")
    @Positive(message = "이동 수량은 0보다 커야 합니다.")
    private BigDecimal transferQty;
}