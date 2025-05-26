package kr.co.d_erp.controllers;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import kr.co.d_erp.domain.Order; 
import kr.co.d_erp.domain.TbInvTrans;
import kr.co.d_erp.domain.Usermst; 
import kr.co.d_erp.domain.Whmst; 
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.InvTransactionSearchCriteria;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.VInvTransactionDetailsDto;
import kr.co.d_erp.repository.oracle.OrderRepository; 
import kr.co.d_erp.repository.oracle.UsermstRepository; 
import kr.co.d_erp.repository.oracle.WhmstRepository; 
import kr.co.d_erp.service.InvTransactionService;

@RestController
@RequestMapping("/api/inv-transactions")
// @RequiredArgsConstructor // 여러 Repository 주입을 위해 아래 수동 생성자 사용 중
public class InvTransactionController {

	private final InvTransactionService invTransactionService;
	private final WhmstRepository whmstRepository;
	private final OrderRepository orderRepository;
	private final UsermstRepository usermstRepository;

	// 서비스 및 각 Repository 의존성 주입을 위한 생성자
	public InvTransactionController(InvTransactionService invTransactionService, WhmstRepository whmstRepository,
			OrderRepository orderRepository, UsermstRepository usermstRepository) {
		this.invTransactionService = invTransactionService;
		this.whmstRepository = whmstRepository;
		this.orderRepository = orderRepository;
		this.usermstRepository = usermstRepository;
	}

