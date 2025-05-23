package kr.co.d_erp.domain;

import java.time.LocalDate;

import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import kr.co.d_erp.models.PasswordHandler;
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_IDX")
    private Long userIdx;

    @Column(name = "USER_ID", length = 10, nullable = false)
    private String userId;

    @Column(name = "USER_PSWD", length = 100, nullable = false)
    @JsonIgnore // 비밀번호 필드도 API 응답에 포함되지 않도록 추가하면 좋습니다.
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

    @PrePersist
    protected void onCreate() {
        if (this.userRole == null) {
            this.userRole = "01";
        }
        if (this.userStatus == null) {
            this.userStatus = "01";
        }
    }
    
    // ========== 비밀번호 관련 편의 메서드 (PasswordHandler 위임) ==========
    
    public void setPasswordHandler(PasswordHandler passwordHandler) {
        this.passwordHandler = passwordHandler;
    }
    
    public void setRawPassword(String rawPassword) {
        if (this.passwordHandler == null) {
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다");
        }
        this.userPswd = passwordHandler.encode(rawPassword);
    }
    
    public boolean checkPassword(String rawPassword) {
        if (this.passwordHandler == null) {
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다");
        }
        return passwordHandler.matches(rawPassword, this.userPswd);
    }
    
    public void changePassword(String oldPassword, String newPassword) {
        if (this.passwordHandler == null) {
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다");
        }
        this.userPswd = passwordHandler.changePassword(this.userPswd, oldPassword, newPassword);
    }
    
    public void resetPassword(String newPassword) {
        if (this.passwordHandler == null) {
            throw new IllegalStateException("PasswordHandler가 설정되지 않았습니다");
        }
        this.userPswd = passwordHandler.encode(newPassword);
    }
    
    @JsonIgnore // 창고 담당자 불러올때 JSON 직렬화에서 에러발생해서 추가
    public boolean isPasswordEncoded() {
        if (this.passwordHandler == null) {
            return false;
        }
        return passwordHandler.isEncoded(this.userPswd);
    }
}