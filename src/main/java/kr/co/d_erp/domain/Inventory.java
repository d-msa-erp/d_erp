package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal; // BigDecimal 사용
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedDate;

//수정했음 오류 발생시 문의 부탁 -나영

@Entity
@Table(name = "TB_INVENTORY",
       uniqueConstraints = { // DDL의 UQ_TB_INVENTORY 제약 조건 반영
           @UniqueConstraint(name = "UQ_TB_INVENTORY", columnNames = {"WH_IDX", "ITEM_IDX"})
       }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)    @SequenceGenerator(name = "inventory_seq", sequenceName = "INVENTORY_SEQ", allocationSize = 1)
    @Column(name = "INV_IDX", nullable = false)
    private Long invIdx;

    @Column(name = "WH_IDX", nullable = false)
    private Long whIdx;

    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx;

    @Column(name = "STOCK_QTY", nullable = false, precision = 12, scale = 2) // DDL의 NUMBER(12,2) 반영
    private BigDecimal stockQty; // Double에서 BigDecimal로 변경

    @CreationTimestamp
    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @UpdateTimestamp
    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate; // Long에서 LocalDateTime으로 타입 변경

    // === JPA 생명주기 콜백을 사용하여 createdDate, updatedDate 직접 설정 (Auditing 미사용 시) ===
    // 만약 JPA Auditing을 사용하지 않는다면, 아래와 같이 엔티티 저장/수정 시점에 날짜를 자동으로 설정할 수 있습니다.
    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}