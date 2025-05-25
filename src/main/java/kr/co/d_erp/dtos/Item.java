package kr.co.d_erp.dtos;

import lombok.Data;

@Data
public class Item {
	private Integer ITEM_IDX, ITEM_CAT1, ITEM_CAT2, ITEM_UNIT, OPTIMAL_INV, QTY;
	private String ITEM_CD,ITEM_NM, ITEM_FLAG, ITEM_SPEC, REMARK, UNIT_NM;
	private String CAT_NM,ITEM_CATX1,ITEM_CATX2,CUST_NM;
	private Integer PARENT_IDX, CUST_IDX, CAT_IDX, UNIT_IDX;
	private Long CYCLE_TIME; // cycleTime 필요해서 Integer > Long으로 변경했습니다 문제 생기면 삭제해주세요. -민섭
	private Double ITEM_COST; // Integer > Double로 변경했습니다 문제 생기면 삭제해주세요. -민섭
	
}
