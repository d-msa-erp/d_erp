package kr.co.d_erp.dtos;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyPageDto {
private Long userIdx;//수정불가
private String userId;//수정불가
private String userNm;//유저명
private String userEMail;//이메일
private String userTel;//직통번호
private String userHp;//핸드폰번호
private String userDept;//수정불가, 부서명
private String userPosition;//수정불가, 직책
private LocalDateTime userHireDt;//수정불가
private LocalDateTime userRetireDt;//수정불가, 퇴사일
private String userRole;//수정불가, 권한
private String userStatus;//수정불가, 상태

}
