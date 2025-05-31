package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.UserSelectDto;
import kr.co.d_erp.service.UsermstService;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 관리 REST 컨트롤러
 * 사용자의 CRUD 작업 및 관련 기능들을 제공합니다.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsermstController {

	private final UsermstService UsermstService;

	/**
	 * 페이징을 지원하는 사용자 목록을 조회합니다.
	 * 
	 * @param page 페이지 번호 (기본값: 0)
	 * @param size 페이지 크기 (기본값: 10)
	 * @param sortBy 정렬 기준 필드 (기본값: userId)
	 * @param sortDirection 정렬 방향 (기본값: desc)
	 * @param keyword 검색 키워드 (선택사항)
	 * @return 페이징된 사용자 목록을 포함한 ResponseEntity
	 */
	@GetMapping("/paged")
	public ResponseEntity<PageDto<Usermst>> getAllUsersWithPaging(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(defaultValue = "userId") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection,
			@RequestParam(required = false) String keyword) {
		try {
			PageDto<Usermst> users = UsermstService.findAllUsersWithPaging(page, size, sortBy, sortDirection, keyword);
			return ResponseEntity.ok(users);
		} catch (Exception e) {
			// TODO: 구체적인 로깅 및 에러 처리 구현 필요
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	/**
	 * 전체 사용자 목록을 조회합니다. (정렬 지원)
	 * 
	 * @param sortBy 정렬 기준 필드 (기본값: userStatus)
	 * @param sortDirection 정렬 방향 (기본값: desc)
	 * @param keyword 검색 키워드 (선택사항)
	 * @return 사용자 목록을 포함한 ResponseEntity
	 */
	@GetMapping
	public ResponseEntity<List<Usermst>> getAllUsers(
			@RequestParam(defaultValue = "userStatus") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection, 
			@RequestParam(required = false) String keyword) {
		try {
			List<Usermst> users = UsermstService.findAllUsers(sortBy, sortDirection, keyword);
			return ResponseEntity.ok(users);
		} catch (Exception e) {
			// TODO: 구체적인 로깅 및 에러 처리 구현 필요
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	/**
	 * 특정 사용자의 상세 정보를 조회합니다.
	 * 
	 * @param userIdx 사용자 고유 식별자
	 * @return 사용자 상세 정보를 포함한 ResponseEntity
	 */
	@GetMapping("/{idx}")
	public ResponseEntity<Usermst> getUserById(@PathVariable("idx") Long userIdx) {
		return UsermstService.getUserByIdx(userIdx)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	/**
	 * 새로운 사용자를 등록합니다.
	 * 
	 * @param usermst 등록할 사용자 정보
	 * @return 등록된 사용자 정보 또는 에러 메시지를 포함한 ResponseEntity
	 */
	@PostMapping
	public ResponseEntity<?> createUser(@RequestBody Usermst usermst) {
		System.out.println("--- Controller: createUser ---");
		System.out.println("Received userId: " + usermst.getUserId());
		System.out.println("Received userPswd from JSON: " + usermst.getUserPswd());
		System.out.println("Received userNm: " + usermst.getUserNm());
		
		try {
			Usermst newUser = UsermstService.addUser(usermst);
			return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest()
					.body(java.util.Map.of("message", e.getMessage()));
		} catch (Exception e) {
			// TODO: 운영 환경에서는 구체적인 로깅 구현 필요
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(java.util.Map.of("message", "사용자 등록 중 서버 오류가 발생했습니다: " + e.getMessage()));
		}
	}

	/**
	 * 기존 사용자의 정보를 수정합니다.
	 * 
	 * @param userIdx 수정할 사용자의 고유 식별자
	 * @param userDetails 수정할 사용자 정보
	 * @return 수정된 사용자 정보를 포함한 ResponseEntity
	 */
	@PutMapping("/{idx}")
	public ResponseEntity<Usermst> updateUser(
			@PathVariable("idx") Long userIdx, 
			@RequestBody Usermst userDetails) {
		try {
			Usermst updatedUser = UsermstService.updateUser(userIdx, userDetails);
			return ResponseEntity.ok(updatedUser);
		} catch (RuntimeException e) {
			if (e.getMessage().contains("찾을 수 없습니다")) {
				return ResponseEntity.notFound().build();
			}
			return ResponseEntity.badRequest().body(null);
		}
	}

	/**
	 * 체크박스로 선택된 여러 사용자를 일괄 삭제합니다.
	 * 
	 * @param userIdxs 삭제할 사용자 ID 목록
	 * @return 삭제 결과를 나타내는 ResponseEntity (204 No Content)
	 */
	@DeleteMapping("/delete")
	public ResponseEntity<Void> deleteUsers(@RequestBody List<Long> userIdxs) {
		try {
			UsermstService.deleteUsers(userIdxs);
			return ResponseEntity.noContent().build();
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	/**
	 * 창고 담당자 선택용 활성 사용자 목록을 조회합니다.
	 * 재직 상태가 '01'인 사용자만 반환합니다.
	 * 
	 * @return 활성 사용자 선택 정보 목록을 포함한 ResponseEntity
	 */
	@GetMapping("/active-for-selection")
	public ResponseEntity<List<UserSelectDto>> getActiveUsersForSelection() {
		List<UserSelectDto> activeUsers = UsermstService.getActiveUsersForSelection();
		return ResponseEntity.ok(activeUsers);
	}
	
	/**
	 * 선택된 사용자들의 정보를 Excel 파일로 다운로드합니다.
	 * 
	 * @param userIdxs Excel로 내보낼 사용자 ID 목록
	 * @return Excel 파일 데이터를 포함한 ResponseEntity
	 * @throws Exception Excel 생성 중 오류 발생 시
	 */
	@PostMapping("/download-excel-details")
	public ResponseEntity<byte[]> downloadSelectedEmployeeDetailsAsExcel(@RequestBody List<Long> userIdxs) {
		try {
			if (userIdxs == null || userIdxs.isEmpty()) {
				return ResponseEntity.badRequest().body(null);
			}
			
			byte[] excelData = UsermstService.generateEmployeeExcel(userIdxs);
			
			// 현재 날짜를 파일명에 포함
			String currentDate = java.time.LocalDate.now()
					.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
			String filename = String.format("employee_details_%s.xlsx", currentDate);
			
			HttpHeaders headers = new HttpHeaders();
			headers.add("Content-Disposition", "attachment; filename=\"" + filename + "\"");
			headers.add("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
			
			return ResponseEntity.ok()
					.headers(headers)
					.body(excelData);
					
		} catch (Exception e) {
			System.err.println("Excel 생성 중 오류: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}
}