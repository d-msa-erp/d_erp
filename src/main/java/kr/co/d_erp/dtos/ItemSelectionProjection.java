package kr.co.d_erp.dtos;

import java.math.BigDecimal;

public interface ItemSelectionProjection {

    Long getItemIdx();   // as itemIdx 와 매칭
    String getItemCd();  // as itemCd 와 매칭
    String getItemNm();  // as itemNm 와 매칭
    String getItemSpec();// as itemSpec 와 매칭
    String getUnitNm();  // as unitNm 와 매칭
    BigDecimal getItemCost();
}