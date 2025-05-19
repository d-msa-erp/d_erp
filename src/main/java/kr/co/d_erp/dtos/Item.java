package kr.co.d_erp.dtos;

import lombok.Data;

@Data
public class Item {
	private int ITEM_IDX, ITEM_CAT1, ITEM_CAT2, CUST_IDX, ITEM_UNIT, ITEM_COST, OPTIMAL_INV, CYCLE_TIME, QTY;
	private String ITEM_CD,ITEM_NM, ITEM_FLAG, ITEM_SPEC, REMARK, UNIT_NM;
	
	
}
