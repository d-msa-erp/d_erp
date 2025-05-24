package kr.co.d_erp.controllers;

import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.InvTransactionSearchCriteria; // InvTransactionSearchCriteria DTO import
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.VInvTransactionDetailsDto;
import kr.co.d_erp.service.InvTransactionService; // InvTransactionService import
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor; // 생성자 주입을 위해 추가
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inv-transactions")
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성 (lombok)
public class InvTransactionController {

    private final InvTransactionService invTransactionService; // 생성자 주입 방식 사용

    @GetMapping
    public ResponseEntity<PageDto<VInvTransactionDetailsDto>> getInvTransactions(
            @RequestParam(required = false) String transDateFrom,
            @RequestParam(required = false) String transDateTo,
            @RequestParam(required = false) Long itemIdx,
            @RequestParam(required = false) Long custIdx,
            @RequestParam(required = false) Long userIdx,
            @RequestParam(required = false) Long whIdx,
            @RequestParam(required = false) String transStatus,
            @RequestParam(defaultValue = "R") String transType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "transDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        // JavaScript에서 1-based 페이지 번호를 보내므로, Spring Data Pageable을 위해 0-based로 변환
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.fromString(sortDirection.toUpperCase()), sortBy));

        InvTransactionSearchCriteria criteria = new InvTransactionSearchCriteria();
        // String 날짜를 LocalDate로 변환 (DTO에서 @DateTimeFormat을 사용했다면 자동 변환 가능)
        if (transDateFrom != null && !transDateFrom.isEmpty()) {
            try {
                criteria.setTransDateFrom(LocalDate.parse(transDateFrom));
            } catch (Exception e) {
                // 날짜 파싱 오류 처리 (예: 로그 남기기 또는 기본값 설정)
                System.err.println("Error parsing transDateFrom: " + transDateFrom + e.getMessage());
            }
        }
        if (transDateTo != null && !transDateTo.isEmpty()) {
            try {
                criteria.setTransDateTo(LocalDate.parse(transDateTo));
            } catch (Exception e) {
                System.err.println("Error parsing transDateTo: " + transDateTo + e.getMessage());
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

    @GetMapping("/{invTransIdx}")
    public ResponseEntity<VInvTransactionDetailsDto> getInvTransactionById(@PathVariable Long invTransIdx) {
        try {
            VInvTransactionDetailsDto dto = invTransactionService.findTransactionById(invTransIdx);
            return ResponseEntity.ok(dto);
        } catch (jakarta.persistence.EntityNotFoundException e) { // 구체적인 예외 타입 사용
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<InvTransactionResponseDto> createInvTransaction(@Valid @RequestBody InvTransactionRequestDto requestDto) {
        // TODO: invTransactionService.createTransaction(requestDto) 호출 및 실제 로직 구현 필요
        // InvTransactionResponseDto responseDto = invTransactionService.createTransaction(requestDto);
        // return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
        InvTransactionResponseDto tempResponse = new InvTransactionResponseDto(); // 임시 응답
        tempResponse.setMessage("임시 생성 성공");
        return new ResponseEntity<>(tempResponse, HttpStatus.CREATED);
    }

    @PutMapping("/{invTransIdx}")
    public ResponseEntity<InvTransactionResponseDto> updateInvTransaction(
            @PathVariable Long invTransIdx,
            @Valid @RequestBody InvTransactionRequestDto requestDto) {
        // TODO: invTransactionService.updateTransaction(invTransIdx, requestDto) 호출 및 실제 로직 구현 필요
        // InvTransactionResponseDto responseDto = invTransactionService.updateTransaction(invTransIdx, requestDto);
        // return ResponseEntity.ok(responseDto);
        InvTransactionResponseDto tempResponse = new InvTransactionResponseDto(); // 임시 응답
        tempResponse.setMessage("임시 수정 성공");
        return ResponseEntity.ok(tempResponse);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteInvTransactions(@RequestBody List<Long> invTransIdxes) {
        // TODO: invTransactionService.deleteTransactions(invTransIdxes) 호출 및 실제 로직 구현 필요
        // invTransactionService.deleteTransactions(invTransIdxes);
        return ResponseEntity.noContent().build();
    }
}