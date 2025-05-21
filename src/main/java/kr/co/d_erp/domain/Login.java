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
@Table(name = "TB_USERMST")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Login {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // USER_IDX가 자동 생성되는 PK일 경우 사용 (시퀀스 사용 시 SEQUENCE 전략)
    @Column(name = "USER_IDX", nullable = false) // 사용자 고유 인덱스 (Primary Key)
    private Long userIdx;

    @Column(name = "USER_ID", nullable = false, unique = true, length = 20) // 사용자 아이디 (로그인용)
    private String userId;

    @Column(name = "USER_PSWD", nullable = false, length = 100) // 사용자 비밀번호 (평문 저장 가정, 추후 암호화 필요)
    private String userPswd;

    @Column(name = "USER_NM", length = 50) // 사용자 이름
    private String userNm;

    @Column(name = "USER_E_MAIL", length = 100) // 사용자 이메일
    private String userEmail;

    @Column(name = "USER_TEL", length = 20) // 사용자 전화번호
    private String userTel;

    @Column(name = "USER_HP", length = 20) // 사용자 휴대폰 번호
    private String userHp;

    @Column(name = "USER_DEPT", length = 50) // 사용자 부서
    private String userDept;

    @Column(name = "USER_POSITION", length = 50) // 사용자 직위
    private String userPosition;

    @Column(name = "HIRE_DT") // 입사일 (YYYY-MM-DD 형식의 날짜)
    private String hireDt;

    @Column(name = "RETIRE_DT") // 퇴사일 (YYYY-MM-DD 형식의 날짜)
    private String retireDt;

    @Column(name = "USER_ROLE", length = 10) // 사용자 권한
    private String userRole;

    @Column(name = "USER_STATUS", length = 10) // 사용자 상태
    private String userStatus;
}
