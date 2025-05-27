package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable; // Hibernate 전용


import java.math.BigDecimal;
import java.time.LocalDateTime; // Java 8 날짜/시간 API 사용

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "V_WAREHOUSE_INVENTORY_DETAIL") // SQL 뷰 이름과 매핑
@Immutable // 이 엔티티는 읽기 전용임을 명시
public class WarehouseInventoryDetailView {

    // 뷰의 기본 키는 뷰의 데이터 고유성을 보장할 수 있는 컬럼 조합으로 지정해야 합니다.
    // 여기서는 INV_IDX가 NULL일 수 있으므로, 복합 키를 사용하는 것이 더 견고할 수 있습니다.
    // 복합 키를 사용하려면 별도의 @IdClass나 @EmbeddedId를 만들어야 합니다.
    // 단순화를 위해 일단 INV_IDX를 @Id로 하되, 실제 데이터에서 INV_IDX가 NULL인 경우
    // JPA가 해당 레코드를 매핑하지 않을 수 있음을 인지해야 합니다.
    // 모든 행을 매핑하려면 뷰에 ROW_NUMBER() OVER (...) 같은 고유 ID 컬럼을 추가하는 것이 좋습니다.
    @Id
    @Column(name = "INV_IDX")
    private Long invIdx; // 재고가 없는 창고는 NULL이 될 수 있으므로 주의 필요

    // 창고 정보
    @Column(name = "WH_IDX")
    private Long whIdx;
    @Column(name = "WH_CD")
    private String whCd;
    @Column(name = "WH_NM")
    private String whNm;
    @Column(name = "WH_REMARK")
    private String whRemark;
    @Column(name = "WH_TYPE1")
    private String whType1;
    @Column(name = "WH_TYPE2")
    private String whType2;
    @Column(name = "WH_TYPE3")
    private String whType3;
    @Column(name = "USE_FLAG")
    private String useFlag;
    @Column(name = "WH_LOCATION")
    private String whLocation;

    // 창고 담당 사원 정보
    @Column(name = "WH_USER_ID")
    private String whUserId;
    @Column(name = "WH_USER_NM")
    private String whUserNm; // Usermst.userNm
    @Column(name = "WH_USER_EMAIL")
    private String whUserEmail;
    @Column(name = "WH_USER_TEL")
    private String whUserTel;
    @Column(name = "WH_USER_HP")
    private String whUserHp;
    @Column(name = "WH_USER_DEPT")
    private String whUserDept;
    @Column(name = "WH_USER_POSITION")
    private String whUserPosition;

    // 재고 정보
    @Column(name = "STOCK_QTY")
    private BigDecimal stockQty;
    @Column(name = "INV_CREATED_DATE")
    private LocalDateTime invCreatedDate;
    @Column(name = "INV_UPDATED_DATE")
    private LocalDateTime invUpdatedDate;

    // 재고 품목 정보
    @Column(name = "ITEM_IDX")
    private Long itemIdx;
    @Column(name = "ITEM_CD")
    private String itemCd;
    @Column(name = "ITEM_NM")
    private String itemNm;
    @Column(name = "ITEM_FLAG")
    private String itemFlag;
    @Column(name = "ITEM_SPEC")
    private String itemSpec;
    @Column(name = "ITEM_COST")
    private Double itemCost;
    @Column(name = "OPTIMAL_INV")
    private Double optimalInv;
    @Column(name = "CYCLE_TIME")
    private Double cycleTime;
    @Column(name = "ITEM_REMARK")
    private String itemRemark;

    // 품목 분류 정보
    @Column(name = "ITEM_CAT1_CD")
    private String itemCat1Cd;
    @Column(name = "ITEM_CAT1_NM")
    private String itemCat1Nm;
    @Column(name = "ITEM_CAT2_CD")
    private String itemCat2Cd;
    @Column(name = "ITEM_CAT2_NM")
    private String itemCat2Nm;

    // 품목 단위 정보
    @Column(name = "ITEM_UNIT_NM")
    private String itemUnitNm;

    // 품목 주 거래처 정보
    @Column(name = "ITEM_CUST_CD")
    private String itemCustCd;
    @Column(name = "ITEM_CUST_NM")
    private String itemCustNm;
}