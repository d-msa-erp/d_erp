package kr.co.d_erp.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TB_CUSTMST",
    uniqueConstraints = {
        @UniqueConstraint(name = "UQ_TB_CUSTMST_CUST_CD", columnNames = "CUST_CD"),
        @UniqueConstraint(name = "UQ_TB_CUSTMST_BIZ_NO", columnNames = "BIZ_NO"),
        @UniqueConstraint(name = "UQ_TB_CUSTMST_CUST_E_MAIL", columnNames = "CUST_E_MAIL"),
        @UniqueConstraint(name = "UQ_TB_CUSTMST_COMP_NO", columnNames = "COMP_NO")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Custmst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CUST_IDX")
    private Long custIdx;

    @Column(name = "CUST_CD", nullable = false, length = 10, insertable = false, updatable = false)
    private String custCd;

    @Column(name = "CUST_NM", nullable = false, length = 50)
    private String custNm;

    @Column(name = "CUST_E_MAIL", nullable = false, length = 100)
    private String custEmail;

    @Column(name = "PRESIDENT_NM", nullable = false, length = 20)
    private String presidentNm;

    @Column(name = "BIZ_NO", nullable = false, length = 10)
    private String bizNo;

    @Column(name = "COMP_NO", nullable = false, length = 20)
    private String compNo;

    @Column(name = "CORP_REG_NO", length = 13)
    private String corpRegNo;

    @Column(name = "BIZ_COND", nullable = false, length = 100)
    private String bizCond;

    @Column(name = "BIZ_ITEM", nullable = false, length = 100)
    private String bizItem;

    @Column(name = "BIZ_ADDR", nullable = false, length = 200)
    private String bizAddr;

    @Column(name = "BIZ_TEL", nullable = false, length = 15)
    private String bizTel;

    @Column(name = "BIZ_FAX", length = 15)
    private String bizFax;

    @Column(name = "COMP_EMP_NM")
    private Long compEmpNm;

    @Column(name = "BIZ_FLAG", nullable = false, length = 2)
    private String bizFlag;
}