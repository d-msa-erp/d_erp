package kr.co.d_erp.service; // 잼민이님의 실제 패키지 경로에 맞게 수정해주세요.

import kr.co.d_erp.domain.Inventory;
import kr.co.d_erp.repository.oracle.InventoryRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal; // 수량 타입 BigDecimal로 변경
import java.time.LocalDateTime;
import java.util.Optional;
import jakarta.persistence.EntityNotFoundException;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    /**
     * 특정 창고의 특정 품목 재고를 증가시킵니다.
     * 재고 레코드가 없으면 새로 생성하고, 있으면 기존 수량에 더합니다.
     * DDL에 REG_USER_IDX, MOD_USER_IDX가 없다는 가정 하에 해당 필드 처리 제거.
     * STOCK_QTY 타입을 BigDecimal로 가정 (엔티티도 BigDecimal로 수정 권장).
     * 날짜 필드명을 엔티티와 DB DDL에 맞게 createdDate, updatedDate로 가정.
     *
     * @param whIdx 창고 ID
     * @param itemIdx 품목 ID
     * @param quantityToAdd 증가시킬 수량 (BigDecimal 타입)
     * @param currentUserId 현재 작업을 수행하는 사용자 ID (DB에 감사 컬럼이 있다면 사용)
     */
    @Transactional
    public void increaseStock(Long whIdx, Long itemIdx, BigDecimal quantityToAdd, Long currentUserId) {
        if (itemIdx == null || whIdx == null || quantityToAdd == null || quantityToAdd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("품목 ID, 창고 ID, 그리고 0보다 큰 수량은 재고 증가에 필수입니다.");
        }

        Optional<Inventory> existingInventoryOpt = inventoryRepository.findByWhIdxAndItemIdx(whIdx, itemIdx);
        LocalDateTime now = LocalDateTime.now();

        if (existingInventoryOpt.isPresent()) {
            // 품목이 이미 창고에 존재하면, 수량을 업데이트합니다.
            Inventory inventory = existingInventoryOpt.get();
            // 엔티티의 stockQty가 BigDecimal이라고 가정
            inventory.setStockQty(inventory.getStockQty().add(quantityToAdd));
            inventory.setUpdatedDate(now); // 엔티티 필드명이 updatedDate라고 가정
            // 만약 TB_INVENTORY에 MOD_USER_IDX 컬럼이 있다면 아래 주석 해제
            // inventory.setModUserIdx(currentUserId); 
            inventoryRepository.save(inventory);
            System.out.println("기존 재고 업데이트: 창고ID=" + whIdx + ", 품목ID=" + itemIdx + ", 추가수량=" + quantityToAdd + ", 현재고=" + inventory.getStockQty());
        } else {
            // 품목이 창고에 없으면, 새로운 재고 레코드를 생성합니다.
            Inventory newInventory = Inventory.builder()
                    .whIdx(whIdx)
                    .itemIdx(itemIdx)
                    .stockQty(quantityToAdd) // 엔티티의 stockQty가 BigDecimal이라고 가정
                    .createdDate(now)     // 엔티티 필드명이 createdDate라고 가정
                    .updatedDate(now)     // 신규 생성 시 updatedDate도 현재 시간으로 설정
                    // 만약 TB_INVENTORY에 REG_USER_IDX, MOD_USER_IDX 컬럼이 있다면 아래 주석 해제
                    // .regUserIdx(currentUserId)
                    // .modUserIdx(currentUserId)
                    .build();
            inventoryRepository.save(newInventory);
            System.out.println("신규 재고 생성: 창고ID=" + whIdx + ", 품목ID=" + itemIdx + ", 수량=" + quantityToAdd);
        }
    }

    /**
     * 특정 창고의 특정 품목 재고를 감소시킵니다.
     * DDL에 REG_USER_IDX, MOD_USER_IDX가 없다는 가정 하에 해당 필드 처리 제거.
     * STOCK_QTY 타입을 BigDecimal로 가정 (엔티티도 BigDecimal로 수정 권장).
     * 날짜 필드명을 엔티티와 DB DDL에 맞게 createdDate, updatedDate로 가정.
     *
     * @param whIdx 창고 ID
     * @param itemIdx 품목 ID
     * @param quantityToDecrease 감소시킬 수량 (BigDecimal 타입)
     * @param currentUserId 현재 작업을 수행하는 사용자 ID (DB에 감사 컬럼이 있다면 사용)
     */
    @Transactional
    public void decreaseStock(Long whIdx, Long itemIdx, BigDecimal quantityToDecrease, Long currentUserId) {
        if (itemIdx == null || whIdx == null || quantityToDecrease == null || quantityToDecrease.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("품목 ID, 창고 ID, 그리고 0보다 큰 수량은 재고 감소에 필수입니다.");
        }

        Inventory inventory = inventoryRepository.findByWhIdxAndItemIdx(whIdx, itemIdx)
                .orElseThrow(() -> new EntityNotFoundException(
                        "재고 기록 없음 (감소 불가): 창고ID=" + whIdx + ", 품목ID=" + itemIdx
                ));

        // 엔티티의 stockQty가 BigDecimal이라고 가정
        BigDecimal newStockQty = inventory.getStockQty().subtract(quantityToDecrease);
        if (newStockQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException(
                    "재고 부족 (감소 불가): 창고ID=" + whIdx + ", 품목ID=" + itemIdx +
                    ", 현재고=" + inventory.getStockQty() + ", 요청량=" + quantityToDecrease
            );
        }
        inventory.setStockQty(newStockQty);
        inventory.setUpdatedDate(LocalDateTime.now()); // 엔티티 필드명이 updatedDate라고 가정
        // 만약 TB_INVENTORY에 MOD_USER_IDX 컬럼이 있다면 아래 주석 해제
        // inventory.setModUserIdx(currentUserId);
        inventoryRepository.save(inventory);
        System.out.println("재고 감소: 창고ID=" + whIdx + ", 품목ID=" + itemIdx + ", 감소수량=" + quantityToDecrease + ", 현재고=" + newStockQty);
    }
}