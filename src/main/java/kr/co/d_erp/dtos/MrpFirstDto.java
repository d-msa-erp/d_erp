package kr.co.d_erp.dtos;

import java.time.LocalDate;

import lombok.Data;

@Data
public class MrpFirstDto {
    private Long orderIdx;      // TB_ORDER.ORDER_IDX (PK)
    private String orderCode;   // TB_ORDER.ORDER_CODE (주문번호)
    private String orderType;   // TB_ORDER.ORDER_TYPE
    private LocalDate orderDate; // TB_ORDER.ORDER_DATE
    private Long custIdx;       // TB_ORDER.CUST_IDX
    private String customerNm;  // TB_CUSTMST.CUST_NM (조인해서 가져옴)
    private Long itemId;        // TB_ORDER.ITEM_IDX (주문된 품목의 ID)
    private String itemCd;      // TB_ITEMMST.ITEM_CD (주문된 품목 코드)
    private String itemNm;      // TB_ITEMMST.ITEM_NM (주문된 품목명)
    private String itemSpec;    // TB_ITEMMST.ITEM_SPEC (규격)
    private String unitNm;      // TB_UNIT_MST.UNIT_NM (주문된 품목의 단위명, ITEM_IDX로 조회)
    private Integer orderQty;   // TB_ORDER.ORDER_QTY
    private LocalDate deliveryDate; // TB_ORDER.DELIVERY_DATE (납기일)
    private String orderStatus; // TB_ORDER.ORDER_STATUS
}
