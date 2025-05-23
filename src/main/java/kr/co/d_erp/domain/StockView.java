package kr.co.d_erp.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "STOCK_VIEW")

public class StockView {

	@Id
	private long STOCK_IDX;
	
}
