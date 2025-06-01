package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import java.util.ArrayList;

import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TB_ITEMMST")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Itemmst {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "ITEM_IDX", nullable = false)
	private Long itemIdx;

	@Column(name = "ITEM_CD", unique = true, length = 10, nullable = false)
	private String itemCd;

	@Column(name = "ITEM_NM", length = 100, nullable = false)
	private String itemNm;

	@Column(name = "ITEM_FLAG", nullable = false)
	private String itemFlag;

	@Column(name = "ITEM_SPEC", length = 100)
	private String itemSpec;

	@Column(name = "ITEM_COST", nullable = false)
	private Double itemCost;

	@Column(name = "REMARK", length = 100)
	private String remark;

	@Column(name = "OPTIMAL_INV")
	private Long optimalInv;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "CUST_IDX", referencedColumnName = "CUST_IDX")
	private CustomerForItemDto CustomerForItemDto;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "ITEM_UNIT", referencedColumnName = "UNIT_IDX")
	private UnitForItemDto UnitForItemDto;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "ITEM_CAT1", referencedColumnName = "CAT_IDX")
	private CatDto CatDto1;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "ITEM_CAT2", referencedColumnName = "CAT_IDX")
	private CatDto CatDto2;

	@OneToMany(mappedBy = "item", fetch = FetchType.LAZY) // OneToOne >> OneToMany 변경 -민섭
	private List<InvenDto> InvenDto;// Inventory 엔티티 (아래에 정의 필요)

	@OneToMany(mappedBy = "item", fetch = FetchType.LAZY) // OneToOne -> OneToMany
	private List<InvenDto> invenDtos = new ArrayList<>();

	// 추가 선익
	@Column(name = "CYCLE_TIME", precision = 10, scale = 4)
	private BigDecimal cycleTime;

}