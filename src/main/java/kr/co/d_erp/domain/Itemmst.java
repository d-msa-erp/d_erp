package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TB_ITEMMST")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Itemmst {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "ITEM_IDX")
	private Long itemIdx;
	
	@Column(name = "ITEM_COST")
	private Integer itemCost;
	
	@Column(name = "OPTIAML_INV")
	private Integer optimalInv;
	
	@Column(name = "ITEM_UNIT")
	private Long itemUnit;
	
	@Column(name = "CUST_IDX")
	private Long custIdx;
	
	@Column(name = "REMARK")
	private Long reMark;
	
	@Column(name = "USER_IDX")
	private Long userIdx;
	
}
