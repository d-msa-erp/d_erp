package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor // JSON을 객체로 변환할 때 필요
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 (JPA DTO Projection에 사용)
@Builder // 필요하다면 Builder 패턴 사용
public class WhmstDto {
    private Long whIdx;
    private String whCd;
    private String whNm;
    private String remark;
    private String whType1;
    private String whType2;
    private String whType3;
    private String useFlag;
    private String whLocation;
    private Long whUserIdx;
    private String whUserNm; // 뷰에서 가져올 필드
    private String whUserId; // 뷰에서 가져올 필드
    // createdBy, createdDate, modifiedBy, modifiedDate 등은 엔티티에서만 관리하고 DTO에서는 제외하거나 필요에 따라 추가
}