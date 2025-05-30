package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockForResponseDto {
	 	private Long itemIdx;
	    private String itemCd;
	    private String itemNm;
	    // 선택 시 모달에 자동으로 채워줄 추가 정보 (선택 사항)
	    private Double itemCost;
	    private Long optimalInv;
	    private Integer unitIdx;
	    private String unitNm; // 단위명도 함께 주면 편함
	    private Long custIdx;
	    private String custNm; // 주거래처명도 함께 주면 편함
	    private String itemSpec;
	    private String itemFlag;
}
