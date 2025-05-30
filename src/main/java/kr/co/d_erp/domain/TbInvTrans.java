package kr.co.d_erp.domain;
import java.math.BigDecimal;
import java.time.LocalDate; 
import java.time.LocalDateTime; 

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TB_INV_TRANS")
@Data
@NoArgsConstructor
public class TbInvTrans {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Oracle DDL의 GENERATED BY DEFAULT ON NULL AS IDENTITY에 해당
    @Column(name = "INV_TRANS_IDX")
    private Long invTransIdx;

    @Column(name = "INV_TRANS_CODE", length = 20, nullable = false, unique = true,
            insertable = false, updatable = false) // DB 트리거로 자동 생성되므로 insertable/updatable false
    private String invTransCode;

    @Column(name = "TRANS_TYPE", length = 1, nullable = false)
    private String transType; // 'R': 입고, 'S': 출고

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ORDER_IDX") // 외래 키, TB_ORDER 테이블 참조, Null 허용
    private Order tbOrder; // kr.co.d_erp.domain.Order 엔티티 (또는 TbOrder)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WH_IDX", nullable = false) // 외래 키, TB_WHMST 테이블 참조
    private Whmst whmst; // kr.co.d_erp.domain.Whmst 엔티티

    @Column(name = "TRANS_DATE", nullable = false)
    private LocalDate transDate; // DDL의 DATE DEFAULT SYSDATE NOT NULL

    @Column(name = "TRANS_QTY", nullable = false)
    private BigDecimal transQty; // DDL의 NUMBER NOT NULL

    @Column(name = "TRANS_STATUS", length = 2, nullable = false)
    private String transStatus; // 예: R1, R2, R3, S1, S2

    @Column(name = "UNIT_PRICE") // Null 허용
    private BigDecimal unitPrice; // DDL의 NUMBER

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_IDX") // 외래 키, TB_USERMST 테이블 참조, Null 허용
    private Usermst usermst; // kr.co.d_erp.domain.Usermst 엔티티

    @Column(name = "REMARK", length = 500)
    private String remark;

    @CreationTimestamp // JPA/Hibernate가 엔티티 생성 시 현재 시간 자동 삽입
    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDateTime createdDate; // DDL의 DATE DEFAULT SYSDATE NOT NULL

    @UpdateTimestamp // JPA/Hibernate가 엔티티 수정 시 현재 시간 자동 업데이트
    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate; // DDL의 DATE

}