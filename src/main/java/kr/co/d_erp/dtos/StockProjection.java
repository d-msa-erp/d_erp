package kr.co.d_erp.dtos;

import java.math.BigDecimal;

public interface StockProjection {
	   Long getItemIdx();
	    String getItemNm();
	    String getItemCd();
	    Double getItemCost();
	    String getUnitNm();
	    BigDecimal getQty();        // inven.STOCK_QTY AS Qty
	    BigDecimal getInv();        // item.OPTIMAL_INV AS Inv (적정재고)
	    Long getWhIdx();
	    String getWhNm();
	    String getItemSpec();
	    String getCustNm();
	    String getUserNm();
	    String getUserTel();
	    String getUserMail();
	    String getReMark();         // item.REMARK AS reMark
	    String getItemFlag();
	    
	    Integer getUnitIdx();
	    Long getCustIdxForItem();
	    Long getInvIdx();
}
