package kr.co.d_erp.domain;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
    private Long itemIdx;

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
    private LocalDate createdDate = LocalDate.now();

    @Column(name = "UPDATED_DATE")
    private LocalDate updatedDate;
}
