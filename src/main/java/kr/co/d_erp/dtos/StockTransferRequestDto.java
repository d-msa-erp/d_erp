package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * 창고간 재고 이동 요청 DTO
 */
@Data
public class StockTransferRequestDto {
    
    /**
     * 목적지 창고 ID
     */
    @NotNull(message = "목적지 창고 ID는 필수입니다.")
    private Long toWhIdx;
    
    /**
     * 거래처 ID
     */
    private Long custIdx;
    
    /**
     * 처리자 ID
     */
    private Long userIdx;
    
    /**
     * 비고
     */
    private String remark;
    
    /**
     * 이동할 재고 목록
     */
    @NotEmpty(message = "이동할 재고 목록은 비어있을 수 없습니다.")
    private List<StockTransferItemDto> items;
}