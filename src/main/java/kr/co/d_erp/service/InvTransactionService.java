package kr.co.d_erp.service;

import kr.co.d_erp.domain.VInvTransactionDetails;
import kr.co.d_erp.dtos.InvTransactionSearchCriteria;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.VInvTransactionDetailsDto;
import kr.co.d_erp.repository.oracle.VInvTransactionDetailsRepository;
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
@RequiredArgsConstructor
@Transactional(readOnly = true) // 조회용이므로 readOnly = true
public class InvTransactionService {

    private final VInvTransactionDetailsRepository viewRepository;

    // DTO 변환 메소드 (Entity -> DTO)
    private VInvTransactionDetailsDto convertToDto(VInvTransactionDetails entity) {
        VInvTransactionDetailsDto dto = new VInvTransactionDetailsDto();
        dto.setInvTransIdx(entity.getInvTransIdx());
        dto.setInvTransCode(entity.getInvTransCode());
        dto.setTransType(entity.getTransType());
        dto.setTransDate(entity.getTransDate());
        dto.setTransQty(entity.getTransQty());
        dto.setUnitPrice(entity.getUnitPrice());
        // totalAmount는 DTO의 getter에서 계산되거나 여기서 명시적으로 설정
        // dto.setTotalAmount(entity.getTransQty().multiply(entity.getUnitPrice())); // 예시
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

    public PageDto<VInvTransactionDetailsDto> findTransactions(InvTransactionSearchCriteria criteria, Pageable pageable) {
        Specification<VInvTransactionDetails> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // transType 필터 (입고 페이지이므로 criteria.getTransType()은 'R'일 것임)
            if (criteria.getTransType() != null && !criteria.getTransType().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("transType"), criteria.getTransType()));
            }
            // 입고일자 시작일 필터
            if (criteria.getTransDateFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transDate"), criteria.getTransDateFrom()));
            }
            // 입고일자 종료일 필터
            if (criteria.getTransDateTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transDate"), criteria.getTransDateTo()));
            }
            // 품목 ID 필터
            if (criteria.getItemIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("itemIdx"), criteria.getItemIdx()));
            }
            // 거래처 ID 필터
            if (criteria.getCustIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("custIdx"), criteria.getCustIdx()));
            }
            // 담당자 ID 필터
            if (criteria.getUserIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("userIdx"), criteria.getUserIdx()));
            }
            // 창고 ID 필터
            if (criteria.getWhIdx() != null) {
                predicates.add(criteriaBuilder.equal(root.get("whIdx"), criteria.getWhIdx()));
            }
            // 상태 필터
            if (criteria.getTransStatus() != null && !criteria.getTransStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("transStatus"), criteria.getTransStatus()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<VInvTransactionDetails> pageResult = viewRepository.findAll(spec, pageable);
        List<VInvTransactionDetailsDto> dtoList = pageResult.getContent().stream()
                .map(this::convertToDto) // convertToDto는 VInvTransactionDetails 엔티티를 DTO로 변환
                .collect(Collectors.toList());

        return new PageDto<>(pageResult, dtoList);
    }

    public VInvTransactionDetailsDto findTransactionById(Long invTransIdx) {
        VInvTransactionDetails entity = viewRepository.findById(invTransIdx)
                .orElseThrow(() -> new EntityNotFoundException("Inventory transaction not found with id: " + invTransIdx));
        return convertToDto(entity);
    }

    // CUD (Create, Update, Delete) 작업은 TB_INV_TRANS 테이블에 대한 Entity와 Repository를 사용해야 합니다.
    // 예: public InvTransactionResponseDto createTransaction(InvTransactionRequestDto requestDto) { ... }
}