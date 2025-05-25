package kr.co.d_erp.dtos;

import java.math.BigDecimal;

public interface BomListItemProjection {

    // 상위 품목 정보
    Long getParentItemIdx();
    String getParentItemCd();
    String getParentItemNm();
    String getParentItemFlag();
    String getParentItemSpec();

    // 하위 품목 정보
    Long getBomIdx();
    Long getSubItemIdx();
    String getSubItemCd();
    String getSubItemNm();
    BigDecimal getUseQty();
    String getUnitNm();
    String getItemFlag(); // 하위 품목의 Flag
    Integer getSeqNo();
    BigDecimal getLossRt();
    BigDecimal getItemPrice();
    String getRemark();
    
    BigDecimal getParentCycleTime(); // p_item.CYCLE_TIME 에 대한 Getter
    String getParentRemark();      // p_item.REMARK 에 대한 Getter
    BigDecimal getSubItemMasterCost();
    
}