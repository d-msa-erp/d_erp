package kr.co.d_erp.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Entity
@Table(name = "TB_BOMDTL",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"P_ITEM_IDX", "S_ITEM_IDX"})
       })
@Data
public class BomDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BOM_IDX")
    private Long bomIdx;

    @Column(name = "P_ITEM_IDX", nullable = false)
    private Long parentItemIdx; // ItemMst 대신 Long 타입 ID로 변경

    @Column(name = "S_ITEM_IDX", nullable = false)
    private Long subItemIdx; // ItemMst 대신 Long 타입 ID로 변경

    @Column(name = "USE_QTY", nullable = false, precision = 13, scale = 3)
    private BigDecimal useQty;

    @Column(name = "LOSS_RT", nullable = false, precision = 6, scale = 3)
    private BigDecimal lossRt;

    @Column(name = "ITEM_PRICE", nullable = false, precision = 19, scale = 3)
    private BigDecimal itemPrice;

    @Column(name = "REMARK", length = 500)
    private String remark;

    @Column(name = "SEQ_NO", nullable = false)
    private Integer seqNo;
}