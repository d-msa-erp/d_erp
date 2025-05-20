package kr.co.d_erp.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

// VW_BOM_DETAIL_VIEW 뷰와 매핑되는 Entity
@Entity
// 뷰 이름 지정
@Table(name = "VW_BOM_DETAIL_VIEW")
// 복합 Primary Key 클래스 지정
@IdClass(BomDetailViewId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomDetailView {

    // 복합 Primary Key의 첫 번째 컬럼
    @Id
    @Column(name = "P_ITEM_CD")
    private String pItemCd;

    // 하위 품목 코드 (Primary Key의 두 번째 부분)
    @Id
    @Column(name = "S_ITEM_CD")
    private String sItemCd;

    // --- 상위 품목 (완제품) 정보 ---
    @Column(name = "P_ITEM_NM")
    private String pItemNm; // 상위 품목명

    @Column(name = "P_ITEM_FLAG")
    private String pItemFlag; // 상위 품목 유형 플래그 (예: '02' = 완제품)

    @Column(name = "P_UNIT_NM")
    private String pUnitNm; // 상위 품목 단위명

    @Column(name = "P_CUST_NM")
    private String pCustNm; // 상위 품목 고객사명

    @Column(name = "P_CYCLE_TIME")
    private Integer pCycleTime; // 상위 품목 생산성 (Cycle Time)

    // --- 하위 품목 (원자재) 정보 ---
    @Column(name = "S_ITEM_NM")
    private String sItemNm; // 하위 품목명

    @Column(name = "S_ITEM_FLAG")
    private String sItemFlag; // 하위 품목 유형 플래그 (예: '01' = 자재)

    @Column(name = "S_UNIT_NM")
    private String sUnitNm; // 하위 품목 단위명

    @Column(name = "S_CUST_NM")
    private String sCustNm; // 하위 품목 고객사명

    // --- BOM 및 원가 관련 정보 ---
    @Column(name = "BOM_USE_QTY")
    private BigDecimal  bomUseQty; // BOM 소요량 (소수점 3자리 포함 가능성에 따라 BigDecimal)

    @Column(name = "S_ITEM_UNIT_PRICE")
    private BigDecimal sItemUnitPrice; // 하위 품목의 개별 단가 (소수점 3자리까지 포함 가능성에 따라 BigDecimal)

    @Column(name = "S_ITEM_CALCULATED_COST")
    private BigDecimal sItemCalculatedCost; // 하위 품목의 계산된 원가 (소요량 * 단가)

    @Column(name = "P_TOTAL_COST")
    private BigDecimal pTotalRawMaterialCost; // 상위 품목(완제품)의 총 원자재 원가

    // --- 기타 정보 ---
    @Column(name = "CAT_NM")
    private String catNm; // 대분류명 (하위 품목의 대분류)

    
    
    // 기본 생성자, 모든 필드 생성자, getter, setter 필요
    // Lombok으로 대체
}