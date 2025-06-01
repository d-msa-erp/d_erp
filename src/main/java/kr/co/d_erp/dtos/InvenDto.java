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



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_IDX", nullable = false)
    private Itemmst item;
    
    @Column(name = "STOCK_QTY")
    private Long stockQty;
}