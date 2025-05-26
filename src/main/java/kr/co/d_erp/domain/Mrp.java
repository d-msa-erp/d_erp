package kr.co.d_erp.domain;

import java.math.BigDecimal;

import java.sql.Date;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Entity
@Table(name="TB_MRP")
@Data
public class Mrp {
	@Id
    @Column(name = "MRP_IDX")
    // @GeneratedValue(...) // 시퀀스 사용 시 필요
    private Long mrpIdx;

    @Column(name = "ORDER_IDX", nullable = false)
    private Long orderIdx;

    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx; // 소요 자재/반제품의 ITEM_IDX

    @Column(name = "UNIT_IDX")
    private Long unitIdx;

    @Column(name = "REQUIRED_QTY")
    private BigDecimal requiredQty;

    @Column(name = "CALCULATED_COST")
    private BigDecimal calculatedCost;

    @Column(name = "REQUIRE_DATE")
    private LocalDate requireDate;

    @Column(name = "STATUS", length = 2)
    private String status;

    @Column(name = "REMARK", length = 500)
    private String remark;

    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDate createdDate;

    @Column(name = "UPDATED_DATE")
    private LocalDate updatedDate;
}
