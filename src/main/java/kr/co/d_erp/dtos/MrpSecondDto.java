package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;

public class MrpSecondDto {
    private Long mrpIdx;
    private Long orderIdx;
    private String orderCode;
    private String orderType;       // From V_MRP_RESULT_DETAILS (ord.ORDER_TYPE)
    private LocalDate orderDate;       // From V_MRP_RESULT_DETAILS (ord.ORDER_DATE)
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
    private String materialUnitNm;    // V_MRP_RESULT_DETAILS 에서는 MATERIAL_REQUIRED_UNIT_NM
    
    private BigDecimal requiredQty;   // TB_MRP.REQUIRED_QTY (소요량)
    private BigDecimal calculatedCost;
    private Date requireDate;       // 자재 필요 일자 (java.util.Date 또는 LocalDate)
    private String mrpStatus;
    private String mrpRemark;
    private Date mrpCreatedDate;
    private Date mrpUpdatedDate;
    private String orderStatusOverall; // V_MRP_RESULT_DETAILS (ord.ORDER_STATUS) - 주문 전체 상태
    private BigDecimal expectedInputQty; 
}
