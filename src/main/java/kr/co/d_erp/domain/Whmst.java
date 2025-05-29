package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "TB_WHMST") // 실제 창고 테이블 이름
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Whmst {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "whmst_seq_generator")
    @SequenceGenerator(name = "whmst_seq_generator", sequenceName = "WHMST_SEQ", allocationSize = 1) // 실제 시퀀스 이름 확인
    @Column(name = "WH_IDX")
    private Long whIdx;

    @Column(name = "WH_CD", insertable = false, updatable = false)
    private String whCd;

    @Column(name = "WH_NM")
    private String whNm;

    @Column(name = "REMARK")
    private String remark;

    @Column(name = "WH_TYPE1")
    private String whType1;

    @Column(name = "WH_TYPE2")
    private String whType2;

    @Column(name = "WH_TYPE3")
    private String whType3;

    @Column(name = "USE_FLAG")
    private String useFlag;

    @Column(name = "WH_LOCATION")
    private String whLocation;

    @ManyToOne(fetch = FetchType.LAZY) // ManyToOne 관계 (창고는 한 명의 담당자를 가짐)
    @JoinColumn(name = "WH_USER_IDX", referencedColumnName = "USER_IDX") // WH_USER_IDX 컬럼이 Usermst 엔티티의 USER_IDX를 참조
    private Usermst whUser; // Usermst 엔티티 타입의 필드 (관계의 주체)

}