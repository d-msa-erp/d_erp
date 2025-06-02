package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductionPlanDto {
    private Long itemIdx;
    private Long orderIdx;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private Long whIdx;
    private Long custIdx;
    private Long userIdx;
}
