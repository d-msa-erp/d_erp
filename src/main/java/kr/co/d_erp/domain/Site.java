package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TB_CUSTMST")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Site {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	
    // 거래처 코드 (내부 관리용, 고유값)
    @Column(name = "CUST_CD", nullable = false, unique = true)
    private String custCd;

    // 거래처명
    @Column(name = "CUST_NM", nullable = false)
    private String custNm;

    // 거래처 이메일 (고유값)
    @Column(name = "CUST_E_MAIL", unique = true)
    private String custEmail;

    // 대표자명
    @Column(name = "PRESIDENT_NM")
    private String presidentNm;

    // 사업자번호 (고유값)
    @Column(name = "BIZ_NO", unique = true)
    private String bizNo;

    // 사업장 번호
    @Column(name = "COMP_NO")
    private String compNo;

    // 법인등록번호 (nullable)
    @Column(name = "CORP_REG_NO")
    private String corpRegNo;

    // 업종
    @Column(name = "BIZ_COND")
    private String bizCond;

    // 업태
    @Column(name = "BIZ_ITEM")
    private String bizItem;

    // 주소
    @Column(name = "BIZ_ADDR")
    private String bizAddr;

    // 전화번호
    @Column(name = "BIZ_TEL")
    private String bizTel;

    // 팩스번호 (nullable)
    @Column(name = "BIZ_FAX")
    private String bizFax;


    // 거래처 구분 코드 (01: 매입처, 02: 고객사, 03: 사업장)
    @Column(name = "BIZ_FLAG")
    private String bizFlag;
	

}