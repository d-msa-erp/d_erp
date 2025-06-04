package kr.co.d_erp.domain;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TB_ITEMMST")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class SeonikItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ITEM_IDX")
    private Long itemIdx;

    @Column(name = "ITEM_CD", nullable = false, unique = true, length = 10)
    private String itemCd;

    @Column(name = "ITEM_NM", nullable = false, length = 100)
    private String itemNm;

    @Column(name = "ITEM_FLAG", nullable = false, length = 2)
    private String itemFlag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_CAT1", nullable = false)
    private ItemCategory itemCat1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_CAT2", nullable = false)
    private ItemCategory itemCat2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CUST_IDX", nullable = false)
    private Custmst customer;

    @Column(name = "ITEM_SPEC", length = 100)
    private String itemSpec;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_UNIT", nullable = false)
    private Unit itemUnit;

    @Column(name = "ITEM_COST", nullable = false)
    private Integer itemCost;

    @Column(name = "OPTIMAL_INV", nullable = false)
    private BigDecimal optimalInv;

    @Column(name = "CYCLE_TIME")
    private BigDecimal cycleTime;
    
    @Column(name = "REMARK", length = 100)
    private String remark;
}
