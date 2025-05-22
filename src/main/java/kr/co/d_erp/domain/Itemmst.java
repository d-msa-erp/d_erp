package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.math.BigDecimal; // BigDecimal 사용을 위해 임포트

@Entity
@Table(name = "TB_ITEMMST")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Itemmst {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "itemmst_seq")
    @SequenceGenerator(name = "itemmst_seq", sequenceName = "ITEMMST_SEQ", allocationSize = 1)
    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx;

    @Column(name = "ITEM_CD", unique = true, length = 50, nullable = false)
    private String itemCd;

    @Column(name = "ITEM_NM", length = 100, nullable = false)
    private String itemNm;

    @Column(name = "ITEM_SPEC", length = 100)
    private String itemSpec;

    @Column(name = "ITEM_CAT1_CD", length = 10)
    private String itemCat1Cd;

    @Column(name = "ITEM_CAT2_CD", length = 10)
    private String itemCat2Cd;

    @Column(name = "ITEM_UNIT_CD", length = 10)
    private String itemUnitCd;

    @Column(name = "ITEM_COST") 
    private Double itemCost;

    @Column(name = "ITEM_PRICE") 
    private Double itemPrice;

    @Column(name = "ITEM_CUST_IDX")
    private Long itemCustIdx;

    @Column(name = "REMARK", length = 500)
    private String remark;

    @Column(name = "USE_FLAG", length = 1, nullable = false)
    private String useFlag;

    @Column(name = "REG_DT")
    private LocalDateTime regDt;

    @Column(name = "REG_USER_IDX")
    private Long regUserIdx;

    @Column(name = "MOD_DT")
    private LocalDateTime modDt;

    @Column(name = "MOD_USER_IDX")
    private Long modUserIdx;
}