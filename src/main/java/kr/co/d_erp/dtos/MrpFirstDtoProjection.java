package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface MrpFirstDtoProjection {
	 Long getOrderIdx();
	    String getOrderCode();
	    String getOrderType();
	    LocalDate getOrderDate();
	    LocalDate getOrderDeliveryDate();
	    String getCustomerNm();
	    Long getProductPrimaryItemIdx();
	    String getProductItemCd();
	    String getProductItemNm();
	    String getProductItemSpec();
	    BigDecimal getOrderQty();
	    String getProductUnitNm();
	    BigDecimal getProductCurrentStock();
	    String getProductionCode();
	    BigDecimal getProductivity();
	    String getRemark();
	    String getOrderStatusOverall();
}
