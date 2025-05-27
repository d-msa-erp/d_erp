package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor; // JPA는 기본 생성자를 필요로 합니다.
import org.hibernate.annotations.Immutable; // Hibernate 사용 시

import java.math.BigDecimal;
import java.time.LocalDate; // 또는 LocalDateTime, 뷰의 DATE 타입에 따라 결정

@Entity
@Immutable // 이 엔티티는 수정 불가능함을 명시 (읽기 전용)
@Table(name = "V_INV_TRANSACTION_DETAILS")
@Getter
@NoArgsConstructor // JPA 프록시 및 객체 생성 시 필요
public class VInvTransactionDetails {

    @Id
    @Column(name = "INV_TRANS_IDX")
    private Long invTransIdx;

    @Column(name = "INV_TRANS_CODE")
    private String invTransCode;

    @Column(name = "TRANS_TYPE")
    private String transType;

    @Column(name = "TRANS_DATE")
    private LocalDate transDate; // Oracle DATE는 시간까지 포함할 수 있으므로 LocalDateTime이 더 적절할 수 있음

    @Column(name = "TRANS_QTY")
    private BigDecimal transQty;

    @Column(name = "UNIT_PRICE")
    private BigDecimal unitPrice;

    @Column(name = "TRANS_STATUS")
    private String transStatus;

    @Column(name = "INV_TRANS_REMARK")
    private String invTransRemark;

    @Column(name = "ORDER_IDX")
    private Long orderIdx;

    // Warehouse Info
    @Column(name = "WH_IDX")
    private Long whIdx;

    @Column(name = "WAREHOUSE_CODE") // 뷰에서 사용한 별칭
    private String warehouseCode;

    @Column(name = "WH_NM")
    private String whNm;

    // User Info
    @Column(name = "USER_IDX")
    private Long userIdx;

    @Column(name = "EMPLOYEE_ID") // 뷰에서 사용한 별칭
    private String employeeId;

    @Column(name = "USER_NM")
    private String userNm;

    // Item Info
    @Column(name = "ITEM_IDX")
    private Long itemIdx;

    @Column(name = "ITEM_CD")
    private String itemCd;

    @Column(name = "ITEM_NM")
    private String itemNm;

    @Column(name = "ITEM_UNIT_NM")
    private String itemUnitNm;

    // Customer Info
    @Column(name = "CUST_IDX")
    private Long custIdx;

    @Column(name = "CUST_CD")
    private String custCd;

    @Column(name = "CUST_NM")
    private String custNm;

    @Column(name = "ORDER_CODE")
    private String orderCode;

    // Lombok @Getter가 모든 필드에 대한 getter를 생성합니다.
    // @Immutable이므로 Setter는 필요 없습니다.
}