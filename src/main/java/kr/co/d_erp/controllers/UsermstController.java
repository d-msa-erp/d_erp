package kr.co.d_erp.controllers;

import kr.co.d_erp.dtos.Usermst;
import kr.co.d_erp.service.UsermstService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users") // API 경로 설정
@RequiredArgsConstructor
public class UsermstController {

	private final UsermstService UsermstService;
	
	//전체 리스트 출력 (+ 정렬)
	@GetMapping
	public ResponseEntity<List<Usermst>> getAllUsers(@RequestParam(defaultValue = "userStatus") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection, @RequestParam(required = false) String keyword) {
		try {
			List<Usermst> users = UsermstService.findAllUsers(sortBy, sortDirection, keyword);
			return ResponseEntity.ok(users);
		} catch (Exception e) {
			// 실제 애플리케이션에서는 더 구체적인 로깅과 에러 처리가 필요합니다.
			// 예: logger.error("Failed to retrieve users", e);
			return ResponseEntity.status(500).build();
		}
	}

	// 특정 사용자 조회
	@GetMapping("/{idx}")
	public ResponseEntity<Usermst> getUserById(@PathVariable("idx") Long userIdx) {
		return UsermstService.getUserByIdx(userIdx).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
	}

	// 사용자 추가
	@PostMapping
	public ResponseEntity<Usermst> createUser(@RequestBody Usermst Usermst) {
		try {
			Usermst newUser = UsermstService.addUser(Usermst);
			return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(null); // 간단한 예외 처리
		}
	}

	// 사용자 수정
	@PutMapping("/{idx}")
	public ResponseEntity<Usermst> updateUser(@PathVariable("idx") Long userIdx, @RequestBody Usermst userDetails) {
		try {
			Usermst updatedUser = UsermstService.updateUser(userIdx, userDetails);
			return ResponseEntity.ok(updatedUser);
		} catch (RuntimeException e) { // RuntimeException은 구체적인 예외로 변경 권장
			if (e.getMessage().contains("찾을 수 없습니다")) {
				return ResponseEntity.notFound().build();
			}
			return ResponseEntity.badRequest().body(null); // 간단한 예외 처리
		}
	}

	// 사용자 삭제 (체크박스로 선택된 여러 ID를 한 번에 삭제)
	@DeleteMapping("/delete") // 경로 변수 없이 /delete로 변경
	public ResponseEntity<Void> deleteUsers(@RequestBody List<Long> userIdxs) { // @RequestBody로 List<Long> 받기
		try {
			UsermstService.deleteUsers(userIdxs); // 서비스 메서드도 List를 받도록 수정 필요
			return ResponseEntity.noContent().build(); // 204 No Content
		} catch (RuntimeException e) {
			// 상세 에러 처리
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}
}