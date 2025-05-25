package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "V_ITEM_DETAILS") 
@Immutable
@Data
public class VItemDetailsForBom {
	
    @Id
    @Column(name = "ITEM_IDX")
    private Long itemIdx;

    @Column(name = "ITEM_CD")
    private String itemCd;

    @Column(name = "ITEM_NM")
    private String itemNm;

    @Column(name = "ITEM_SPEC")
    private String itemSpec;

    @Column(name = "ITEM_UNIT_NM")
    private String itemUnitNm;

    @Column(name = "ITEM_FLAG")
    private String itemFlag;

    @Column(name = "REMARK")
    private String remark;

    @Column(name = "OPTIMAL_INV")
    private Double optimalInv;

    @Column(name = "CYCLE_TIME")
    private Double cycleTime;
}