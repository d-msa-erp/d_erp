package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.*;
// import java.time.LocalDateTime; // 기존 필드 유지 시 필요
// import java.math.BigDecimal; // 기존 숫자 필드 유지 시 필요

@Entity
@Table(name = "TB_ITEMMST")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // 모든 필드 생성자가 필요하다면 유지
@Builder // Builder 패턴 사용 시 유지
public class Itemmst {

    @Id
    // DDL이 GENERATED BY DEFAULT ON NULL AS IDENTITY 이므로, GenerationType.IDENTITY가 더 적합할 수 있습니다.
    // 시퀀스를 계속 사용하신다면 Oracle DB에 ITEMMST_SEQ 시퀀스가 존재해야 합니다.
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 또는 기존 시퀀스 전략 유지
    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx;

    @Column(name = "ITEM_CD", unique = true, length = 10, nullable = false) // DDL 기준 length 10
    private String itemCd;

    @Column(name = "ITEM_NM", length = 100, nullable = false)
    private String itemNm;

    // === 오류 해결을 위해 추가/수정된 필드 ===
    @Column(name = "ITEM_FLAG", length = 2, nullable = false)
    private String itemFlag; // TB_ITEMMST DDL의 ITEM_FLAG 컬럼과 매핑

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CUST_IDX", nullable = false) // DDL의 CUST_IDX 컬럼을 참조
    private Custmst custmst; // Custmst 엔티티와의 관계 매핑 (주거래처)
                               // ItemmstRepository의 i.custmst.custIdx 사용을 위해 필요

    // === 기존에 정의하셨던 필드들 (DDL과 비교하여 타입 및 이름 검토 필요) ===
    @Column(name = "ITEM_SPEC", length = 100)
    private String itemSpec;

    // DDL에서는 ITEM_CAT1, ITEM_CAT2가 NUMBER 타입이고 TB_ITEM_CAT의 IDX를 참조했습니다.
    // 현재는 CD로 되어있어, 만약 관계 매핑이 필요하면 ItemCat 엔티티와 @ManyToOne으로 연결해야 합니다.
    // 여기서는 Datalist 쿼리에 직접 필요하지 않으므로 일단 문자열 코드로 유지합니다.
    // 실제로는 ItemCat 엔티티와 관계를 맺는 것이 좋습니다. (예: private ItemCat itemCat1Entity;)
    @Column(name = "ITEM_CAT1") // DDL은 ITEM_CAT1 (NUMBER), 현재는 ITEM_CAT1_CD (VARCHAR2)로 되어있음. DDL 기준으로 수정.
    private Long itemCat1;      // DDL 기준 NUMBER 타입이므로 Long으로 가정. 실제로는 ItemCat 엔티티와 매핑.
                                // 만약 ITEM_CAT1_CD를 그대로 사용해야 한다면, Repository 쿼리도 수정 필요.

    @Column(name = "ITEM_CAT2") // DDL은 ITEM_CAT2 (NUMBER), 현재는 ITEM_CAT2_CD (VARCHAR2)로 되어있음. DDL 기준으로 수정.
    private Long itemCat2;      // DDL 기준 NUMBER 타입이므로 Long으로 가정. 실제로는 ItemCat 엔티티와 매핑.

    @Column(name = "ITEM_UNIT") // DDL은 ITEM_UNIT (NUMBER), 현재는 ITEM_UNIT_CD (VARCHAR2)로 되어있음. DDL 기준으로 수정.
    private Long itemUnit;      // DDL 기준 NUMBER 타입이므로 Long으로 가정. 실제로는 UnitMst 엔티티와 매핑.

    @Column(name = "ITEM_COST", nullable = false) // DDL 기준 NOT NULL
    private Double itemCost; // DDL은 NUMBER. Double 또는 BigDecimal 사용.

    // @Column(name = "ITEM_PRICE") // DDL에는 ITEM_PRICE 컬럼이 없습니다. 필요시 DDL에 추가해야 함.
    // private Double itemPrice;

    // itemCustIdx 필드는 위 custmst 객체 매핑으로 대체되었으므로 주석 처리하거나 삭제합니다.
    // @Column(name = "ITEM_CUST_IDX") // 이 필드는 custmst 필드로 대체됨
    // private Long itemCustIdx;

    @Column(name = "REMARK", length = 100) // DDL 기준 length 100
    private String remark;

    // DDL에는 OPTIMAL_INV, CYCLE_TIME, USE_FLAG, REG_DT, REG_USER_IDX, MOD_DT, MOD_USER_IDX 컬럼들이 있습니다.
    // 현재 엔티티 코드에는 OPTIMAL_INV, CYCLE_TIME이 빠져있고, USE_FLAG, REG_DT 등은 DDL과 이름/타입이 다를 수 있습니다.
    // 필요에 따라 DDL 기준으로 필드를 추가/수정해야 합니다.
    // 예시:
    // @Column(name = "OPTIMAL_INV", precision = 12, scale = 2, nullable = false)
    // private BigDecimal optimalInv;

    // @Column(name = "USE_FLAG", length = 1, nullable = false) // DDL에는 이 컬럼이 없었음. 만약 있다면 추가.
    // 현재 코드에는 useFlag가 있으나 DDL(Script-9.sql)의 TB_ITEMMST에는 없음.
    // 만약 DDL에 있다면 @Column(name="USE_FLAG")으로 매핑.
    // 없다면 이 필드는 엔티티에서 제거하거나 @Transient 처리.
    // 여기서는 DDL에 없으므로 일단 주석처리 또는 삭제 고려. DDL에 있다면 사용.
    // private String useFlag; // 이 필드가 DDL에 있는지 확인 필요


    // @Column(name = "REG_DT", columnDefinition="TIMESTAMP DEFAULT SYSDATE") // DDL은 DATE DEFAULT SYSDATE
    // private LocalDateTime regDt;

    // @Column(name = "REG_USER_IDX")
    // private Long regUserIdx;

    // @Column(name = "MOD_DT")
    // private LocalDateTime modDt;

    // @Column(name = "MOD_USER_IDX")
    // private Long modUserIdx;
}