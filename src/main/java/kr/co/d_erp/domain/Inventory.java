package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_INVENTORY")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "inventory_seq")
    @SequenceGenerator(name = "inventory_seq", sequenceName = "INVENTORY_SEQ", allocationSize = 1)
    @Column(name = "INV_IDX", nullable = false)
    private Long invIdx;

    @Column(name = "WH_IDX", nullable = false)
    private Long whIdx;

    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx;

    @Column(name = "STOCK_QTY", nullable = false) 
    private Double stockQty; 

    @Column(name = "REG_DT")
    private LocalDateTime regDt;

    @Column(name = "REG_USER_IDX")
    private Long regUserIdx;

    @Column(name = "MOD_DT")
    private LocalDateTime modDt;

    @Column(name = "MOD_USER_IDX")
    private Long modUserIdx;
}