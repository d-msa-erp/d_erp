package kr.co.d_erp.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.mongodb.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Immutable // 이 엔티티는 변경할 수 없음을 명시 (읽기 전용)
@Table(name = "MRP_RESULT_DETAILS") // 실제 데이터베이스 뷰 이름
@Getter
@NoArgsConstructor // 기본 생성자
public class MrpDetailView { // 클래스명은 자유롭게 (예: MrpResultView)

    @Id
    @Column(name = "MRP_IDX")
    private Long mrpIdx;

    @Column(name = "ORDER_IDX")
    private Long orderIdx;

    @Column(name = "ORDER_CODE")
    private String orderCode;

    @Column(name = "ORDER_TYPE")
    private String orderType;

    @Column(name = "ORDER_DATE")
    private LocalDate orderDate; // 뷰의 컬럼 타입과 일치하는 Java 타입 사용
    
    @Column(name = "ORDER_QTY")
    private BigDecimal orderQty;

    @Column(name = "ORDER_DELIVERY_DATE")
    private LocalDate orderDeliveryDate;

    @Column(name = "CUST_IDX")
    private Long custIdx;

    @Column(name = "CUST_NM")
    private String customerNm; // 뷰의 CUST_NM 컬럼에 매핑

    @Column(name = "PRODUCT_PRIMARY_ITEM_IDX")
    private Long productPrimaryItemIdx;

    @Column(name = "PRODUCT_ITEM_CD")
    private String productItemCd;
    
    @Column(name = "PRODUCT_UNIT_NM")
    private String productUnitNm; // 완제품 단위명

    @Column(name = "PRODUCT_CURRENT_STOCK")
    private BigDecimal productCurrentStock; // 완제품 현재고

    @Column(name = "LOSSRT") // 뷰의 별칭 'lossRt'에 맞춰 소문자로 (또는 DB 별칭을 LOSS_RT로)
    private BigDecimal lossRt; // BOM 로스율 (뷰의 조인 조건에 따른 의미)
    
    @Column(name = "PRODUCT_ITEM_NM")
    private String productItemNm;

    @Column(name = "MATERIAL_ITEM_IDX")
    private Long materialItemIdx;

    @Column(name = "MATERIAL_ITEM_CD")
    private String materialItemCd;

    @Column(name = "MATERIAL_ITEM_NM")
    private String materialItemNm;

    @Column(name = "MATERIAL_ITEM_SPEC")
    private String materialItemSpec;

    @Column(name = "MATERIAL_UNIT_IDX")
    private Long materialUnitIdx;

    @Column(name = "MATERIAL_UNIT_NM") // 뷰에서 MATERIAL_UNIT_NM으로 별칭 지정
    private String materialUnitNm;

    @Column(name = "REQUIRED_QTY")
    private BigDecimal requiredQty;

    @Column(name = "CALCULATED_COST")
    private BigDecimal calculatedCost;

    @Column(name = "REQUIRE_DATE")
    private LocalDate requireDate;    // 또는 LocalDate requireDate; (이 경우 @Temporal 불필요)

    @Column(name = "MRP_STATUS")
    private String mrpStatus;

    @Column(name = "MRP_REMARK")
    private String mrpRemark;

    @Column(name = "MRP_CREATED_DATE")
    private LocalDate mrpCreatedDate;   // 또는 LocalDateTime mrpCreatedDate;

    @Column(name = "MRP_UPDATED_DATE")
    private LocalDate mrpUpdatedDate;   // 또는 LocalDateTime mrpUpdatedDate;

    // 뷰에서 CASE 문으로 한글 변환된 주문 상태
    @Column(name = "ORDER_STATUS")
    private String orderStatusOverall; // DTO 필드명과 일치시키기 위해 유지
    
    @Column(name = "PROD_CODE")
    private String prodCd;
    
}