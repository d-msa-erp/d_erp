package kr.co.d_erp.dtos;

import lombok.Data;

@Data
public class Inven {
	int INV_IDX, WH_IDX, ITEM_IDX, STOCK_QTY;
	String CREATED_DATE, UPDATE_DATE;
}
