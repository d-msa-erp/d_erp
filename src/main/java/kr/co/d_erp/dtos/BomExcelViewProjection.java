package kr.co.d_erp.dtos;

import java.math.BigDecimal;

public interface BomExcelViewProjection {

    // 상위 품목 정보 
    Long getParentItemIdx();
    String getParentItemCd();
    String getParentItemNm();
    String getParentCategoryNm(); // 상위 품목 대분류명 (뷰에서 p_item_cat.CAT_NM AS parentCategoryNm)
    String getParentUnitNm();     // 상위 품목 단위명 (뷰에서 p_item_unit.UNIT_NM AS parentUnitNm)
    BigDecimal getParentCycleTime(); // 뷰에서 p_item.CYCLE_TIME AS parentCycleTime (NUMBER 타입이므로 BigDecimal)
    String getParentRemark();        // 뷰에서 p_item.REMARK AS parentRemark

    // 하위 품목 정보 (BOM 상세 라인)
    Integer getSeqNo();            // 뷰에서 bom.SEQ_NO AS seqNo (NUMBER 타입이므로 Integer 또는 Long)
    String getSubItemCd();         // 뷰에서 s_item.ITEM_CD AS subItemCd
    String getSubItemNm();         // 뷰에서 s_item.ITEM_NM AS subItemNm
    BigDecimal getUseQty();        // 뷰에서 bom.USE_QTY AS useQty (NUMBER 타입이므로 BigDecimal)
    String getSubItemUnitNm();     // 뷰에서 s_item_unit.UNIT_NM AS subItemUnitNm (하위 품목 단위명)
    BigDecimal getLossRt();        // 뷰에서 bom.LOSS_RT AS lossRt (NUMBER 타입이므로 BigDecimal)
    BigDecimal getItemPrice();     // 뷰에서 bom.ITEM_PRICE AS itemPrice (NUMBER 타입이므로 BigDecimal)
    String getSubItemRemark();     // 뷰에서 bom.REMARK AS subItemRemark (하위 품목의 비고)
}