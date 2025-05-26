package kr.co.d_erp.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "TB_ITEM_CAT")
@Getter
@Setter
public class CatDto {
    @Id
    @Column(name = "CAT_IDX")
    private Integer catIdx;

    @Column(name = "CAT_NM")
    private String catNm;

    @Column(name = "PARENT_IDX")
    private Integer parentIdx; // 대분류의 경우 null 또는 0
}
