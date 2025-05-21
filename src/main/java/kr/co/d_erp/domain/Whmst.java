package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_WHMST") // 데이터베이스 테이블명과 매핑
@SequenceGenerator(
    name = "whmst_seq_generator",
    sequenceName = "TB_WHMST_WH_IDX_SEQ", // 오라클 시퀀스 이름
    initialValue = 1,
    allocationSize = 1
)
public class Whmst {

    @Id
    @GeneratedValue(
        strategy = GenerationType.SEQUENCE,
        generator = "whmst_seq_generator"
    )
    @Column(name = "WH_IDX")
    private Long whIdx;

    @Column(name = "WH_CD", nullable = false, length = 10, unique = true)
    private String whCd; // 창고 코드

    @Column(name = "WH_NM", nullable = false, length = 50)
    private String whNm; // 창고명

    @Column(name = "REMARK", length = 200)
    private String remark; // 비고

    @Column(name = "WH_TYPE1", nullable = false, length = 1)
    private String whType1; // 자재창고 여부 ('Y'/'N')

    @Column(name = "WH_TYPE2", nullable = false, length = 1)
    private String whType2; // 제품창고 여부 ('Y'/'N')

    @Column(name = "WH_TYPE3", nullable = false, length = 1)
    private String whType3; // 반품창고 여부 ('Y'/'N')

    @Column(name = "USE_FLAG", nullable = false, length = 1)
    private String useFlag; // 사용 여부 ('Y'/'N')

    @Column(name = "WH_LOCATION", nullable = false, length = 200)
    private String whLocation; // 창고 위치

    @Column(name = "WH_USER_IDX")
    private Long whUserIdx; // 담당 사원 고유 번호 (FK)

    // DTO 변환을 위한 메서드 (필요시 WhmstDto를 별도 생성하여 활용)
    // 여기서는 일단 엔티티 그대로 사용합니다.
}