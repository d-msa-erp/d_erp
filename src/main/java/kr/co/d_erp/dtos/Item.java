package kr.co.d_erp.dtos;

import lombok.Data;

@Data
public class Item {
	private Integer ITEM_IDX, ITEM_CAT1, ITEM_CAT2, ITEM_UNIT, ITEM_COST, OPTIMAL_INV, CYCLE_TIME, QTY;
	private String ITEM_CD,ITEM_NM, ITEM_FLAG, ITEM_SPEC, REMARK, UNIT_NM;
	private String CAT_NM,ITEM_CATX1,ITEM_CATX2,CUST_NM;
	private Integer PARENT_IDX, CUST_IDX, CAT_IDX, UNIT_IDX;
	private long USERIDX;
	
}
