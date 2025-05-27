package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class MrpSecondDto {
    private Long mrpIdx;
    private Long orderIdx;
    private String orderCode;
    private String orderType;       // From MRP_RESULT_DETAILS (ord.ORDER_TYPE)
    private LocalDate orderDate;       // From MRP_RESULT_DETAILS (ord.ORDER_LocalDate)
    private LocalDate orderDeliveryDate;
    private String customerNm;
    
    private Long productPrimaryItemIdx; // From V_MRP_RESULT_DETAILS
    private String productItemCd;
    private String productItemNm;
    
    private Long materialItemIdx;
    private String materialItemCd;
    private String materialItemNm;
    private String materialItemSpec;
    
    private Long materialUnitIdx;
    private String materialUnitNm;    // MRP_RESULT_DETAILS 에서는 MATERIAL_REQUIRED_UNIT_NM
    
    private BigDecimal requiredQty;   // TB_MRP.REQUIRED_QTY (소요량)
    private BigDecimal calculatedCost;
    private LocalDate requireDate;       // 자재 필요 일자 (java.util.LocalDate 또는 LocalLocalDate)
    private String mrpStatus;
    private String mrpRemark;
    private LocalDate mrpCreatedDate;
    private LocalDate mrpUpdatedDate;
    private String orderStatusOverall; // V_MRP_RESULT_DETAILS (ord.ORDER_STATUS) - 주문 전체 상태
    private BigDecimal expectedInputQty; 
}
