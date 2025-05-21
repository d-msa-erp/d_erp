package kr.co.d_erp.dtos;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class WhmstDto {
    private Long whIdx; // 신규 등록 시에는 null, 수정 시에는 값 존재
    private String whCd; // 프론트에서 입력받지 않지만, 응답 시에는 포함될 수 있음
    private String whNm;
    private String remark;
    private String whType1; // 'Y' or 'N'
    private String whType2; // 'Y' or 'N'
    private String whType3; // 'Y' or 'N'
    private String useFlag; // 'Y' or 'N'
    private String whLocation;
    // private Long whUserIdx; // 담당 사원 IDX는 백엔드에서 자동 처리
}