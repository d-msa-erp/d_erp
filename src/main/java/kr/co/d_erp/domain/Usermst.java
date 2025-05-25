package kr.co.d_erp.domain;

import java.time.LocalDate;
// import java.time.LocalDateTime; // 기존 LocalDateTime 필드를 유지한다면 필요

import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

// import com.fasterxml.jackson.annotation.JsonIgnore; // 이 줄은 제거하거나 주석 처리
import com.fasterxml.jackson.annotation.JsonProperty; // 이 줄 추가

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import kr.co.d_erp.models.PasswordHandler; // PasswordHandler 경로 확인
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
@Table(name = "TB_USERMST",
        uniqueConstraints = {
                @UniqueConstraint(name = "UQ_TB_USERMST_USER_ID", columnNames = {"USER_ID"}),
                @UniqueConstraint(name = "UQ_TB_USERMST_USER_E_MAIL", columnNames = {"USER_E_MAIL"}),
                @UniqueConstraint(name = "UQ_TB_USERMST_USER_TEL", columnNames = {"USER_TEL"}),
                @UniqueConstraint(name = "UQ_TB_USERMST_USER_HP", columnNames = {"USER_HP"})
        }
)
@DynamicInsert
@DynamicUpdate
public class Usermst {

    @Transient
    private PasswordHandler passwordHandler;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Oracle IDENTITY 컬럼에 더 적합할 수 있음
    @Column(name = "USER_IDX")
    private Long userIdx;

    @Column(name = "USER_ID", length = 10, nullable = false)
    private String userId;

    @Column(name = "USER_PSWD", length = 100, nullable = false)
    // @JsonIgnore // 기존 @JsonIgnore 제거
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) // 수정된 부분: 쓰기 전용으로 설정
    private String userPswd;

    @Column(name = "USER_NM", length = 50, nullable = false)
    private String userNm;

    @Column(name = "USER_E_MAIL", length = 30, nullable = false)
    private String userEmail;

    @Column(name = "USER_TEL", length = 20, nullable = false)
    private String userTel;

    @Column(name = "USER_HP", length = 20, nullable = false)
    private String userHp;

    @Column(name = "USER_DEPT", length = 20, nullable = false)
    private String userDept;

    @Column(name = "USER_POSITION", length = 20, nullable = false)
    private String userPosition;

    @Column(name = "HIRE_DT", nullable = false)
    private LocalDate hireDt;

    @Column(name = "RETIRE_DT")
    private LocalDate retireDt;

    @Column(name = "USER_ROLE", length = 2, nullable = false, columnDefinition = "VARCHAR2(2) DEFAULT '01'")
    private String userRole;

    @Column(name = "USER_STATUS", length = 2, nullable = false, columnDefinition = "VARCHAR2(2) DEFAULT '01'")
    private String userStatus;
    
    // 기존 LocalDateTime 필드들을 유지한다면 해당 import 및 필드 타입 유지
    // @Column(name = "REG_DT")
    // private LocalDateTime regDt;
    // ... 등등

    @PrePersist
    protected void onCreate() {
        if (this.userRole == null) {
            this.userRole = "01";
        }
        if (this.userStatus == null) {
            this.userStatus = "01";
        }
        // regDt 등 다른 필드 초기화 로직 추가 가능
    }

    // ========== 비밀번호 관련 편의 메서드 (PasswordHandler 위임) ==========
    
    public void setPasswordHandler(PasswordHandler passwordHandler) {
        this.passwordHandler = passwordHandler;
    }
    
    public void setRawPassword(String rawPassword) {
        if (this.passwordHandler == null) {
            // 서비스 계층에서 이미 passwordHandler를 주입하므로, 실제 운영에서는 이 예외가 발생하면 안 됨.
            // 다만, 방어적으로 null 체크를 하는 것은 좋음.
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다. 서비스 계층에서 주입되었는지 확인하세요.");
        }
        this.userPswd = passwordHandler.encode(rawPassword);
    }
    
    public boolean checkPassword(String rawPassword) {
        if (this.passwordHandler == null) {
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다.");
        }
        return passwordHandler.matches(rawPassword, this.userPswd);
    }
    
    public void changePassword(String oldPassword, String newPassword) {
        if (this.passwordHandler == null) {
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다.");
        }
        this.userPswd = passwordHandler.changePassword(this.userPswd, oldPassword, newPassword);
    }
    
    public void resetPassword(String newPassword) {
        if (this.passwordHandler == null) {
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다.");
        }
        this.userPswd = passwordHandler.encode(newPassword);
    }
    
    @JsonProperty(access = JsonProperty.Access.READ_ONLY) // 이 메소드의 결과는 읽기 전용(응답에만 포함)
    public boolean isPasswordEncoded() {
        if (this.passwordHandler == null) {
            return false; // 또는 예외 발생
        }
        // userPswd가 null일 경우, passwordHandler.isEncoded에서 NullPointerException 발생 가능성 있음
        return this.userPswd != null && passwordHandler.isEncoded(this.userPswd);
    }
}