package kr.co.d_erp.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // HTTP 상태 코드 사용
import org.springframework.http.ResponseEntity; // HTTP 응답 전체 제어
import org.springframework.web.bind.annotation.*; // @RestController, @RequestMapping 등 포함

import kr.co.d_erp.dtos.Notice;
import kr.co.d_erp.service.NoticeService;

import java.util.List;

@RestController // 이 클래스가 RESTful 웹 서비스의 컨트롤러임을 나타냅니다.
@RequestMapping("/api/notices") // 이 컨트롤러의 기본 경로를 설정합니다. 예: /api/notices 로 시작하는 요청 처리
public class NoticeController {

    private final NoticeService noticeService; // NoticeService 주입

    // 생성자 주입 (권장 방식)
    @Autowired // Spring 4.3 이상에서는 생성자가 하나만 있을 경우 생략 가능
    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    /**
     * 모든 공지사항 목록을 조회하는 API 엔드포인트
     * GET 요청이 /api/notices 경로로 오면 이 메서드가 처리합니다.
     * @return 모든 공지사항 목록 (JSON 형태로 반환)
     */
    @GetMapping // GET /api/notices 에 매핑
    public ResponseEntity<List<Notice>> getAllNotices() {
        List<Notice> notices = noticeService.getAllNotices();
        // HTTP 상태 코드 200 OK와 함께 공지사항 목록을 반환합니다.
        return ResponseEntity.ok(notices);
    }

    /**
     * 특정 ID의 공지사항을 조회하는 API 엔드포인트
     * GET 요청이 /api/notices/{nidx} 경로로 오면 이 메서드가 처리합니다.
     * 경로 변수 {nidx}는 @PathVariable Long nidx 로 받아옵니다.
     * @param nidx 조회할 공지사항의 ID
     * @return 해당 공지사항 정보 (JSON 형태) 또는 404 Not Found 응답
     */
    @GetMapping("/{nidx}") // GET /api/notices/{nidx} 에 매핑
    public ResponseEntity<Notice> getNoticeById(@PathVariable("nidx") Long nidx) {
        Notice notice = noticeService.getNoticeById(nidx);
        
        // System.out.println() 을 사용하여 콘솔에 출력
        System.out.println(">>> getNoticeById 메소드 호출. 요청된 nidx: " + nidx);
        
        if (notice != null) {
        	System.out.println("<<< nidx " + nidx + " 에 해당하는 공지사항 발견.");
            System.out.println("    조회된 Notice 객체: " + notice); // Notice 클래스의 toString() 결과가 출력됩니다.
        	
        	
            // 공지사항을 찾았으면 200 OK와 함께 반환
            return ResponseEntity.ok(notice);
        } else {
            // 공지사항을 찾지 못했으면 404 Not Found 반환
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 새로운 공지사항을 생성하는 API 엔드포인트
     * POST 요청이 /api/notices 경로로 오면 이 메서드가 처리합니다.
     * 요청 본문에 담긴 JSON 데이터를 @RequestBody Notice notice 로 받아옵니다.
     * @param notice 생성할 공지사항 정보 (nidx는 제외하고 전송)
     * @return 저장된 공지사항 정보 (nidx가 포함된 JSON 형태)
     */
    @PostMapping // POST /api/notices 에 매핑
    public ResponseEntity<Notice> createNotice(@RequestBody Notice notice) {
        // 새로 생성할 때는 nidx를 클라이언트에서 보내지 않도록 주의해야 합니다.
        // DB에서 자동 생성되므로, 여기서 notice 객체에 nidx가 설정되어 있다면 무시될 것입니다.
        Notice savedNotice = noticeService.saveNotice(notice);
        // HTTP 상태 코드 201 Created와 함께 저장된 공지사항 정보를 반환합니다.
        return ResponseEntity.status(HttpStatus.CREATED).body(savedNotice);
    }

    /**
     * 특정 ID의 공지사항을 업데이트하는 API 엔드포인트
     * PUT 요청이 /api/notices/{nidx} 경로로 오면 이 메서드가 처리합니다.
     * 경로 변수 {nidx} 와 요청 본문의 JSON 데이터를 받아옵니다.
     * @param nidx 업데이트할 공지사항의 ID
     * @param updatedNoticeData 요청 본문에 담긴 업데이트할 공지사항 정보 (nidx는 경로변수로 받음)
     * @return 업데이트된 공지사항 정보 (JSON 형태) 또는 404 Not Found 응답
     */
    @PutMapping("/{nidx}") // PUT /api/notices/{nidx} 에 매핑
    public ResponseEntity<Notice> updateNotice(@PathVariable Long nidx, @RequestBody Notice updatedNoticeData) {
        // 먼저 기존 공지사항이 있는지 확인합니다.
        Notice existingNotice = noticeService.getNoticeById(nidx);

        if (existingNotice != null) {
            // 기존 공지사항이 있으면 데이터를 업데이트합니다.
            // updatedAt 필드는 DB에서 자동으로 업데이트될 것입니다.
            existingNotice.setUserId(updatedNoticeData.getUserId()); // 필요에 따라 user_id도 수정 가능하게 하거나 제외
            existingNotice.setTitle(updatedNoticeData.getTitle());
            existingNotice.setContent(updatedNoticeData.getContent());

            // 업데이트된 Notice 객체를 저장합니다. (ID가 있으므로 업데이트)
            Notice updatedNotice = noticeService.saveNotice(existingNotice);
            // 200 OK와 함께 업데이트된 공지사항 반환
            return ResponseEntity.ok(updatedNotice);
        } else {
            // 해당 ID의 공지사항을 찾지 못했으면 404 Not Found 반환
            return ResponseEntity.notFound().build();
        }
    }

     /**
     * 특정 ID의 공지사항을 삭제하는 API 엔드포인트
     * DELETE 요청이 /api/notices/{nidx} 경로로 오면 이 메서드가 처리합니다.
     * @param nidx 삭제할 공지사항의 ID
     * @return 성공 시 204 No Content 응답, 실패 시 404 Not Found 등
     */
    @DeleteMapping("/{nidx}") // DELETE /api/notices/{nidx} 에 매핑
    public ResponseEntity<Void> deleteNotice(@PathVariable Long nidx) {
        // 삭제할 공지사항이 실제로 존재하는지 확인 (선택 사항)
        Notice existingNotice = noticeService.getNoticeById(nidx);

        if (existingNotice != null) {
            // 존재하면 삭제
            noticeService.deleteNotice(nidx);
            // 성공적으로 삭제했으나 응답 본문에 내용을 포함하지 않음 (RESTful convention)
            return ResponseEntity.noContent().build(); // 204 No Content
        } else {
            // 존재하지 않으면 404 Not Found
             return ResponseEntity.notFound().build();
        }
    }

    // ... 필요한 다른 API 엔드포인트 추가 가능
}