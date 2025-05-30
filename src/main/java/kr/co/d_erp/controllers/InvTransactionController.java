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

import jakarta.validation.Valid;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.InvTransactionSearchCriteria;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.StockInvRequestDto;
import kr.co.d_erp.dtos.VInvTransactionDetailsDto;
import kr.co.d_erp.service.InvTransactionService;
import kr.co.d_erp.service.StockService;

/**
 * 입/출고 거래 관련 HTTP 요청을 처리하는 REST 컨트롤러
 * 대부분의 로직은 InvTransactionService로 위임하며,
 * 요청 DTO를 받아 서비스로 전달하는 역할
 */
@RestController
@RequestMapping("/api/inv-transactions")
public class InvTransactionController {

	private final InvTransactionService invTransactionService;
	private final StockService stockService;
	private final kr.co.d_erp.repository.oracle.WhmstRepository whmstRepository;
	private final kr.co.d_erp.repository.oracle.OrderRepository orderRepository;
	private final kr.co.d_erp.repository.oracle.UsermstRepository usermstRepository;

	/**
	 * InvTransactionService 및 연관 Repository(현재는 mapDtoToEntity 용도)를 주입받는 생성자
	 * 
	 * @param invTransactionService 입/출고 거래 서비스
	 * @param whmstRepository       창고 Repository (주로 mapDtoToEntity에서 사용되었음)
	 * @param orderRepository       주문 Repository (주로 mapDtoToEntity에서 사용되었음)
	 * @param usermstRepository     사용자 Repository (주로 mapDtoToEntity에서 사용되었음)
	 */
	public InvTransactionController(InvTransactionService invTransactionService,
			StockService stockService,
			kr.co.d_erp.repository.oracle.WhmstRepository whmstRepository,
			kr.co.d_erp.repository.oracle.OrderRepository orderRepository,
			kr.co.d_erp.repository.oracle.UsermstRepository usermstRepository) {
		this.invTransactionService = invTransactionService;
		this.stockService = stockService;
		this.whmstRepository = whmstRepository;
		this.orderRepository = orderRepository;
		this.usermstRepository = usermstRepository;
	}

	/**
	 * 신규 입/출고 거래를 생성합니다. 요청된 DTO는 유효성 검사 후 서비스 계층으로 전달되어 처리
	 * @param requestDto
	 * 신규 입/출고 거래 생성을 위한 데이터 ({@link InvTransactionRequestDto})
	 * 
	 * @return 생성된 거래 정보(ID, 코드) 및 성공 메시지를 담은 {@link InvTransactionResponseDto}
	 */
	@PostMapping
	public ResponseEntity<InvTransactionResponseDto> createInvTransaction(
			@Valid @RequestBody InvTransactionRequestDto requestDto) {
		
		
		InvTransactionResponseDto responseDto = invTransactionService.insertTransaction(requestDto);
		return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
	}

	/**
	 * 기존 입/출고 거래 정보를 수정합니다. 요청된 DTO는 유효성 검사 후 서비스 계층으로 전달되어 처리됩니다. 
	 * @param invTransIdx 수정할 입/출고 거래의 고유 ID (경로 변수)
	 * @param requestDto 수정할 거래 내용을 담은 데이터 ({@link InvTransactionRequestDto})
	 * @return 수정된 거래 정보(ID, 코드) 및 성공 메시지를 담은 {@link InvTransactionResponseDto}
	 */
	@PutMapping("/{invTransIdx}")
	public ResponseEntity<InvTransactionResponseDto> updateInvTransaction(@PathVariable Long invTransIdx,
			@Valid @RequestBody InvTransactionRequestDto requestDto) {
		// 서비스의 updateTransaction 메소드가 InvTransactionRequestDto를 직접 받도록 수정되었습니다.
		InvTransactionResponseDto responseDto = invTransactionService.updateTransaction(invTransIdx, requestDto);
		return ResponseEntity.ok(responseDto);
	}

