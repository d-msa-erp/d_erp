package kr.co.d_erp.dtos;

import jakarta.persistence.Id;
import lombok.Data;

@Data
public class Inven {

	@Id
	private Long INV_IDX;
	
	int WH_IDX, ITEM_IDX, STOCK_QTY;
	String CREATED_DATE, UPDATE_DATE;
}
