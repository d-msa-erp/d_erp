package kr.co.d_erp.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class MrpSecondDto {
    private Long mrpIdx;
    private Long orderIdx;
    private String orderCode;
    private String orderType;
    private LocalDate orderDate;
    private LocalDate orderDeliveryDate;
    private String customerNm;

    private Long productPrimaryItemIdx;
    private String productItemCd;
    private String productItemNm;
    private BigDecimal orderQty; // 완제품 생산 예정 수량 (PRODUCT_ORDER_QTY에서 매핑)

    // --- 새로 추가된 필드들 ---
    private String productUnitNm;       // 완제품 단위 (JavaScript에서 order.unitNm 등으로 사용 기대)
    private BigDecimal productCurrentStock; // 완제품 현재고 (JavaScript에서 order.currentStock 등으로 사용 기대)
    private BigDecimal lossRate;            // 로스율 (JavaScript에서 order.lossRate 등으로 사용 기대, view의 lossRt에서 매핑)
    // private String productionCode;      // 뷰에 없으므로 주석 처리
    // private BigDecimal productivity;      // 뷰에 없으므로 주석 처리
    private String prodCd;


    // --- 자재 관련 정보 (기존 필드 유지) ---
    private Long materialItemIdx;
    private String materialItemCd;
    private String materialItemNm;
    private String materialItemSpec;
    private Long materialUnitIdx;
    private String materialUnitNm;
    private BigDecimal requiredQty;   // 자재별 소요량
    private BigDecimal calculatedCost;
    private LocalDate requireDate;
    private String mrpStatus;
    private String mrpRemark;
    private LocalDate mrpCreatedDate;
    private LocalDate mrpUpdatedDate;
    private String orderStatusOverall; // 한글 주문 상태
    private BigDecimal expectedInputQty;
}
