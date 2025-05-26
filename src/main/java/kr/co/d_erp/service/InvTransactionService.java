package kr.co.d_erp.service;

import kr.co.d_erp.domain.Order;   // kr.co.d_erp.domain.Order 엔티티 (실제 프로젝트 경로에 맞게 확인 필요)
import kr.co.d_erp.domain.TbInvTrans;
import kr.co.d_erp.domain.Usermst; // kr.co.d_erp.domain.Usermst 엔티티 (실제 프로젝트 경로에 맞게 확인 필요)
import kr.co.d_erp.domain.VInvTransactionDetails;
import kr.co.d_erp.domain.Whmst;   // kr.co.d_erp.domain.Whmst 엔티티 (실제 프로젝트 경로에 맞게 확인 필요)
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.InvTransactionSearchCriteria;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.VInvTransactionDetailsDto;
import kr.co.d_erp.repository.oracle.TbInvTransRepository;
import kr.co.d_erp.repository.oracle.VInvTransactionDetailsRepository;
// 아래 Repository들은 현재 서비스에서 직접 사용되지는 않으나, 로직 확장 시 필요할 수 있어 주석으로 남겨둡니다.
// import kr.co.d_erp.repository.oracle.WhmstRepository;
// import kr.co.d_erp.repository.oracle.OrderRepository;
// import kr.co.d_erp.repository.oracle.UsermstRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 주입
@Transactional(readOnly = true) // 기본적으로 모든 public 메소드는 읽기 전용 트랜잭션으로 설정
public class InvTransactionService {

    private final TbInvTransRepository tbInvTransRepository;
    private final VInvTransactionDetailsRepository viewRepository;

    // 참고: 연관 엔티티(Whmst, Order, Usermst 등)의 조회 및 설정은
    // 현재 구조상 컨트롤러의 mapDtoToEntity 메소드에서 처리하고 있습니다.
    // 서비스 메소드가 DTO를 직접 받거나, 연관 엔티티의 ID만 받는 경우 이 서비스 내에서 조회 로직이 필요할 수 있습니다.

    /**
     * 신규 입/출고 거래를 등록합니다.
     * 데이터베이스 트리거에 의해 생성된 invTransCode를 포함하여 DTO로 반환합니다.
     * @param transactionRequest 컨트롤러에서 변환된 TbInvTrans 엔티티 (연관 엔티티 포함)
     * @return 생성된 거래 정보 및 결과 메시지가 담긴 DTO
     */
    @Transactional // 개별 메소드에 @Transactional을 명시하여 클래스 레벨의 readOnly 설정을 오버라이드 (쓰기 작업)
    public InvTransactionResponseDto insertTransaction(TbInvTrans transactionRequest) {
        // transactionRequest의 연관 엔티티(Whmst, Order, Usermst)는
        // 컨트롤러에서 이미 조회 후 설정된 상태로 전달받는 것을 전제로 합니다.

        // 거래 상태(transStatus)가 비어있을 경우, 거래 유형(transType)에 따라 기본값 설정
        if (transactionRequest.getTransStatus() == null || transactionRequest.getTransStatus().isBlank()) {
            if ("S".equals(transactionRequest.getTransType())) {
                transactionRequest.setTransStatus("S1"); // 예: 출고 처리 기본 상태
            } else {
                transactionRequest.setTransStatus("R1"); // 예: 입고 처리 기본 상태
            }
        }

        // 거래 유형(transType)이 비어있을 경우의 처리 (현재는 컨트롤러에서 설정된 값을 신뢰)
        if (transactionRequest.getTransType() == null || transactionRequest.getTransType().isBlank()) {
            // 필수 값인 transType이 여기서도 비어있다면, 예외를 발생시키거나 기본값('R' 등)을 설정하는 로직 추가 고려 가능
        }
        // transDate, transQty, whmst 등 다른 필수 값들은 컨트롤러에서 DTO를 통해 이미 설정되었다고 가정합니다.

        // saveAndFlush: 영속성 컨텍스트의 변경 내용을 즉시 DB에 반영하여 트리거 실행을 유도하고,
        // 이후 findById 호출 시 트리거에 의해 변경된 값을 읽어올 수 있도록 합니다.
        TbInvTrans savedAndFlushed = tbInvTransRepository.saveAndFlush(transactionRequest);

        // ID로 다시 조회하여 DB 트리거 등으로 자동 생성된 invTransCode 값을 가져옵니다.
        TbInvTrans reloaded = tbInvTransRepository.findById(savedAndFlushed.getInvTransIdx())
                .orElseThrow(() -> new EntityNotFoundException("저장된 트랜잭션 데이터 재조회 실패: ID " + savedAndFlushed.getInvTransIdx()));

        // 거래 유형에 따라 응답 메시지를 동적으로 설정
        String message;
        if ("S".equals(reloaded.getTransType())) {
            message = "출고 등록 완료";
        } else if ("R".equals(reloaded.getTransType())) {
            message = "입고 등록 완료";
        } else {
            message = "창고이동 등록 완료"; // 'R', 'S' 외 다른 transType이 있는 경우 (또는 일반적인 "거래 등록 완료")
        }

        return new InvTransactionResponseDto(reloaded.getInvTransIdx(), reloaded.getInvTransCode(), message);
    }

