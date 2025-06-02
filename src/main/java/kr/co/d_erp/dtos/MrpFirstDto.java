package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MrpFirstDto {
	private Long orderIdx;
    private String orderCode;
    private String orderType;
    private LocalDate orderDate;
    private String customerNm;

    private Long productPrimaryItemIdx; // ord.ITEM_IDX (기존 itemId에서 변경)
    private String productItemCd;       // 기존 itemCd
    private String productItemNm;       // 기존 itemNm
    private String productItemSpec;     // 기존 itemSpec
    private String productUnitNm;       // 기존 unitNm (완제품 단위)
    private BigDecimal orderQty;          // 완제품 총 생산/주문 수량 (기존 orderQty)

    private String prodCd;
    private LocalDate orderDeliveryDate; // 기존 deliveryDate
    private String orderStatusOverall;  // 한글 주문 상태 (기존 orderStatus에서 변경)

    // 새로 추가/명확화된 필드 (MRP_RESULT_DETAILS 뷰 또는 관련 테이블에서 가져와야 함)
    private String productionCode;      // 생산 코드
    private BigDecimal productivity;      // 생산성 (기존 productive에서 변경)
    private BigDecimal productCurrentStock; // 완제품 현재고
    
    // mrpRemark는 MrpSecondDto에 있으므로, 필요시 이 DTO에도 추가 가능 (주문 레벨의 비고)
    private String remark; // 주문에 대한 비고 (ord.REMARK 등에서 가져옴)
}