	// InvTransactionRequestDto를 TbInvTrans 엔티티로 변환하는 내부 헬퍼 메소드
	private TbInvTrans mapDtoToEntity(InvTransactionRequestDto requestDto) {
		TbInvTrans transaction = new TbInvTrans();

		if (requestDto.getTransDate() != null) {
			transaction.setTransDate(requestDto.getTransDate());
		} else {
			transaction.setTransDate(LocalDate.now()); // DTO에 거래일자 없으면 현재 날짜로 설정 (정책에 따라 변경 가능)
		}

		// 거래 수량 (필수 값)
		if (requestDto.getTransQty() == null) {
			throw new IllegalArgumentException("거래 수량(transQty)은 필수입니다.");
		}
		transaction.setTransQty(requestDto.getTransQty());

		// 창고 (필수 값)
		if (requestDto.getWhIdx() == null) {
			throw new IllegalArgumentException("창고 ID(whIdx)는 필수입니다.");
		}
		Whmst whmst = whmstRepository.findById(requestDto.getWhIdx())
				.orElseThrow(() -> new EntityNotFoundException("창고 정보를 찾을 수 없습니다. ID: " + requestDto.getWhIdx()));
		transaction.setWhmst(whmst);

		// 거래 유형(transType), 거래 상태(transStatus) (서비스에서 기본값 처리도 가능함)
		transaction.setTransType(requestDto.getTransType());
		transaction.setTransStatus(requestDto.getTransStatus());

		// 주문 정보 (선택 사항)
		if (requestDto.getOrderIdx() != null) {
			Order order = orderRepository.findById(requestDto.getOrderIdx()).orElseThrow(
					() -> new EntityNotFoundException("주문 정보를 찾을 수 없습니다. ID: " + requestDto.getOrderIdx()));
			transaction.setTbOrder(order);
		}

		// 사용자 정보 (선택 사항)
		if (requestDto.getUserIdx() != null) {
			Usermst usermst = usermstRepository.findById(requestDto.getUserIdx()).orElseThrow(
					() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다. ID: " + requestDto.getUserIdx()));
			transaction.setUsermst(usermst);
		}

		// 단가, 비고 (선택 사항)
		transaction.setUnitPrice(requestDto.getUnitPrice());
		transaction.setRemark(requestDto.getRemark());

		return transaction;
	}

	/**
	 * 신규 입/출고 거래 생성
	 */
	@PostMapping
	public ResponseEntity<InvTransactionResponseDto> createInvTransaction(
			@Valid @RequestBody InvTransactionRequestDto requestDto) {
		TbInvTrans newTransaction = mapDtoToEntity(requestDto);
		InvTransactionResponseDto responseDto = invTransactionService.insertTransaction(newTransaction);
		return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
	}

	/**
	 * 기존 입/출고 거래 정보 수정
	 * 
	 * @param invTransIdx 수정할 거래의 ID
	 * @param requestDto  수정할 거래 내용
	 */
	@PutMapping("/{invTransIdx}")
	public ResponseEntity<InvTransactionResponseDto> updateInvTransaction(@PathVariable Long invTransIdx,
			@Valid @RequestBody InvTransactionRequestDto requestDto) {
		// DTO를 기반으로 업데이트될 내용을 가진 TbInvTrans 객체 생성 (ID는 PathVariable로 받음)
		TbInvTrans transactionUpdateRequest = mapDtoToEntity(requestDto);
		InvTransactionResponseDto responseDto = invTransactionService.updateTransaction(invTransIdx,
				transactionUpdateRequest);
		return ResponseEntity.ok(responseDto);
	}

	/**
	 * 입/출고 거래 목록 조회 (검색 조건 및 페이징 처리 포함)
	 */
	@GetMapping
	public ResponseEntity<PageDto<VInvTransactionDetailsDto>> getInvTransactions(
			// 검색 조건 파라미터
			@RequestParam(required = false) String transDateFrom, @RequestParam(required = false) String transDateTo,
			@RequestParam(required = false) Long itemIdx, @RequestParam(required = false) Long custIdx,
			@RequestParam(required = false) Long userIdx, @RequestParam(required = false) Long whIdx,
			@RequestParam(required = false) String transStatus, @RequestParam(defaultValue = "R") String transType, // 기본
																													// 거래
																													// 유형
																													// 'R'(입고)
			// 페이징 및 정렬 파라미터
			@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size,
			@RequestParam(defaultValue = "invTransIdx") String sortBy, // 기본 정렬 필드 (VInvTransactionDetails 뷰의 필드명 기준)
			@RequestParam(defaultValue = "desc") String sortDirection) { // 기본 정렬 방향

		Pageable pageable = PageRequest.of(page - 1, size,
				Sort.by(Sort.Direction.fromString(sortDirection.toUpperCase()), sortBy));

		InvTransactionSearchCriteria criteria = new InvTransactionSearchCriteria();
		if (transDateFrom != null && !transDateFrom.isEmpty()) {
			try {
				criteria.setTransDateFrom(LocalDate.parse(transDateFrom));
			} catch (Exception e) {
				// TODO: 날짜 파싱 오류 시 로그 기록 또는 적절한 예외 응답 처리 필요
			}
		}
		if (transDateTo != null && !transDateTo.isEmpty()) {
			try {
				criteria.setTransDateTo(LocalDate.parse(transDateTo));
			} catch (Exception e) {
				// TODO: 날짜 파싱 오류 시 로그 기록 또는 적절한 예외 응답 처리 필요
			}
		}
		criteria.setItemIdx(itemIdx);
		criteria.setCustIdx(custIdx);
		criteria.setUserIdx(userIdx);
		criteria.setWhIdx(whIdx);
		criteria.setTransStatus(transStatus);
		criteria.setTransType(transType);

		PageDto<VInvTransactionDetailsDto> resultPageDto = invTransactionService.findTransactions(criteria, pageable);
		return ResponseEntity.ok(resultPageDto);
	}

	/**
	 * 특정 ID의 입/출고 거래 상세 정보 조회
	 * 
	 * @param invTransIdx 조회할 거래의 ID
	 */
	@GetMapping("/{invTransIdx}")
	public ResponseEntity<VInvTransactionDetailsDto> getInvTransactionById(@PathVariable Long invTransIdx) {
		// 이 메소드는 VInvTransactionDetailsDto(뷰 기반 DTO)를 반환하므로, 서비스의 findTransactionById를
		// 사용합니다.
		VInvTransactionDetailsDto dto = invTransactionService.findTransactionById(invTransIdx);
		return ResponseEntity.ok(dto);
	}

	/**
	 * 특정 ID의 입/출고 거래 삭제 (단건)
	 * 
	 * @param invTransIdx 삭제할 거래의 ID
	 */
	@DeleteMapping("/{invTransIdx}")
	public ResponseEntity<Void> deleteInvTransaction(@PathVariable Long invTransIdx) {
		invTransactionService.deleteTransactionById(invTransIdx);
		return ResponseEntity.noContent().build();
	}

	/**
	 * 여러 건의 입/출고 거래 삭제 (요청 본문에 ID 리스트 포함)
	 * 
	 * @param invTransIdxes 삭제할 거래 ID 리스트
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteInvTransactions(@RequestBody List<Long> invTransIdxes) {
		if (invTransIdxes == null || invTransIdxes.isEmpty()) {
			return ResponseEntity.badRequest().build(); // ID 리스트가 비어있거나 null인 경우 bad request 응답
		}
		invTransactionService.deleteTransactions(invTransIdxes);
		return ResponseEntity.noContent().build();
	}
}