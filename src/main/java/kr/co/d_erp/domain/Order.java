package kr.co.d_erp.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import kr.co.d_erp.dtos.Itemmst;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TB_ORDER", uniqueConstraints = {
    @UniqueConstraint(name = "UQ_TB_ORDER_CODE", columnNames = "ORDER_CODE")
})
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ORDER_IDX")
    private Long orderIdx;

    @Column(name = "ORDER_CODE", length = 20, nullable = false, unique = true)
    private String orderCode;

    @Column(name = "ORDER_TYPE", length = 1, nullable = false)
    private String orderType;  // 'S' or 'P'

    @Column(name = "ORDER_DATE", nullable = false)
    private LocalDate orderDate;

    @Column(name = "CUST_IDX", nullable = false)
    private Long custIdx;

    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx; // ID 필드는 읽기 전용으로 (JPA가 관계를 통해 ID를 관리)

    @Column(name = "ORDER_QTY", nullable = false)
    private Integer orderQty;

    @Column(name = "UNIT_PRICE", nullable = false)
    private Long unitPrice;

    @Column(name = "TOTAL_AMOUNT", nullable = false)
    private Long totalAmount;

    @Column(name = "DELIVERY_DATE", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "ORDER_STATUS", length = 2, nullable = false)
    private String orderStatus; // ('S1', 'S2', 'S3', 'P1', 'P2', 'P3')

    @Column(name = "EXPECTED_WH_IDX")
    private Long expectedWhIdx;

    @Column(name = "USER_IDX")
    private Long userIdx;

    @Column(name = "REMARK", length = 500)
    private String remark;

    @Column(name = "CREATED_DATE", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;
    
    /*
    @ManyToOne(fetch = FetchType.LAZY) // LAZY 로딩 권장
    @JoinColumn(name = "CUST_IDX", referencedColumnName = "CUST_IDX", insertable = false, updatable = false)
    private Custmst customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_IDX", referencedColumnName = "ITEM_IDX")
    private Itemmst item;     // 객체 관계 매핑이 ITEM_IDX 컬럼을 실제로 관리
    */
}
