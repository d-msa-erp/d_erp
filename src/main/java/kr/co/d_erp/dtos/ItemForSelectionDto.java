package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemForSelectionDto {
	private Long itemIdx;
	private String itemNm;
	private String itemCd;
//    private Long cycleTime; // cycleTime 필요해서 추가했습니다 문제 생기면 삭제해주세요. -민섭
	private BigDecimal cycleTime; // cycleTime 필요해서 추가했습니다 문제 생기면 삭제해주세요. -민섭
	private Double itemCost; // itemCost 필요해서 추가했습니다 문제 생기면 삭제해주세요. -민섭
	// 필요시 다른 필드 (예: 규격 - itemSpec) 추가 가능
}