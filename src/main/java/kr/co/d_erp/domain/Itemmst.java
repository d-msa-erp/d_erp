package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.*;
<<<<<<< Updated upstream
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
=======

import lombok.*;
// import java.time.LocalDateTime; // 기존 필드 유지 시 필요
// import java.math.BigDecimal; // 기존 숫자 필드 유지 시 필요
>>>>>>> Stashed changes

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
