package kr.co.d_erp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import kr.co.d_erp.dtos.Notice;
import kr.co.d_erp.repository.mysql.NoticeRepository;

import java.util.List;
import java.util.Optional;
// import kr.co.erp_repository.Notice; // 같은 패키지 내에 있다면 import 필요 없음
// import kr.co.erp_repository.NoticeRepository; // 같은 패키지 내에 있다면 import 필요 없음

@Service // Spring 빈으로 등록
public class NoticeService {

    private final NoticeRepository noticeRepository; // Repository 주입

    // 생성자 주입 (권장 방식)
    @Autowired // Spring 4.3 이상에서는 생성자가 하나만 있을 경우 생략 가능
    public NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    // 모든 공지사항 조회
    public List<Notice> getAllNotices() {
        // Repository의 findAll() 메서드를 호출
        return noticeRepository.findAll();
    }

    // ID로 공지사항 한 건 조회
    public Notice getNoticeById(Long nidx) {
        // Repository의 findById() 메서드 호출
        Optional<Notice> noticeOptional = noticeRepository.findById(nidx);
        // Optional에서 결과를 가져오거나, 없으면 null 반환
        return noticeOptional.orElse(null);
        // 또는 .orElseThrow(() -> new EntityNotFoundException("Notice not found with id: " + nidx)); 와 같이 예외 처리 가능
    }

    // 특정 사용자 ID의 공지사항 조회
    public List<Notice> getNoticesByUserId(String userId) {
        return noticeRepository.findByUserId(userId); // Repository에 정의한 쿼리 메서드 사용
    }

    // 공지사항 저장 또는 업데이트 (id가 없으면 저장, 있으면 업데이트)
    public Notice saveNotice(Notice notice) {
        return noticeRepository.save(notice); // save 메서드는 저장 및 업데이트를 겸합니다.
    }

    // ID로 공지사항 삭제
    public void deleteNotice(Long nidx) {
        noticeRepository.deleteById(nidx);
    }

    // ... 다른 비즈니스 로직 메서드 추가 가능
}