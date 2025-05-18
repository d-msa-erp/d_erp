package kr.co.d_erp.dtos;

import jakarta.persistence.*; // 또는 javax.persistence.*;
import java.time.LocalDateTime;

import lombok.NoArgsConstructor;
//import lombok.AllArgsConstructor; // 모든 필드를 인자로 받는 생성자가 필요한 경우
import lombok.Data;
import lombok.ToString; // toString() 메서드 자동 생성

@Data
@Entity
@Table(name = "notice")
@NoArgsConstructor // 인자 없는 기본 생성자 자동 생성 (JPA 요구사항)
//@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성 (필요에 따라 사용)
@ToString // toString() 메서드 자동 생성
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "nidx")
    private Long nidx;

    @Column(name = "user_id", nullable = false, length = 10)
    private String userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
