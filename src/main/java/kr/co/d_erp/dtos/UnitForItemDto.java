package kr.co.d_erp.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "TB_UNIT_MST")
@Getter
@Setter
public class UnitForItemDto {
    @Id
    @Column(name = "UNIT_IDX")
    private Long unitIdx;


    @Column(name = "UNIT_NM")
    private String unitNm;
}
