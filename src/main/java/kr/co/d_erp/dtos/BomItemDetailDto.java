package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;

@Data
public class BomItemDetailDto {

	// ===================================
	// 상위 품목(Parent Item) 정보
	// ===================================
	private Long itemIdx; // 상위 품목 고유 번호 (ITEM_IDX)
	private String itemCd; // 상위 품목 코드 (ITEM_CD)
	private String itemNm; // 상위 품목명 (ITEM_NM)
	private String itemFlag; // 상위 품목 구분 (ITEM_FLAG - 보통 '02' 제품)
	private String itemSpec; // 상위 품목 규격 (ITEM_SPEC)
	private Long itemUnit; // 상위 품목 단위 IDX (ITEM_UNIT)
	// private String unitNm; // (필요하다면) 단위명도 추가할 수 있습니다.
	private BigDecimal itemCost; // 상위 품목 표준 원가 (ITEM_COST)
	private String remark; // 상위 품목 비고 (REMARK)
	// ... TB_ITEMMST에서 필요한 다른 상위 품목 정보들을 여기에 추가...
	private BigDecimal cycleTime;// 생산성

	// ===================================
	// 하위 품목(Sub Items / Components) 리스트
	// ===================================
	private List<BomListItemDto> components; // 하위 품목 리스트 (V_BOM_LIST 조회 결과)

	// 기본 생성자 (필요시)
	public BomItemDetailDto() {
	}

	// 모든 필드를 받는 생성자 (필요시)
	public BomItemDetailDto(Long itemIdx, String itemCd, String itemNm, String itemFlag, String itemSpec, Long itemUnit,
			BigDecimal itemCost, String remark, BigDecimal cycleTime, List<BomListItemDto> components) {
		this.itemIdx = itemIdx;
		this.itemCd = itemCd;
		this.itemNm = itemNm;
		this.itemFlag = itemFlag;
		this.itemSpec = itemSpec;
		this.itemUnit = itemUnit;
		this.itemCost = itemCost;
		this.remark = remark;
		this.cycleTime = cycleTime;
		this.components = components;
	}
}