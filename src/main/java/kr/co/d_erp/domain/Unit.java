package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "TB_UNIT_MST") // 실제 테이블 이름
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Unit {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "UNIT_IDX")
	private Integer unitIdx;

	@Column(name = "UNIT_NM")
	private String unitNm; // 단위명 (예: 개, kg, L)
}