	/**
	 * 입/출고 거래 목록을 검색 조건 및 페이징 정보를 사용하여 조회
	 * 이 API는 {@link VInvTransactionDetailsDto} 기반의 뷰를 통해 데이터를 반환
	 * @param transDateFrom 검색 시작일 (YYYY-MM-DD 형식의 문자열)
	 * @param transDateTo   검색 종료일 (YYYY-MM-DD 형식의 문자열)
	 * @param itemIdx       검색할 품목의 ID
	 * @param custIdx       검색할 거래처의 ID
	 * @param userIdx       검색할 담당자의 ID
	 * @param whIdx         검색할 창고의 ID
	 * @param transStatus   검색할 거래 상태 코드
	 * @param transType     검색할 거래 유형 ('R' 또는 'S', 기본값 'R')
	 * @param page          요청 페이지 번호 (1부터 시작, 기본값 1)
	 * @param size          페이지 당 항목 수 (기본값 10)
	 * @param sortBy        정렬 기준 필드명 (VInvTransactionDetails 뷰의 필드 기준, 기본값 'invTransIdx')
	 * @param sortDirection 정렬 방향 ('asc' 또는 'desc', 기본값 'desc')
	 * @return 페이징 처리된 입/출고 거래 목록 ({@link PageDto}<{@link VInvTransactionDetailsDto}>)
	 */
	@GetMapping
	public ResponseEntity<PageDto<VInvTransactionDetailsDto>> getInvTransactions(
			@RequestParam(required = false) String transDateFrom, @RequestParam(required = false) String transDateTo,
			@RequestParam(required = false) Long itemIdx, @RequestParam(required = false) Long custIdx,
			@RequestParam(required = false) Long userIdx, @RequestParam(required = false) Long whIdx,
			@RequestParam(required = false) String transStatus, @RequestParam(defaultValue = "R") String transType,
			@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size,
			@RequestParam(defaultValue = "invTransIdx") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection) {

		Pageable pageable = PageRequest.of(page - 1, size, // Spring Data JPA의 페이지는 0부터 시작
				Sort.by(Sort.Direction.fromString(sortDirection.toUpperCase()), sortBy));

		InvTransactionSearchCriteria criteria = new InvTransactionSearchCriteria();
		if (transDateFrom != null && !transDateFrom.isEmpty()) {
			try {
				criteria.setTransDateFrom(LocalDate.parse(transDateFrom));
			} catch (Exception e) {
				// TODO: 날짜 형식 변환 오류 발생 시 적절한 오류 처리 (예: 로깅, 사용자 알림) 필요
			}
		}
		if (transDateTo != null && !transDateTo.isEmpty()) {
			try {
				criteria.setTransDateTo(LocalDate.parse(transDateTo));
			} catch (Exception e) {
				// TODO: 날짜 형식 변환 오류 발생 시 적절한 오류 처리 필요
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
	 * 특정 ID의 입/출고 거래 상세 정보를 조회
	 * 이 API는 {@link VInvTransactionDetailsDto} 기반의 뷰를 통해 데이터를 반환
	 * @param invTransIdx 조회할 입/출고 거래의 고유 ID (경로 변수)
	 * 
	 * @return 거래 상세 정보 DTO ({@link VInvTransactionDetailsDto})
	 */
	@GetMapping("/{invTransIdx}")
	public ResponseEntity<VInvTransactionDetailsDto> getInvTransactionById(@PathVariable Long invTransIdx) {
		VInvTransactionDetailsDto dto = invTransactionService.findTransactionById(invTransIdx);
		return ResponseEntity.ok(dto);
	}

	/**
	 * 특정 ID의 입/출고 거래를 삭제 (단건 삭제) 
	 * @param invTransIdx 삭제할 입/출고 거래의 고유 ID (경로 변수)
	 * 
	 * @return 성공 시 HTTP 204 No Content 응답
	 */
	@DeleteMapping("/{invTransIdx}")
	public ResponseEntity<Void> deleteInvTransaction(@PathVariable Long invTransIdx) {
		invTransactionService.deleteTransactionById(invTransIdx);
		return ResponseEntity.noContent().build();
	}

	/**
	 * 여러 건의 입/출고 거래를 삭제 (요청 본문에 ID 리스트 포함) 
	 * * @param invTransIdxes 삭제할 입/출고 거래 ID들의 리스트 (요청 본문)
	 * 
	 * @return 성공 시 HTTP 204 No Content, 
	 * 			ID 리스트가 비어있거나 null인 경우 HTTP 400 Bad Request 응답
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteInvTransactions(@RequestBody List<Long> invTransIdxes) {
		if (invTransIdxes == null || invTransIdxes.isEmpty()) {
			return ResponseEntity.badRequest().build(); // ID 리스트 유효성 검사
		}
		invTransactionService.deleteTransactions(invTransIdxes);
		return ResponseEntity.noContent().build();
	}
	
}