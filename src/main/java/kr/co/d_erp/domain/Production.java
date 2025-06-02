package kr.co.d_erp.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "TB_PRODUCTION")
public class Production {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PROD_IDX")
    private Long prodIdx;

    @Column(name = "PROD_CODE", nullable = false, unique = true, length = 20)
    private String prodCode;

    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx;

    @Column(name = "ORDER_IDX")
    private Long orderIdx;

    @Column(name = "PROD_QTY", nullable = false)
    private BigDecimal prodQty;

    @Column(name = "PROD_DATE", nullable = false)
    private LocalDate prodDate;

    @Column(name = "PROD_COMPLETION_DATE")
    private LocalDate prodCompletionDate;

    @Column(name = "PROD_STATUS", nullable = false, length = 2)
    private String prodStatus;

    @Column(name = "TARGET_WH_IDX")
    private Long targetWhIdx;

    @Column(name = "USER_IDX")
    private Long userIdx;

    @Column(name = "CREATED_DATE", nullable = false)
    private LocalDate createdDate = LocalDate.now();

    @Column(name = "UPDATED_DATE")
    private LocalDate updatedDate;
}