    /**
     * 기존 입/출고 거래 정보를 수정합니다.
     * @param invTransIdx 수정할 거래의 고유 ID
     * @param transactionUpdateRequest 업데이트할 내용을 담은 TbInvTrans 객체 (컨트롤러에서 매핑됨)
     * @return 수정된 거래 정보 및 결과 메시지가 담긴 DTO
     */
    @Transactional // 쓰기 작업이므로 @Transactional 명시
    public InvTransactionResponseDto updateTransaction(Long invTransIdx, TbInvTrans transactionUpdateRequest) {
        TbInvTrans existingTransaction = tbInvTransRepository.findById(invTransIdx)
                .orElseThrow(() -> new EntityNotFoundException("수정할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx));

        // 수정 가능한 필드 업데이트
        existingTransaction.setTransDate(transactionUpdateRequest.getTransDate());
        existingTransaction.setTransQty(transactionUpdateRequest.getTransQty());
        existingTransaction.setTransStatus(transactionUpdateRequest.getTransStatus());
        existingTransaction.setUnitPrice(transactionUpdateRequest.getUnitPrice());
        existingTransaction.setRemark(transactionUpdateRequest.getRemark());
        
        // 연관관계 업데이트: transactionUpdateRequest에 포함된 연관 객체들은
        // 컨트롤러에서 ID를 통해 조회/설정된 상태로 전달됩니다.
        if (transactionUpdateRequest.getWhmst() != null) { // 창고(Whmst)는 필수 연관 객체
            existingTransaction.setWhmst(transactionUpdateRequest.getWhmst());
        }
        existingTransaction.setTbOrder(transactionUpdateRequest.getTbOrder());     // 주문(Order)은 선택적 연관 객체
        existingTransaction.setUsermst(transactionUpdateRequest.getUsermst());   // 사용자(Usermst)는 선택적 연관 객체
        
        // 거래 유형(transType)은 일반적으로 수정 대상이 아니지만, 필요시 업데이트 로직 추가
        if (transactionUpdateRequest.getTransType() != null && !transactionUpdateRequest.getTransType().isBlank()) {
           existingTransaction.setTransType(transactionUpdateRequest.getTransType());
        }

        // invTransCode(거래 코드), createdDate(생성일) 등은 수정하지 않습니다.
        TbInvTrans updatedTransaction = tbInvTransRepository.save(existingTransaction); // 변경된 내용을 저장 (JPA가 변경 감지하여 업데이트)
        
        // 수정 시 메시지는 일반적으로 "입고/출고 정보 수정 완료" 등으로 통일하거나, transType에 따라 다르게 할 수 있습니다.
        // 현재는 "입고 정보 수정 완료"로 되어 있으나, 일관성을 위해 아래와 같이 변경하는 것을 고려할 수 있습니다.
        String message;
        if ("S".equals(updatedTransaction.getTransType())) {
            message = "출고 정보 수정 완료";
        } else if ("R".equals(updatedTransaction.getTransType())) {
            message = "입고 정보 수정 완료";
        } else {
            message = "거래 정보 수정 완료";
        }
        // return new InvTransactionResponseDto(updatedTransaction.getInvTransIdx(), updatedTransaction.getInvTransCode(), message);
        // 현재 코드 유지 요청에 따라 기존 메시지 반환
        return new InvTransactionResponseDto(updatedTransaction.getInvTransIdx(), updatedTransaction.getInvTransCode(), "입고 정보 수정 완료");
    }

    /**
     * 특정 ID의 입/출고 거래를 삭제합니다. (단건 삭제)
     * @param invTransIdx 삭제할 거래의 고유 ID
     */
    @Transactional // 쓰기 작업이므로 @Transactional 명시
    public void deleteTransactionById(Long invTransIdx) {
        if (!tbInvTransRepository.existsById(invTransIdx)) {
            throw new EntityNotFoundException("삭제할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx);
        }
        tbInvTransRepository.deleteById(invTransIdx);
    }
    
    /**
     * 여러 건의 입/출고 거래를 ID 리스트를 통해 삭제합니다.
     * @param invTransIdxes 삭제할 거래 ID 리스트
     */
    @Transactional // 쓰기 작업이므로 @Transactional 명시
    public void deleteTransactions(List<Long> invTransIdxes) {
        if (invTransIdxes == null || invTransIdxes.isEmpty()) {
            return; // ID 리스트가 비어있으면 아무 작업도 하지 않음 (또는 예외 처리)
        }
        List<TbInvTrans> transactionsToDelete = tbInvTransRepository.findAllById(invTransIdxes);
        
        // 요청된 ID 개수와 실제 조회된 엔티티 개수가 다를 경우 (일부 ID가 존재하지 않는 경우) 예외 처리
        if (transactionsToDelete.size() != invTransIdxes.size()) {
            List<Long> foundIds = transactionsToDelete.stream().map(TbInvTrans::getInvTransIdx).collect(Collectors.toList());
            List<Long> notFoundIds = invTransIdxes.stream().filter(id -> !foundIds.contains(id)).collect(Collectors.toList());
            if (!notFoundIds.isEmpty()) {
                 throw new EntityNotFoundException("일부 거래 정보를 찾을 수 없어 삭제할 수 없습니다. 찾을 수 없는 ID: " + notFoundIds);
            }
        }
        tbInvTransRepository.deleteAllInBatch(transactionsToDelete); // 여러 건 삭제 시 deleteAllInBatch가 성능상 유리
    }

    // VInvTransactionDetails 엔티티를 VInvTransactionDetailsDto로 변환하는 내부 메소드
    private VInvTransactionDetailsDto convertToDto(VInvTransactionDetails entity) {
        VInvTransactionDetailsDto dto = new VInvTransactionDetailsDto();
        dto.setInvTransIdx(entity.getInvTransIdx());
        dto.setInvTransCode(entity.getInvTransCode());
        dto.setTransType(entity.getTransType());
        dto.setTransDate(entity.getTransDate());
        dto.setTransQty(entity.getTransQty());
        dto.setUnitPrice(entity.getUnitPrice());
        dto.setTransStatus(entity.getTransStatus());
        dto.setInvTransRemark(entity.getInvTransRemark());
        dto.setOrderIdx(entity.getOrderIdx());
        dto.setWhIdx(entity.getWhIdx());
        dto.setWarehouseCode(entity.getWarehouseCode());
        dto.setWhNm(entity.getWhNm());
        dto.setUserIdx(entity.getUserIdx());
        dto.setEmployeeId(entity.getEmployeeId());
        dto.setUserNm(entity.getUserNm());
        dto.setItemIdx(entity.getItemIdx());
        dto.setItemCd(entity.getItemCd());
        dto.setItemNm(entity.getItemNm());
        dto.setItemUnitNm(entity.getItemUnitNm());
        dto.setCustIdx(entity.getCustIdx());
        dto.setCustCd(entity.getCustCd());
        dto.setCustNm(entity.getCustNm());
        dto.setOrderCode(entity.getOrderCode());
        return dto;
    }

    /**
     * 검색 조건에 맞는 입/출고 거래 내역(뷰 기반)을 페이징하여 조회합니다.
     * @param criteria 검색 조건 객체
     * @param pageable 페이징 정보 객체
     * @return 페이징된 거래 내역 DTO
     */
    public PageDto<VInvTransactionDetailsDto> findTransactions(InvTransactionSearchCriteria criteria, Pageable pageable) {
        // Specification을 사용하여 동적 검색 조건 생성
        Specification<VInvTransactionDetails> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getTransType() != null && !criteria.getTransType().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("transType"), criteria.getTransType()));
            }
            if (criteria.getTransDateFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transDate"), criteria.getTransDateFrom()));
            }
            if (criteria.getTransDateTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transDate"), criteria.getTransDateTo()));
            }
            if (criteria.getItemIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("itemIdx"), criteria.getItemIdx()));
            }
            if (criteria.getCustIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("custIdx"), criteria.getCustIdx()));
            }
            if (criteria.getUserIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("userIdx"), criteria.getUserIdx()));
            }
            if (criteria.getWhIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("whIdx"), criteria.getWhIdx()));
            }
            if (criteria.getTransStatus() != null && !criteria.getTransStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("transStatus"), criteria.getTransStatus()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<VInvTransactionDetails> pageResult = viewRepository.findAll(spec, pageable);
        List<VInvTransactionDetailsDto> dtoList = pageResult.getContent().stream()
                .map(this::convertToDto) // 내부 convertToDto 메소드 사용
                .collect(Collectors.toList());

        return new PageDto<>(pageResult, dtoList);
    }

    /**
     * 특정 ID의 입/출고 거래 상세 정보(뷰 기반)를 조회합니다.
     * @param invTransIdx 조회할 거래의 고유 ID
     * @return 거래 상세 정보 DTO
     */
    public VInvTransactionDetailsDto findTransactionById(Long invTransIdx) {
        VInvTransactionDetails entity = viewRepository.findById(invTransIdx)
                .orElseThrow(() -> new EntityNotFoundException("거래 상세 정보를 찾을 수 없습니다. ID: " + invTransIdx));
        return convertToDto(entity);
    }
}