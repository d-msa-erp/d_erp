package kr.co.d_erp.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "TB_CUSTMST")
@Getter
@Setter
public class CustomerForItemDto {
    @Id
    @Column(name = "CUST_IDX")
    private Integer custIdx;

    @Column(name = "CUST_NM")
    private String custNm;
}