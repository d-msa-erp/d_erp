package kr.co.d_erp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.dtos.Notice;

import java.util.List;

@Repository // Spring 빈으로 등록
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // Spring Data JPA의 기본 메서드들을 자동으로 제공받습니다.
    // 예: findAll(), findById(), save(), delete() 등

    // 사용자 ID로 공지사항 목록 조회 (쿼리 메서드 예시)
    List<Notice> findByUserId(String userId);

    // 제목에 특정 문자열이 포함된 공지사항 목록 조회 (쿼리 메서드 예시)
    List<Notice> findByTitleContaining(String title);

    // 생성일 기준 내림차순으로 정렬된 공지사항 목록 조회 (쿼리 메서드 예시)
    List<Notice> findAllByOrderByCreatedAtDesc();
}