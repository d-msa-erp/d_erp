package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TB_BOMDTL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "bom_seq_gen")
    @SequenceGenerator(name = "bom_seq_gen", sequenceName = "ISEQ$$_74446", allocationSize = 1)
    @Column(name = "BOM_IDX")
    private Long bomIdx;

    @Column(name = "P_ITEM_IDX", nullable = false)
    private Long parentItemIdx;

    @Column(name = "S_ITEM_IDX", nullable = false)
    private Long subItemIdx;

    @Column(name = "SEQ_NO", nullable = false)
    private Integer seqNo;

    @Column(name = "USE_QTY", nullable = false)
    private Double useQty;

    @Column(name = "LOSS_RT", nullable = false)
    private Double lossRate;

    @Column(name = "ITEM_PRICE", nullable = false)
    private Double itemPrice;

    @Column(name = "REMARK")
    private String remark;
}
