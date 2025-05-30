package kr.co.d_erp.dtos;

import jakarta.persistence.Column;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "TB_INVENTORY")
@Getter
@Setter
public class InvenDto {
    @Id
    @Column(name = "INV_IDX")
    private Integer invIdx;

    @ManyToOne // Inventory가 Item을 참조하고, Item의 PK가 Inventory의 PK로 사용될 경우 @MapsId 사용 OneToOne > ManyToOne 변경 -민섭
    @JoinColumn(name = "ITEM_IDX", referencedColumnName = "ITEM_IDX")
    private Itemmst item;

    /*
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_IDX", nullable = false)
    private Itemmst item;
    */
    
    @Column(name = "STOCK_QTY")
    private Long stockQty;
}