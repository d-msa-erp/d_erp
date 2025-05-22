package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "TB_ITEM_CAT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {
	@Id
	@GeneratedValue(strategy =  GenerationType.IDENTITY)
	@Column(name = "CAT_IDX")//카테고리 IDX
	private Integer catIdx;

	@Column(name = "CAT_CD")//카테고리 코드
	private String catCd;

	@Column(name = "CAT_NM")//카테고리명
	private String catNm;

	@Column(name = "PARENT_IDX")//소분류일 때 참조하는 대분류의 IDX
	private Integer parentIdx;

	@Column(name = "REMARK")//비고
	private String reMark;

}